import { describe, expect, it } from "vitest";
import { assessLocationSample, locationQualityForAge } from "./location-quality";

describe("location quality", () => {
  const base = { latitude: 13.0217, longitude: 74.98105, accuracy: 6, timestamp: 1000 };
  it("rejects invalid and low-accuracy positions", () => {
    expect(assessLocationSample(undefined, { ...base, latitude: Number.NaN }).accepted).toBe(false);
    expect(assessLocationSample(undefined, { ...base, accuracy: 140 })).toMatchObject({ accepted: false, quality: "low-accuracy" });
  });
  it("smooths plausible consecutive GPS samples", () => {
    const result = assessLocationSample(base, { ...base, latitude: base.latitude + 0.00001, timestamp: 3000 });
    expect(result.accepted).toBe(true);
    expect(result.sample?.latitude).toBeGreaterThan(base.latitude);
    expect(result.sample?.latitude).toBeLessThan(base.latitude + 0.00001);
  });
  it("rejects stale and implausible jumps", () => {
    expect(assessLocationSample(base, { ...base, timestamp: 900 }).reason).toBe("stale");
    expect(assessLocationSample(base, { ...base, latitude: 13.03, timestamp: 2000 }).reason).toBe("implausible-jump");
  });
  it("distinguishes live, signal-lost, and unavailable states", () => {
    expect(locationQualityForAge(10_000, true, 20_000)).toBe("live");
    expect(locationQualityForAge(1_000, true, 22_000)).toBe("signal-lost");
    expect(locationQualityForAge(undefined, false, 22_000)).toBe("unavailable");
  });
});
