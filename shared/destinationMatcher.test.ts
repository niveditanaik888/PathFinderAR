import { describe, expect, it } from "vitest";
import { destinations } from "./pathfinder";
import { fuzzyMatchDestinations, resolveCampusDestination, resolveCampusSource } from "./destinationMatcher";

describe("DestinationMatcher & Fuzzy Autocomplete", () => {
  it("confirms all 48 destinations are present and matchable", () => {
    expect(destinations.length).toBe(48);
    for (const destination of destinations) {
      const results = fuzzyMatchDestinations(destination.name);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.id === destination.id)).toBe(true);
    }
  });

  it("matches landmark and lab destinations accurately", () => {
    const libraryMatch = resolveCampusDestination("Central Library");
    expect(libraryMatch?.id).toBe("d10");

    const aiLabMatch = resolveCampusDestination("AI Lab");
    expect(aiLabMatch?.id).toBe("d7");

    const fountainMatch = resolveCampusDestination("Alvas Fountain");
    expect(fountainMatch?.id).toBe("d17");

    const atmMatch = resolveCampusDestination("Canara Bank ATM");
    expect(atmMatch?.id).toBe("d18");
  });

  it("matches faculty cabins across full names and surnames", () => {
    const kotariMatch = resolveCampusDestination("dr manjunath kotari cabin");
    expect(kotariMatch?.id).toBe("d33");

    const kotariShort = resolveCampusDestination("kotari");
    expect(kotariShort?.id).toBe("d33");

    const abhijithMatch = resolveCampusDestination("abhijith kotian");
    expect(abhijithMatch?.id).toBe("d26");

    const anithaMatch = resolveCampusDestination("anitha rao");
    expect(anithaMatch?.id).toBe("d27");
  });

  it("handles typos with fuzzy matching", () => {
    // Typo: "librari" -> Central Library
    const typoLibrary = fuzzyMatchDestinations("librari");
    expect(typoLibrary.length).toBeGreaterThan(0);
    expect(typoLibrary[0].id).toBe("d10");

    // Typo: "cantin" -> Cafeteria is in results
    const typoCanteen = fuzzyMatchDestinations("cantin");
    expect(typoCanteen.length).toBeGreaterThan(0);
    expect(typoCanteen.some((d) => d.id === "d13")).toBe(true);
  });

  it("supports multilingual voice and typed aliases", () => {
    // Kannada for library
    const kannadaLibrary = resolveCampusDestination("ಗ್ರಂಥಾಲಯ");
    expect(kannadaLibrary?.id).toBe("d10");

    // Hindi for main gate
    const hindiGate = resolveCampusDestination("मुख्य द्वार");
    expect(hindiGate?.id).toBe("d1");

    // Source matching with Kannada suffix: "ಗೇಟ್‌ನಿಂದ"
    const sourceGate = resolveCampusSource("ಗೇಟ್‌ನಿಂದ");
    expect(sourceGate?.id).toBe("gate");
  });
});
