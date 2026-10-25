import * as THREE from "three";
import { LocAR, DeviceOrientationControls } from "locar";
import type { LatLngAlt } from "./geoUtils";
import type { TurnType } from "./turnGuidance";

export type SceneWaypoint = LatLngAlt & {
  id: string;
  name: string;
};

export class ARRouteScene {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animationFrameId: number | null = null;

  // LocAR GPS & Device Orientation Controllers
  private locar: LocAR;
  private deviceOrientationControls: DeviceOrientationControls | null = null;
  private orientationConnected = false;

  // Visual Groups
  private pathGroup: THREE.Group;
  private markersGroup: THREE.Group;
  private beaconGroup: THREE.Group;
  private activeTurnGroup: THREE.Group;

  // Floating active turn chevron (in camera frame)
  private floatingChevronMesh: THREE.Mesh | null = null;
  private floatingRingMesh: THREE.Mesh | null = null;

  // Tube path
  private tubeMesh: THREE.Mesh | null = null;
  private tubeMaterial: THREE.MeshBasicMaterial | null = null;
  private tubeTexture: THREE.CanvasTexture | null = null;

  // Current navigation state
  private waypoints: SceneWaypoint[] = [];
  private userPosition: LatLngAlt | null = null;
  private heading: number = 0; // degrees from North (0..360)
  private activeWaypointIndex: number = 0;
  private bearingToNext: number = 0;
  private relativeAngle: number = 0; // target bearing minus device heading (-180..180)
  private isCloseToTurn: boolean = false;
  private turnType: TurnType = "straight";

  // Smooth interpolation for relative angle
  private currentRelativeAngle: number = 0;

