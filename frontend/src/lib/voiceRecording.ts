export const MAX_VOICE_RECORDING_BYTES = 8 * 1024 * 1024;
export const MAX_VOICE_RECORDING_MS = 55_000;

type MediaRecorderConstructor = {
  isTypeSupported?: (mimeType: string) => boolean;
};

export function supportsRecordedVoiceInput(environment: Pick<Navigator, "mediaDevices"> | undefined = typeof navigator === "undefined" ? undefined : navigator): boolean {
  return Boolean(environment?.mediaDevices?.getUserMedia && typeof globalThis.MediaRecorder !== "undefined");
}

export function getPreferredRecordingMimeType(mediaRecorder: MediaRecorderConstructor | undefined = typeof globalThis.MediaRecorder === "undefined" ? undefined : globalThis.MediaRecorder): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((mimeType) => mediaRecorder?.isTypeSupported?.(mimeType));
}

export function isAcceptableVoiceRecording(byteSize: number): boolean {
  return byteSize > 0 && byteSize <= MAX_VOICE_RECORDING_BYTES;
}

export async function audioBlobToBase64(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read the voice recording."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const separator = result.indexOf(",");
      resolve(separator >= 0 ? result.slice(separator + 1) : "");
    };
    reader.readAsDataURL(blob);
  });
}
