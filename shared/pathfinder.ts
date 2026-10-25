export const APP_NAME = "PathFinder Smart Campus";
export const SMALL_GRAPH_NODE_THRESHOLD = 50;
export const DEVIATION_THRESHOLD_METERS = 20;
export const REROUTE_COOLDOWN_MS = 15000;
export const WALKING_SPEED_METERS_PER_SECOND = 1.4;

export type NodeType = "gate" | "junction" | "entrance" | "office" | "room" | "lab" | "facility" | "staircase" | "outdoor";

export type CampusNode = {
  id: string;
  name: string;
  buildingId: string | null;
  buildingName: string;
  floorId: string | null;
  floorName: string;
  latitude: number;
  longitude: number;
  xCoordinate: number;
  yCoordinate: number;
  nodeType: NodeType;
  isAccessible: boolean;
  isActive: boolean;
};

export type CampusEdge = {
  id: string;
  sourceNodeId: string;
  destinationNodeId: string;
  distance: number;
  estimatedTime: number;
  isBidirectional: boolean;
  isBlocked: boolean;
  isAccessible: boolean;
  edgeType: "walkway" | "corridor" | "stairs" | "ramp";
};

export type DestinationCategory =
  | "Academic"
  | "Administration"
  | "Facility"
  | "Accommodation"
  | "Transport"
  | "Faculty Cabins"
  | "Campus";

export type Destination = {
  id: string;
  nodeId: string;
  name: string;
  category: DestinationCategory;
  buildingId: string | null;
  buildingName: string;
  floorName: string;
  description: string;
  roomNumber?: string;
  accessibilityInfo: string;
  imageUrl?: string;
  isActive: boolean;
};

export const campusBuildings = [
  { id: "admin", name: "AIET Administration Block", description: "Admissions, examination, and leadership offices." },
  { id: "cse", name: "AIET CSE & Innovation Block", description: "Computer Science department, laboratories, and innovation spaces." },
  { id: "central", name: "AIET Learning & Events Block", description: "Library, seminar, auditorium, and student facilities." },
];

export const campusFloors = [
  { id: "admin-g", buildingId: "admin", name: "Ground Floor", number: 0 },
  { id: "admin-f1", buildingId: "admin", name: "First Floor", number: 1 },
  { id: "cse-g", buildingId: "cse", name: "Ground Floor", number: 0 },
  { id: "cse-f1", buildingId: "cse", name: "First Floor", number: 1 },
  { id: "central-g", buildingId: "central", name: "Ground Floor", number: 0 },
  { id: "central-f1", buildingId: "central", name: "First Floor", number: 1 },
];