  private isDestroyed = false;
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 1. Initialize transparent WebGL Renderer
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      const width = canvas.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 800);
      const height = canvas.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 600);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2));
    } catch (e) {
      console.warn("WebGL not available or failed to initialize:", e);
      this.renderer = null;
    }

    // 2. Scene
    this.scene = new THREE.Scene();

    // 3. Camera (65 deg FOV approximates typical phone wide-angle back cameras)
    const aspect = (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 0);
    this.scene.add(this.camera);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight.position.set(0, 20, 10);
    this.scene.add(dirLight);

    // 5. Hierarchy Groups
    this.pathGroup = new THREE.Group();
    this.markersGroup = new THREE.Group();
    this.beaconGroup = new THREE.Group();
    this.activeTurnGroup = new THREE.Group();

    this.scene.add(this.pathGroup);
    this.scene.add(this.markersGroup);
    this.scene.add(this.beaconGroup);

    // Attach active turn group to camera so it hovers in front of user's field of view
    this.camera.add(this.activeTurnGroup);

    // 6. Initialize LocAR GPS-based anchor controller
    this.locar = new LocAR(this.scene, this.camera, { gpsMinDistance: 0, gpsMinAccuracy: 100 });

    // 7. Initialize LocAR DeviceOrientationControls for compass-locked orientation
    this.initDeviceOrientation();

    // 8. Generate pulse texture for flowing teal path
    this.initPathMaterial();

    // 9. Initialize floating prominent HUD turn arrow
    this.initFloatingTurnIndicator();

    // 10. Start animation loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private initDeviceOrientation() {
    try {
      if (typeof window !== "undefined") {
        this.deviceOrientationControls = new DeviceOrientationControls(this.camera, {
          smoothingFactor: 0.2,
          enablePermissionDialog: false,
        });

        this.deviceOrientationControls.on("deviceorientationgranted", (e: any) => {
          e.target?.connect();
          this.orientationConnected = true;
        });

        this.deviceOrientationControls.on("deviceorientationerror", () => {
          this.orientationConnected = false;
        });

        this.deviceOrientationControls.init();

        if ("DeviceOrientationEvent" in window) {
          this.deviceOrientationControls.connect();
          this.orientationConnected = true;
        }
      }
    } catch (e) {
      console.warn("DeviceOrientationControls init warning:", e);
      this.deviceOrientationControls = null;
      this.orientationConnected = false;
    }
  }

  private initPathMaterial() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, "rgba(6, 182, 212, 0.4)");
      grad.addColorStop(0.5, "rgba(34, 211, 238, 0.95)");
      grad.addColorStop(1, "rgba(6, 182, 212, 0.4)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 64);

      // Bright directional chevrons
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i + 40, 32);
        ctx.lineTo(i + 15, 8);
        ctx.lineTo(i + 25, 32);
        ctx.lineTo(i + 15, 56);
        ctx.closePath();
        ctx.fill();
      }
    }

    this.tubeTexture = new THREE.CanvasTexture(canvas);
    this.tubeTexture.wrapS = THREE.RepeatWrapping;
    this.tubeTexture.wrapT = THREE.RepeatWrapping;
    this.tubeTexture.repeat.set(10, 1);

    this.tubeMaterial = new THREE.MeshBasicMaterial({
      map: this.tubeTexture,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Constructs a 3D chevron arrow geometry whose natural forward direction is -Z (North in Three.js ENU camera space).
   */
  private createChevronGeometry(width = 0.8, length = 1.0): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(0, length * 0.5);
    shape.lineTo(width * 0.5, -length * 0.5);
    shape.lineTo(width * 0.22, -length * 0.18);
    shape.lineTo(0, -length * 0.04);
    shape.lineTo(-width * 0.22, -length * 0.18);
    shape.lineTo(-width * 0.5, -length * 0.5);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    geo.center();
    geo.rotateX(-Math.PI / 2);
    return geo;
  }

  /**
   * Initializes the floating immediate turn indicator that hovers right in the user's field of view.
   */
  private initFloatingTurnIndicator() {
    const chevronGeo = this.createChevronGeometry(0.7, 0.9);
    const chevronMat = new THREE.MeshBasicMaterial({
      color: 0xf3c64f, // Bright gold/amber
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });

    this.floatingChevronMesh = new THREE.Mesh(chevronGeo, chevronMat);
    // Position 2.2m ahead, 0.65m below eye level
    this.floatingChevronMesh.position.set(0, -0.65, -2.2);
    this.floatingChevronMesh.rotation.x = Math.PI / 12;

    // Glowing pulsing halo ring underneath
    const ringGeo = new THREE.RingGeometry(0.35, 0.55, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf3c64f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      depthTest: false,
    });
    this.floatingRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.floatingRingMesh.rotation.x = -Math.PI / 2;
    this.floatingRingMesh.position.set(0, -0.68, -2.2);

    this.activeTurnGroup.add(this.floatingChevronMesh);
    this.activeTurnGroup.add(this.floatingRingMesh);
  }

  public setWaypoints(waypoints: SceneWaypoint[]) {
    this.waypoints = waypoints;
    this.rebuildScene();
  }

  public setUserPosition(position: LatLngAlt) {
    this.userPosition = position;
    // Feed updated GPS fix into LocAR GPS engine
    try {
      this.locar.fakeGps(position.longitude, position.latitude, 0, position.accuracy ?? 5);
    } catch (e) {
      console.warn("LocAR fakeGps error:", e);
    }
    this.rebuildScene();
  }

  public setHeading(degrees: number) {
    this.heading = (degrees + 360) % 360;
  }

  public setActiveWaypointIndex(index: number) {
    if (this.activeWaypointIndex !== index) {
      this.activeWaypointIndex = index;
      this.rebuildScene();
    }
  }

  public setTurnGuidance(bearingToNext: number, relativeAngle: number, isCloseToTurn: boolean, turnType: TurnType = "straight") {
    this.bearingToNext = bearingToNext;
    this.relativeAngle = relativeAngle;
    this.isCloseToTurn = isCloseToTurn;
    this.turnType = turnType;
  }

  public resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  /**
   * Rebuilds 3D route tube, waypoint chevrons, and destination beacon using LocAR world coordinates.
   */
  private rebuildScene() {
    try {
      if (this.waypoints.length < 2) return;

      // Ensure LocAR has an origin fix established before projecting
      if (!this.locar.getLastKnownLocation()) {
        const originRef = this.userPosition ?? this.waypoints[0];
        this.locar.fakeGps(originRef.longitude, originRef.latitude);
      }

      // 1. Clear previous geometry
      while (this.pathGroup.children.length > 0) {
        const obj = this.pathGroup.children[0];
        this.pathGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      }
      while (this.markersGroup.children.length > 0) {
        const obj = this.markersGroup.children[0];
        this.markersGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      }
      while (this.beaconGroup.children.length > 0) {
        const obj = this.beaconGroup.children[0];
        this.beaconGroup.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      }

      // 2. Project waypoints into LocAR 3D world space (anchored at real ground coordinates)
      const worldPoints: THREE.Vector3[] = this.waypoints.map((wp) => {
        const [x, z] = this.locar.lonLatToWorldCoords(wp.longitude, wp.latitude);
        return new THREE.Vector3(x, -1.2, z);
      });

      // 3. Build Glowing Teal Tube Path
      try {
        const curve = new THREE.CatmullRomCurve3(worldPoints, false, "catmullrom", 0.15);
        const tubeGeometry = new THREE.TubeGeometry(curve, Math.max(32, worldPoints.length * 12), 0.35, 10, false);
        this.tubeMesh = new THREE.Mesh(tubeGeometry, this.tubeMaterial!);
        this.pathGroup.add(this.tubeMesh);
      } catch {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(worldPoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 4 });
        this.pathGroup.add(new THREE.Line(lineGeo, lineMat));
      }

      // 4. Build Waypoint Chevron Arrow Markers with distinction between Next Turn vs Distant Waypoints
      for (let i = 0; i < worldPoints.length - 1; i++) {
        const curr = worldPoints[i];
        const next = worldPoints[i + 1];

        // Is this waypoint the immediate next turn?
        const isNextTurn = i === this.activeWaypointIndex || (i === 0 && this.activeWaypointIndex === 0);

        // Vector from current waypoint toward next waypoint
        const dir = new THREE.Vector3().subVectors(next, curr).normalize();

        // Forward is -Z, so rotation around Y to match dir:
        const angle = Math.atan2(-dir.x, -dir.z);

        if (isNextTurn) {
          // PROMINENT NEXT-TURN ARROW: Larger, bright amber/gold, highlighted
          const nextTurnGeo = this.createChevronGeometry(1.2, 1.5);
          const nextTurnMat = new THREE.MeshBasicMaterial({
            color: 0xf3c64f,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
          });
          const nextTurnMesh = new THREE.Mesh(nextTurnGeo, nextTurnMat);
          nextTurnMesh.position.set(curr.x, curr.y + 0.6, curr.z);
          nextTurnMesh.rotation.set(0, angle, 0);
          nextTurnMesh.userData = { isNextTurn: true, baseScale: 1.0 };
          this.markersGroup.add(nextTurnMesh);

          // Pulsing turn indicator ring on the ground at the turn
          const turnRingGeo = new THREE.RingGeometry(0.8, 1.2, 32);
          const turnRingMat = new THREE.MeshBasicMaterial({
            color: 0xf3c64f,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
          });
          const turnRingMesh = new THREE.Mesh(turnRingGeo, turnRingMat);
          turnRingMesh.rotation.x = -Math.PI / 2;
          turnRingMesh.position.set(curr.x, curr.y + 0.1, curr.z);
          turnRingMesh.userData = { isTurnRing: true };
          this.markersGroup.add(turnRingMesh);
        } else {
          // SUBSEQUENT WAYPOINT ARROWS: Smaller, subtle cyan
          const subGeo = this.createChevronGeometry(0.65, 0.8);
          const subMat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45,
          });
          const subMesh = new THREE.Mesh(subGeo, subMat);
          subMesh.position.set(curr.x, curr.y + 0.4, curr.z);
          subMesh.rotation.set(0, angle, 0);
          subMesh.userData = { isSubsequent: true };
          this.markersGroup.add(subMesh);
        }
      }

      // 5. Build Final Destination Beacon Pin with Vertical Light-Beam
      const destPos = worldPoints[worldPoints.length - 1];

      // Vertical cylindrical light beam (sky column)
      const beamGeo = new THREE.CylinderGeometry(0.2, 0.6, 25, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(destPos.x, destPos.y + 12.5, destPos.z);
      this.beaconGroup.add(beamMesh);

      // Glowing Destination Sphere
      const sphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(destPos.x, destPos.y + 1.2, destPos.z);
      this.beaconGroup.add(sphereMesh);

      // Ground Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.8, 1.4, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(destPos.x, destPos.y + 0.05, destPos.z);
      this.beaconGroup.add(ringMesh);
    } catch (err) {
      console.warn("Could not rebuild 3D AR scene:", err);
    }
  }

  private animate() {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Animate flowing texture on teal route tube
    if (this.tubeTexture) {
      this.tubeTexture.offset.x -= delta * 0.45;
    }

    // 2. Pulse and bob waypoint chevrons
    this.markersGroup.children.forEach((child) => {
      if (child.userData?.isNextTurn) {
        const pulse = 1.0 + Math.sin(elapsedTime * 3.5) * 0.12;
        child.scale.set(pulse, pulse, pulse);
        child.position.y += Math.sin(elapsedTime * 3) * 0.002;
      } else if (child.userData?.isTurnRing) {
        const ringPulse = 1.0 + Math.sin(elapsedTime * 4) * 0.18;
        child.scale.set(ringPulse, ringPulse, 1);
      } else if (child.userData?.isSubsequent) {
        child.position.y += Math.sin(elapsedTime * 2) * 0.001;
      }
    });

    // 3. Pulse and rotate destination beacon
    this.beaconGroup.rotation.y = elapsedTime * 0.75;

    // 4. Update camera orientation from LocAR DeviceOrientationControls
    if (this.deviceOrientationControls && this.orientationConnected) {
      this.deviceOrientationControls.update();
    } else if (this.heading !== null) {
      // Desktop / manual compass fallback when sensors unavailable
      const headingRad = THREE.MathUtils.degToRad(-this.heading);
      this.camera.rotation.set(0, headingRad, 0);
    }

    // 5. Update Floating Next Turn Chevron in camera view (driven by turnGuidance)
    if (this.floatingChevronMesh) {
      const targetRelAngleRad = THREE.MathUtils.degToRad(-this.relativeAngle);
      this.currentRelativeAngle += (targetRelAngleRad - this.currentRelativeAngle) * Math.min(1, delta * 12);

      this.floatingChevronMesh.rotation.set(Math.PI / 12, this.currentRelativeAngle, 0);

      const pulseSpeed = this.isCloseToTurn ? 7.0 : 3.5;
      const pulseScale = 1.0 + Math.sin(elapsedTime * pulseSpeed) * (this.isCloseToTurn ? 0.15 : 0.06);
      this.floatingChevronMesh.scale.set(pulseScale, pulseScale, pulseScale);

      const mat = this.floatingChevronMesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (this.isCloseToTurn) {
          mat.color.setHex(0xf59e0b); // Warning amber
        } else if (this.turnType === "turn-right" || this.turnType === "turn-left") {
          mat.color.setHex(0xf3c64f); // Golden yellow
        } else {
          mat.color.setHex(0x38bdf8); // Sky blue / cyan for straight ahead
        }
      }

      if (this.floatingRingMesh) {
        const ringPulse = 1.0 + Math.sin(elapsedTime * pulseSpeed) * 0.2;
        this.floatingRingMesh.scale.set(ringPulse, ringPulse, 1);
        (this.floatingRingMesh.material as THREE.MeshBasicMaterial).color.copy(mat.color);
      }
    }

    // Render
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    try {
      this.deviceOrientationControls?.dispose();
    } catch {}

    if (this.tubeTexture) {
      this.tubeTexture.dispose();
    }
    if (this.tubeMaterial) {
      this.tubeMaterial.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
