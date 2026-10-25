import type { Express } from "express";
import fs from "fs";
import path from "path";
import { ENV } from "./env";

export function resolveLocalCampusMedia(storageKey: string): string | null {
  const cleanKey = decodeURIComponent(storageKey).trim();
  const lower = cleanKey.toLowerCase();

  const frontendImagesDir = path.resolve(import.meta.dirname, "../../frontend/Images");
  const frontendPublicDir = path.resolve(import.meta.dirname, "../../frontend/public");

  // Check direct file existence in public or Images
  const directPublic = path.join(frontendPublicDir, cleanKey);
  if (fs.existsSync(directPublic)) return directPublic;

  const directImages = path.join(frontendImagesDir, cleanKey);
  if (fs.existsSync(directImages)) return directImages;

  // Dedicated Alva's Education Foundation logo
  if (lower.includes("logo")) {
    const logoFile = path.join(frontendPublicDir, "alvas-education-foundation-logo.png");
    if (fs.existsSync(logoFile)) return logoFile;
  }

  // Hero campus video matching https://new.aiet.org.in/
  if (lower.includes("hero") || lower.includes("video")) {
    const videoFile = path.join(frontendPublicDir, "aiet-campus-hero.mp4");
    if (fs.existsSync(videoFile)) return videoFile;
    const webmFile = path.join(frontendPublicDir, "aiet-campus-hero.webm");
    if (fs.existsSync(webmFile)) return webmFile;
  }

  // Alvas Robo mascot
  if (lower.includes("robo")) {
    const roboFile = path.join(frontendPublicDir, "alvas-robo.png");
    if (fs.existsSync(roboFile)) return roboFile;
  }

  // Campus Community
  if (lower.includes("community")) {
    return path.join(frontendImagesDir, "Campus Community.jpeg");
  }

  // Entire Campus Overview / New Building Aerial Overview
  if (lower.includes("entire") || lower.includes("aerial-overview") || lower.includes("aerial_overview")) {
    return path.join(frontendImagesDir, "New Building Aerial Overview.jpeg");
  }

  // Engineering Block Aerial
  if (lower.includes("engineering-block") || lower.includes("engineering_block") || lower.includes("aerial")) {
    return path.join(frontendImagesDir, "Engineering Block Aerial.jpeg");
  }

  // Main Entrance
  if (lower.includes("main-entrance") || lower.includes("main_entrance") || (lower.includes("entrance") && lower.includes("main"))) {
    return path.join(frontendImagesDir, "Main Entrance.jpeg");
  }

  // Canara Bank
  if (lower.includes("canara") || lower.includes("bank") || lower.includes("atm")) {
    return path.join(frontendImagesDir, "Canara Bank ATM Beside the Entrance.jpeg");
  }

  // Main Library / Central Library / Library archives
  if (lower.includes("library") && !lower.includes("walkway")) {
    return path.join(frontendImagesDir, "Library.jpeg");
  }

  // Numbered CSE Department submissions - map directly to authentic individual photos from frontend/Images
  const cseSubmissionImages = [
    "Dr Manjunath Kotari Cabin.jpeg",
    "Abhijith L Kotian Cabin.jpeg",
    "Anitha Rao Cabin.jpeg",
    "Asif Mulla Cabin.jpeg",
    "Aysha Rameela Cabin.jpeg",
    "Chandra Naik Cabin.jpeg",
    "Deeksha M Cabin.jpeg",
    "Deepika Kamath Cabin.jpeg",
    "G Srinivasan Cabin.jpeg",
    "Giridhar Gowda Cabin.jpeg",
    "H Harshavardhan Cabin.jpeg",
    "Jasmine Princy Lobo Cabin.jpeg",
    "Jayendra Bandyan Cabin.jpeg",
    "Kiran B V Cabin.jpeg",
    "Madhusudhan S Cabin.jpeg",
    "Mahesh D K Cabin.jpeg",
    "Mahesh Kini M Cabin.jpeg",
    "R Senthil Kumar Cabin.jpeg",
    "Rakshitha Rai U Cabin.jpeg",
    "Rizwan N Shaikh Cabin.jpeg",
    "Shyla B G Cabin.jpeg",
    "Vidya Cabin.jpeg",
    "Yogitha Cabin.jpeg",
    "Department Library Room.jpeg",
    "HOD Entrance.jpeg",
    "Inside the Classroom.jpeg",
    "Engineering Block Aerial.jpeg",
    "New Building to Library Walkway.jpeg",
    "New Building Overview.jpeg",
    "New Building Entrance.jpeg",
    "New Building Aerial Overview.jpeg",
    "Main Building.jpeg",
    "Library.jpeg",
    "Alvas Fountain.jpeg",
    "Campus Community.jpeg",
    "Canara Bank ATM Beside the Entrance.jpeg",
    "Main Entrance.jpeg",
    "Dr Manjunath Kotari Cabin.jpeg",
    "HOD Entrance.jpeg",
    "Inside the Classroom.jpeg",
  ];
  const subMatch = lower.match(/(?:cse-department-submission-|submission-)(\d+)/);
  if (subMatch) {
    const idx = parseInt(subMatch[1], 10) - 1;
    if (idx >= 0 && idx < cseSubmissionImages.length) {
      return path.join(frontendImagesDir, cseSubmissionImages[idx]);
    }
  }

  // Department of CSE / Room / HOD
  if (lower.includes("cse-department") || lower.includes("department-of-cse") || lower.includes("department_of_cse")) {
    return path.join(frontendImagesDir, "Department Library Room.jpeg");
  }
  if (lower.includes("hod")) {
    return path.join(frontendImagesDir, "HOD Entrance.jpeg");
  }

  // Classrooms / Sections / Common rooms
  if (lower.includes("classroom") || lower.includes("b-section") || lower.includes("common-room") || lower.includes("common_room")) {
    return path.join(frontendImagesDir, "Inside the Classroom.jpeg");
  }

  // Fountain
  if (lower.includes("fountain")) {
    return path.join(frontendImagesDir, "Alvas Fountain.jpeg");
  }

  // New building library walkway
  if (lower.includes("walkway")) {
    return path.join(frontendImagesDir, "New Building to Library Walkway.jpeg");
  }

  // New building entrance
  if (lower.includes("new-building-entrance") || lower.includes("new_building_entrance") || (lower.includes("new") && lower.includes("entrance"))) {
    return path.join(frontendImagesDir, "New Building Entrance.jpeg");
  }

  // New building overview
  if (lower.includes("new-building") || lower.includes("new_building")) {
    return path.join(frontendImagesDir, "New Building Overview.jpeg");
  }

  // Main building / MBA block
  if (lower.includes("main-building") || lower.includes("main_building") || lower.includes("mba")) {
    return path.join(frontendImagesDir, "Main Building.jpeg");
  }

  // Faculty cabins (if requested via storage key)
  if (fs.existsSync(frontendImagesDir)) {
    const files = fs.readdirSync(frontendImagesDir);
    const match = files.find(f => {
      const fn = f.toLowerCase().replace(/\.[^/.]+$/, "");
      return lower.includes(fn) || fn.includes(lower);
    });
    if (match) return path.join(frontendImagesDir, match);
  }

  // Default campus visual
  const defaultCampus = path.join(frontendImagesDir, "Main Building.jpeg");
  return fs.existsSync(defaultCampus) ? defaultCampus : null;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    const cleanKey = decodeURIComponent(key).trim().toLowerCase();
    if (cleanKey.includes("logo")) {
      const logoFile = path.resolve(import.meta.dirname, "../../frontend/public/alvas-education-foundation-logo.png");
      if (fs.existsSync(logoFile)) {
        res.set("Cache-Control", "public, max-age=86400");
        res.sendFile(logoFile);
        return;
      }
    }

    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        forgeUrl.searchParams.set("path", key);

        const forgeResp = await fetch(forgeUrl, {
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        });

        if (forgeResp.ok) {
          const { url } = (await forgeResp.json()) as { url: string };
          if (url) {
            res.set("Cache-Control", "no-store");
            res.redirect(307, url);
            return;
          }
        }
      } catch (err) {
        console.warn("[StorageProxy] forge failed, falling back to local campus asset:", err);
      }
    }

    const localFile = resolveLocalCampusMedia(key);
    if (localFile && fs.existsSync(localFile)) {
      res.set("Cache-Control", "public, max-age=86400");
      res.sendFile(localFile);
      return;
    }

    res.status(404).send("Image not found");
  });
}
