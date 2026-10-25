import { describe, expect, it } from "vitest";
import { alvasLandingContent } from "./landing-content";

describe("Alva’s landing content", () => {
  it("identifies AIET and provides the managed campus image", () => {
    expect(alvasLandingContent.institutionName).toBe("Alva’s Institute of Engineering and Technology");
    expect(alvasLandingContent.campusImage).toMatch(/^\/manus-storage\/alvas-aiet-campus-showcase_/);
  });

  it("keeps the college overview focused on campus discovery", () => {
    expect(alvasLandingContent.highlights.map((highlight) => highlight.label)).toEqual(
      expect.arrayContaining(["engineering & technology", "browser-first navigation"]),
    );
  });

  it("provides clear controls for the campus showcase motion", () => {
    expect(alvasLandingContent.rotation.activeLabel).toBe("Pause showcase motion");
    expect(alvasLandingContent.rotation.inactiveLabel).toBe("Start showcase motion");
  });

  it("uses the requested campus community photograph in the motion showcase", () => {
    expect(alvasLandingContent.campusScenes).toHaveLength(1);
    expect(alvasLandingContent.campusScenes[0]).toMatchObject({
      id: "campus-community",
      image: expect.stringMatching(/^\/manus-storage\/campus-community-group_/),
    });
  });

  it("retains all supplied campus photographs as source-aware visual landmarks and only exposes existing route handoffs", () => {
    expect(alvasLandingContent.campusPhotoArchive).toHaveLength(58);
    expect(alvasLandingContent.campusPhotoArchive.find((photo) => photo.id === "main-library")).toMatchObject({ routeDestinationId: "d10" });
    expect(alvasLandingContent.campusPhotoArchive.find((photo) => photo.id === "new-building-fountain")).not.toHaveProperty("routeDestinationId");
    expect(alvasLandingContent.campusPhotoArchive.filter((photo) => photo.category === "CSE Department")).toHaveLength(40);
  });

  it("shows Tulu directly after English and Kannada in the campus language preview", () => {
    expect(alvasLandingContent.languageExamples.map((example) => example.code)).toEqual(["en", "kn", "tcy", "hi"]);
    expect(alvasLandingContent.languageExamples[2]).toMatchObject({ label: "ತುಳು", line: expect.stringContaining("ಎಡಕ್") });
  });
});
