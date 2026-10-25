import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { destinations } from "./pathfinder";

describe("Destination Data Fetching & Image Mapping Validation", () => {
  const imagesDir = path.resolve(__dirname, "../frontend/Images");
  const imageFiles = fs.readdirSync(imagesDir).filter((file) => /\.(jpe?g|png|webp)$/i.test(file));

  it("confirms every image in frontend/Images has a corresponding destination in shared/pathfinder", () => {
    expect(imageFiles.length).toBe(37);

    const destinationImageUrls = destinations
      .map((d) => d.imageUrl)
      .filter((url): url is string => Boolean(url));

    for (const file of imageFiles) {
      const match = destinationImageUrls.some((url) => url.endsWith(file) || url.includes(encodeURIComponent(file)));
      expect(match, `Missing destination record for image file: ${file}`).toBe(true);
    }
  });

  it("verifies all 48 destinations exist and are active with valid categories", () => {
    expect(destinations.length).toBe(48);

    const activeDestinations = destinations.filter((d) => d.isActive);
    expect(activeDestinations.length).toBe(48);

    const facultyCabins = destinations.filter((d) => d.category === "Faculty Cabins");
    expect(facultyCabins.length).toBe(23);

    for (const cabin of facultyCabins) {
      expect(cabin.imageUrl).toBeTruthy();
      expect(cabin.name).toContain("Cabin");
    }
  });

  it("confirms all 23 faculty cabins are categorized under 'Faculty Cabins' and distinct from general landmarks", () => {
    const generalCategories = ["Academic", "Administration", "Facility", "Accommodation", "Transport", "Campus"];
    const nonCabins = destinations.filter((d) => generalCategories.includes(d.category));
    expect(nonCabins.length).toBe(25); // 48 - 23 = 25

    for (const landmark of nonCabins) {
      expect(landmark.category).not.toBe("Faculty Cabins");
    }
  });

  it("verifies landmark image filenames match without case or extension mismatch", () => {
    const landmarkWithImages = [
      { id: "d1", expectedFile: "Main Entrance.jpeg" },
      { id: "d2", expectedFile: "Main Building.jpeg" },
      { id: "d5", expectedFile: "HOD Entrance.jpeg" },
      { id: "d6", expectedFile: "Inside the Classroom.jpeg" },
      { id: "d10", expectedFile: "Library.jpeg" },
      { id: "d17", expectedFile: "Alvas Fountain.jpeg" },
      { id: "d18", expectedFile: "Canara Bank ATM Beside the Entrance.jpeg" },
      { id: "d19", expectedFile: "Campus Community.jpeg" },
      { id: "d20", expectedFile: "Department Library Room.jpeg" },
      { id: "d21", expectedFile: "Engineering Block Aerial.jpeg" },
      { id: "d22", expectedFile: "New Building Aerial Overview.jpeg" },
      { id: "d23", expectedFile: "New Building Entrance.jpeg" },
      { id: "d24", expectedFile: "New Building Overview.jpeg" },
      { id: "d25", expectedFile: "New Building to Library Walkway.jpeg" },
    ];

    for (const item of landmarkWithImages) {
      const dest = destinations.find((d) => d.id === item.id);
      expect(dest).toBeTruthy();
      expect(dest?.imageUrl).toBe(`/Images/${item.expectedFile}`);
      const filePath = path.join(imagesDir, item.expectedFile);
      expect(fs.existsSync(filePath), `File does not exist: ${filePath}`).toBe(true);
    }
  });
});
