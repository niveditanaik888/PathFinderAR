import { describe, expect, it } from "vitest";
import { getPreferredRecordingMimeType, isAcceptableVoiceRecording, MAX_VOICE_RECORDING_BYTES, supportsRecordedVoiceInput } from "./voiceRecording";

describe("recorded voice fallback helpers", () => {
  it("selects a browser-supported audio format in quality order", () => {
    expect(getPreferredRecordingMimeType({ isTypeSupported: (mimeType) => mimeType === "audio/webm" })).toBe("audio/webm");
    expect(getPreferredRecordingMimeType({ isTypeSupported: () => false })).toBeUndefined();
  });

  it("accepts only non-empty recordings below the server-safe limit", () => {
    expect(isAcceptableVoiceRecording(0)).toBe(false);
    expect(isAcceptableVoiceRecording(MAX_VOICE_RECORDING_BYTES)).toBe(true);
    expect(isAcceptableVoiceRecording(MAX_VOICE_RECORDING_BYTES + 1)).toBe(false);
  });

  it("requires both microphone capture and MediaRecorder support", () => {
    expect(supportsRecordedVoiceInput(undefined)).toBe(false);
  });
});