// DEMO_COORDINATES: Replace this isolated campus graph with surveyed coordinates before production deployment.
export const campusNodes: CampusNode[] = [
  { id: "gate", name: "Main Gate", buildingId: null, buildingName: "Campus Grounds", floorId: null, floorName: "Outdoor", latitude: 13.02170, longitude: 74.98105, xCoordinate: 6, yCoordinate: 56, nodeType: "gate", isAccessible: true, isActive: true },
  { id: "reception", name: "Reception Plaza", buildingId: null, buildingName: "Campus Grounds", floorId: null, floorName: "Outdoor", latitude: 13.02190, longitude: 74.98128, xCoordinate: 18, yCoordinate: 48, nodeType: "junction", isAccessible: true, isActive: true },
  { id: "square", name: "Campus Square", buildingId: null, buildingName: "Campus Grounds", floorId: null, floorName: "Outdoor", latitude: 13.02212, longitude: 74.98166, xCoordinate: 37, yCoordinate: 40, nodeType: "junction", isAccessible: true, isActive: true },
  { id: "parking", name: "Parking Area", buildingId: null, buildingName: "Campus Grounds", floorId: null, floorName: "Outdoor", latitude: 13.02155, longitude: 74.98143, xCoordinate: 15, yCoordinate: 70, nodeType: "outdoor", isAccessible: true, isActive: true },
  { id: "admin-entry", name: "Administration Entrance", buildingId: "admin", buildingName: "Administration Block", floorId: "admin-g", floorName: "Ground Floor", latitude: 13.02220, longitude: 74.98128, xCoordinate: 18, yCoordinate: 30, nodeType: "entrance", isAccessible: true, isActive: true },
  { id: "admin-office", name: "Administrative Office", buildingId: "admin", buildingName: "Administration Block", floorId: "admin-g", floorName: "Ground Floor", latitude: 13.02232, longitude: 74.98122, xCoordinate: 14, yCoordinate: 24, nodeType: "office", isAccessible: true, isActive: true },
  { id: "principal", name: "Principal Office", buildingId: "admin", buildingName: "Administration Block", floorId: "admin-f1", floorName: "First Floor", latitude: 13.02238, longitude: 74.98136, xCoordinate: 22, yCoordinate: 19, nodeType: "office", isAccessible: false, isActive: true },
  { id: "exam", name: "Examination Cell", buildingId: "admin", buildingName: "Administration Block", floorId: "admin-g", floorName: "Ground Floor", latitude: 13.02236, longitude: 74.98110, xCoordinate: 8, yCoordinate: 19, nodeType: "office", isAccessible: true, isActive: true },
  { id: "library-entry", name: "Library Entrance", buildingId: "central", buildingName: "Central Learning Block", floorId: "central-g", floorName: "Ground Floor", latitude: 13.02233, longitude: 74.98183, xCoordinate: 47, yCoordinate: 27, nodeType: "entrance", isAccessible: true, isActive: true },
  { id: "library", name: "Central Library", buildingId: "central", buildingName: "Central Learning Block", floorId: "central-g", floorName: "Ground Floor", latitude: 13.02248, longitude: 74.98192, xCoordinate: 54, yCoordinate: 22, nodeType: "facility", isAccessible: true, isActive: true },
  { id: "seminar", name: "Seminar Hall", buildingId: "central", buildingName: "Central Learning Block", floorId: "central-f1", floorName: "First Floor", latitude: 13.02258, longitude: 74.98182, xCoordinate: 48, yCoordinate: 15, nodeType: "facility", isAccessible: false, isActive: true },
  { id: "auditorium", name: "Auditorium", buildingId: "central", buildingName: "Central Learning Block", floorId: "central-g", floorName: "Ground Floor", latitude: 13.02220, longitude: 74.98210, xCoordinate: 65, yCoordinate: 32, nodeType: "facility", isAccessible: true, isActive: true },
  { id: "cafe", name: "Cafeteria", buildingId: "central", buildingName: "Central Learning Block", floorId: "central-g", floorName: "Ground Floor", latitude: 13.02192, longitude: 74.98206, xCoordinate: 64, yCoordinate: 48, nodeType: "facility", isAccessible: true, isActive: true },
  { id: "cse-entry", name: "Computing Block Entrance", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-g", floorName: "Ground Floor", latitude: 13.02192, longitude: 74.98190, xCoordinate: 52, yCoordinate: 50, nodeType: "entrance", isAccessible: true, isActive: true },
  { id: "cs-dept", name: "Computer Science Department", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-g", floorName: "Ground Floor", latitude: 13.02175, longitude: 74.98192, xCoordinate: 54, yCoordinate: 60, nodeType: "office", isAccessible: true, isActive: true },
  { id: "cse-lab", name: "CSE Laboratory", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-g", floorName: "Ground Floor", latitude: 13.02168, longitude: 74.98208, xCoordinate: 64, yCoordinate: 65, nodeType: "lab", isAccessible: true, isActive: true },
  { id: "ai-lab", name: "AI Lab", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-f1", floorName: "First Floor", latitude: 13.02156, longitude: 74.98203, xCoordinate: 61, yCoordinate: 73, nodeType: "lab", isAccessible: false, isActive: true },
  { id: "innovation", name: "Innovation Lab", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-f1", floorName: "First Floor", latitude: 13.02147, longitude: 74.98185, xCoordinate: 50, yCoordinate: 78, nodeType: "lab", isAccessible: true, isActive: true },
  { id: "cse-stairs", name: "CSE Staircase", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-g", floorName: "Ground Floor", latitude: 13.02176, longitude: 74.98178, xCoordinate: 45, yCoordinate: 60, nodeType: "staircase", isAccessible: false, isActive: true },
  { id: "cse-f1", name: "CSE First-Floor Junction", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-f1", floorName: "First Floor", latitude: 13.02165, longitude: 74.98175, xCoordinate: 43, yCoordinate: 66, nodeType: "junction", isAccessible: false, isActive: true },
  { id: "hostel", name: "Student Hostel", buildingId: null, buildingName: "Campus Grounds", floorId: null, floorName: "Outdoor", latitude: 13.02135, longitude: 74.98172, xCoordinate: 40, yCoordinate: 86, nodeType: "facility", isAccessible: true, isActive: true },
  { id: "sports", name: "Sports Complex", buildingId: null, buildingName: "Campus Grounds", floorId: null, floorName: "Outdoor", latitude: 13.02130, longitude: 74.98120, xCoordinate: 12, yCoordinate: 93, nodeType: "facility", isAccessible: true, isActive: true },
  { id: "research", name: "Research Centre", buildingId: "cse", buildingName: "Computing & Innovation Block", floorId: "cse-f1", floorName: "First Floor", latitude: 13.02142, longitude: 74.98210, xCoordinate: 66, yCoordinate: 82, nodeType: "lab", isAccessible: true, isActive: true },
];

const edge = (id: string, sourceNodeId: string, destinationNodeId: string, distance: number, edgeType: CampusEdge["edgeType"] = "walkway", isAccessible = true): CampusEdge => ({ id, sourceNodeId, destinationNodeId, distance, estimatedTime: Math.round(distance / WALKING_SPEED_METERS_PER_SECOND), isBidirectional: true, isBlocked: false, isAccessible, edgeType });

export const campusEdges: CampusEdge[] = [
  edge("e01", "gate", "reception", 35), edge("e02", "gate", "parking", 44), edge("e03", "reception", "square", 52), edge("e04", "reception", "admin-entry", 44),
  edge("e05", "admin-entry", "admin-office", 24, "corridor"), edge("e06", "admin-office", "principal", 18, "stairs", false), edge("e07", "admin-office", "exam", 25, "corridor"), edge("e08", "square", "library-entry", 42),
  edge("e09", "library-entry", "library", 26, "corridor"), edge("e10", "library", "seminar", 22, "stairs", false), edge("e11", "library-entry", "auditorium", 47), edge("e12", "square", "cafe", 46),
  edge("e13", "cafe", "auditorium", 38), edge("e14", "square", "cse-entry", 39), edge("e15", "cse-entry", "cs-dept", 28, "corridor"), edge("e16", "cs-dept", "cse-lab", 24, "corridor"),
  edge("e17", "cse-lab", "ai-lab", 21, "stairs", false), edge("e18", "cs-dept", "cse-stairs", 20, "corridor"), edge("e19", "cse-stairs", "cse-f1", 18, "stairs", false), edge("e20", "cse-f1", "ai-lab", 25, "corridor"),
  edge("e21", "cse-f1", "innovation", 27, "corridor"), edge("e22", "innovation", "research", 26, "corridor"), edge("e23", "ai-lab", "research", 19, "corridor"), edge("e24", "cse-entry", "hostel", 82),
  edge("e25", "hostel", "sports", 58), edge("e26", "parking", "sports", 61), edge("e27", "parking", "cse-entry", 74), edge("e28", "square", "hostel", 91),
  edge("e29", "gate", "cafe", 98), edge("e30", "auditorium", "cse-entry", 44), edge("e31", "library-entry", "cse-entry", 54), edge("e32", "reception", "library-entry", 69),
  edge("e33", "admin-entry", "library-entry", 63), edge("e34", "cafe", "cse-entry", 40),
];

export const destinations: Destination[] = [
  // Core Campus Gate & Landmark Destinations (with authentic photographs)
  { id: "d1", nodeId: "gate", name: "Main Gate", category: "Transport", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "Primary visitor entry portal and campus arrival landmark.", accessibilityInfo: "Step-free paved access", imageUrl: "/Images/Main Entrance.jpeg", isActive: true },
  { id: "d2", nodeId: "admin-office", name: "Main Building & Administration", category: "Administration", buildingId: "admin", buildingName: "Administration Block", floorName: "Ground Floor", description: "Admissions, administrative support, and campus leadership.", roomNumber: "A-101", accessibilityInfo: "Ramp at entrance", imageUrl: "/Images/Main Building.jpeg", isActive: true },
  { id: "d3", nodeId: "principal", name: "Principal Office", category: "Administration", buildingId: "admin", buildingName: "Administration Block", floorName: "First Floor", description: "Office of the campus principal.", roomNumber: "A-201", accessibilityInfo: "Stair access in current graph", isActive: true },
  { id: "d4", nodeId: "exam", name: "Examination Cell", category: "Administration", buildingId: "admin", buildingName: "Administration Block", floorName: "Ground Floor", description: "Examination services and academic records.", roomNumber: "A-104", accessibilityInfo: "Step-free corridor", isActive: true },
  { id: "d5", nodeId: "cs-dept", name: "Computer Science Department", category: "Academic", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Faculty offices and CSE department reception.", roomNumber: "C-102", accessibilityInfo: "Step-free entrance via HOD portal", imageUrl: "/Images/HOD Entrance.jpeg", isActive: true },
  { id: "d6", nodeId: "cse-lab", name: "CSE Laboratory", category: "Academic", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "General computer science and multimedia laboratory.", roomNumber: "C-108", accessibilityInfo: "Step-free corridor", imageUrl: "/Images/Inside the Classroom.jpeg", isActive: true },
  { id: "d7", nodeId: "ai-lab", name: "AI Lab", category: "Academic", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Artificial intelligence and machine learning laboratory.", roomNumber: "C-205", accessibilityInfo: "Stair access in current sample graph", isActive: true },
  { id: "d8", nodeId: "innovation", name: "Innovation Lab", category: "Academic", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Prototyping and student innovation workspace.", roomNumber: "C-211", accessibilityInfo: "Step-free route supported through accessible graph links", isActive: true },
  { id: "d9", nodeId: "research", name: "Research Centre", category: "Academic", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Interdisciplinary research and project collaboration space.", roomNumber: "C-214", accessibilityInfo: "Step-free route supported through accessible graph links", isActive: true },
  { id: "d10", nodeId: "library", name: "Central Library", category: "Facility", buildingId: "central", buildingName: "Central Learning Block", floorName: "Ground Floor", description: "Collections, quiet study stacks, and service desk.", roomNumber: "L-102", accessibilityInfo: "Step-free entrance", imageUrl: "/Images/Library.jpeg", isActive: true },
  { id: "d11", nodeId: "seminar", name: "Seminar Hall", category: "Facility", buildingId: "central", buildingName: "Central Learning Block", floorName: "First Floor", description: "Talks, events, and project presentations.", roomNumber: "L-201", accessibilityInfo: "Stair access in current sample graph", isActive: true },
  { id: "d12", nodeId: "auditorium", name: "Auditorium", category: "Facility", buildingId: "central", buildingName: "Central Learning Block", floorName: "Ground Floor", description: "Large-capacity campus event venue.", roomNumber: "L-110", accessibilityInfo: "Step-free entrance", isActive: true },
  { id: "d13", nodeId: "cafe", name: "Cafeteria", category: "Facility", buildingId: "central", buildingName: "Central Learning Block", floorName: "Ground Floor", description: "Food and refreshments for students and visitors.", roomNumber: "L-115", accessibilityInfo: "Step-free entrance", isActive: true },
  { id: "d14", nodeId: "hostel", name: "Student Hostel", category: "Accommodation", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "Student accommodation precinct.", accessibilityInfo: "Outdoor paved route", isActive: true },
  { id: "d15", nodeId: "parking", name: "Parking Area", category: "Transport", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "Visitor and staff parking area.", accessibilityInfo: "Outdoor paved route", isActive: true },
  { id: "d16", nodeId: "sports", name: "Sports Complex", category: "Facility", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "Outdoor recreational and sports facilities.", accessibilityInfo: "Outdoor paved route", isActive: true },

  // Campus Landmarks and Architectural Points from frontend/Images
  { id: "d17", nodeId: "square", name: "Alvas Fountain", category: "Facility", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "Central ornamental fountain plaza situated along the main campus walkway.", accessibilityInfo: "Paved outdoor square access", imageUrl: "/Images/Alvas Fountain.jpeg", isActive: true },
  { id: "d18", nodeId: "gate", name: "Canara Bank ATM Beside Entrance", category: "Facility", buildingId: null, buildingName: "Campus Grounds", floorName: "Ground Level", description: "Canara Bank 24/7 ATM facility located immediately beside the main entrance gate.", roomNumber: "ATM-1", accessibilityInfo: "Street-level ramp", imageUrl: "/Images/Canara Bank ATM Beside the Entrance.jpeg", isActive: true },
  { id: "d19", nodeId: "square", name: "Campus Community Quad", category: "Campus", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "Outdoor student and faculty gathering area in the campus center.", accessibilityInfo: "Step-free paved plaza", imageUrl: "/Images/Campus Community.jpeg", isActive: true },
  { id: "d20", nodeId: "cse-f1", name: "Department Library Room", category: "Academic", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "CSE department technical reference collection and quiet study space. (TODO: Surveyed room coordinates).", roomNumber: "C-215", accessibilityInfo: "Corridor access", imageUrl: "/Images/Department Library Room.jpeg", isActive: true },
  { id: "d21", nodeId: "cse-entry", name: "Engineering Block Complex", category: "Academic", buildingId: "cse", buildingName: "Engineering Block", floorName: "Ground Floor", description: "Main instructional engineering building hosting lecture halls and specialized labs.", accessibilityInfo: "Step-free ramp entry", imageUrl: "/Images/Engineering Block Aerial.jpeg", isActive: true },
  { id: "d22", nodeId: "reception", name: "New Building Aerial Overview", category: "Campus", buildingId: null, buildingName: "Campus Grounds", floorName: "Outdoor", description: "High-angle perspective showing the modern New Academic Block and perimeter access.", accessibilityInfo: "Paved perimeter road", imageUrl: "/Images/New Building Aerial Overview.jpeg", isActive: true },
  { id: "d23", nodeId: "library-entry", name: "New Building Entrance", category: "Academic", buildingId: "central", buildingName: "New Academic Block", floorName: "Ground Floor", description: "Main entry portal into the new academic instructional wing.", accessibilityInfo: "Step-free ground level", imageUrl: "/Images/New Building Entrance.jpeg", isActive: true },
  { id: "d24", nodeId: "square", name: "New Building Overview", category: "Academic", buildingId: "central", buildingName: "New Academic Block", floorName: "Ground Floor", description: "Frontage perspective of the state-of-the-art New Academic Building.", accessibilityInfo: "Paved walkway access", imageUrl: "/Images/New Building Overview.jpeg", isActive: true },
  { id: "d25", nodeId: "square", name: "New Building to Library Walkway", category: "Campus", buildingId: null, buildingName: "Campus Grounds", floorName: "Ground Level", description: "Pedestrian walkway connecting the New Academic Building directly to the Central Library.", accessibilityInfo: "Level paved walkway", imageUrl: "/Images/New Building to Library Walkway.jpeg", isActive: true },

  // Faculty & Staff Cabins from frontend/Images (Category: "Faculty Cabins")
  { id: "d26", nodeId: "cse-f1", name: "Abhijith L Kotian Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Abhijith L Kotian, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-208", accessibilityInfo: "Corridor access via elevator and stairs", imageUrl: "/Images/Abhijith L Kotian Cabin.jpeg", isActive: true },
  { id: "d27", nodeId: "cse-f1", name: "Anitha Rao Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Anitha Rao, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-209", accessibilityInfo: "Corridor access", imageUrl: "/Images/Anitha Rao Cabin.jpeg", isActive: true },
  { id: "d28", nodeId: "cse-f1", name: "Asif Mulla Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Asif Mulla, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-210", accessibilityInfo: "Corridor access", imageUrl: "/Images/Asif Mulla Cabin.jpeg", isActive: true },
  { id: "d29", nodeId: "cse-f1", name: "Aysha Rameela Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Aysha Rameela, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-212", accessibilityInfo: "Corridor access", imageUrl: "/Images/Aysha Rameela Cabin.jpeg", isActive: true },
  { id: "d30", nodeId: "cs-dept", name: "Chandra Naik Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Faculty cabin of Prof. Chandra Naik, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-103", accessibilityInfo: "Step-free corridor access", imageUrl: "/Images/Chandra Naik Cabin.jpeg", isActive: true },
  { id: "d31", nodeId: "cs-dept", name: "Deeksha M Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Faculty cabin of Prof. Deeksha M, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-104", accessibilityInfo: "Step-free corridor access", imageUrl: "/Images/Deeksha M Cabin.jpeg", isActive: true },
  { id: "d32", nodeId: "cs-dept", name: "Deepika Kamath Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Faculty cabin of Prof. Deepika Kamath, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-105", accessibilityInfo: "Step-free corridor access", imageUrl: "/Images/Deepika Kamath Cabin.jpeg", isActive: true },
  { id: "d33", nodeId: "cs-dept", name: "Dr Manjunath Kotari Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Executive faculty cabin of Dr. Manjunath Kotari, Professor & Head of Department, CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-101", accessibilityInfo: "Direct step-free access via HOD Entrance", imageUrl: "/Images/Dr Manjunath Kotari Cabin.jpeg", isActive: true },
  { id: "d34", nodeId: "cs-dept", name: "G Srinivasan Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Faculty cabin of Prof. G Srinivasan, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-106", accessibilityInfo: "Step-free corridor access", imageUrl: "/Images/G Srinivasan Cabin.jpeg", isActive: true },
  { id: "d35", nodeId: "cs-dept", name: "Giridhar Gowda Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "Ground Floor", description: "Faculty cabin of Prof. Giridhar Gowda, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-107", accessibilityInfo: "Step-free corridor access", imageUrl: "/Images/Giridhar Gowda Cabin.jpeg", isActive: true },
  { id: "d36", nodeId: "cse-f1", name: "H Harshavardhan Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. H Harshavardhan, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-202", accessibilityInfo: "Corridor access", imageUrl: "/Images/H Harshavardhan Cabin.jpeg", isActive: true },
  { id: "d37", nodeId: "cse-f1", name: "Jasmine Princy Lobo Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Jasmine Princy Lobo, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-203", accessibilityInfo: "Corridor access", imageUrl: "/Images/Jasmine Princy Lobo Cabin.jpeg", isActive: true },
  { id: "d38", nodeId: "cse-f1", name: "Jayendra Bandyan Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Jayendra Bandyan, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-204", accessibilityInfo: "Corridor access", imageUrl: "/Images/Jayendra Bandyan Cabin.jpeg", isActive: true },
  { id: "d39", nodeId: "cse-f1", name: "Kiran B V Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Kiran B V, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-206", accessibilityInfo: "Corridor access", imageUrl: "/Images/Kiran B V Cabin.jpeg", isActive: true },
  { id: "d40", nodeId: "cse-f1", name: "Madhusudhan S Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Madhusudhan S, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-207", accessibilityInfo: "Corridor access", imageUrl: "/Images/Madhusudhan S Cabin.jpeg", isActive: true },
  { id: "d41", nodeId: "cse-f1", name: "Mahesh D K Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Mahesh D K, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-213", accessibilityInfo: "Corridor access", imageUrl: "/Images/Mahesh D K Cabin.jpeg", isActive: true },
  { id: "d42", nodeId: "cse-f1", name: "Mahesh Kini M Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Mahesh Kini M, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-216", accessibilityInfo: "Corridor access", imageUrl: "/Images/Mahesh Kini M Cabin.jpeg", isActive: true },
  { id: "d43", nodeId: "cse-f1", name: "R Senthil Kumar Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. R Senthil Kumar, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-217", accessibilityInfo: "Corridor access", imageUrl: "/Images/R Senthil Kumar Cabin.jpeg", isActive: true },
  { id: "d44", nodeId: "cse-f1", name: "Rakshitha Rai U Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Rakshitha Rai U, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-218", accessibilityInfo: "Corridor access", imageUrl: "/Images/Rakshitha Rai U Cabin.jpeg", isActive: true },
  { id: "d45", nodeId: "cse-f1", name: "Rizwan N Shaikh Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Rizwan N Shaikh, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-219", accessibilityInfo: "Corridor access", imageUrl: "/Images/Rizwan N Shaikh Cabin.jpeg", isActive: true },
  { id: "d46", nodeId: "cse-f1", name: "Shyla B G Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Shyla B G, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-220", accessibilityInfo: "Corridor access", imageUrl: "/Images/Shyla B G Cabin.jpeg", isActive: true },
  { id: "d47", nodeId: "cse-f1", name: "Vidya Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Vidya, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-221", accessibilityInfo: "Corridor access", imageUrl: "/Images/Vidya Cabin.jpeg", isActive: true },
  { id: "d48", nodeId: "cse-f1", name: "Yogitha Cabin", category: "Faculty Cabins", buildingId: "cse", buildingName: "Computing & Innovation Block", floorName: "First Floor", description: "Faculty cabin of Prof. Yogitha, Department of CSE. (TODO: Surveyed room coordinates).", roomNumber: "C-222", accessibilityInfo: "Corridor access", imageUrl: "/Images/Yogitha Cabin.jpeg", isActive: true },
];

export const getNode = (id: string) => campusNodes.find(node => node.id === id);
export const getDestination = (id: string) => destinations.find(destination => destination.id === id);
