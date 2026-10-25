import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { readAssistantRouteLaunch } from "@/lib/assistantRouteLaunch";
import { continueRouteConversation, createConversationState } from "@shared/assistant-conversation";
import { voicePermissionDenied, type LanguageCode } from "@shared/i18n";

const chatMutate = vi.hoisted(() => vi.fn());
const getUserMedia = vi.hoisted(() => vi.fn());
const navigationSpy = vi.hoisted(() => vi.fn());
const transcribeMutate = vi.hoisted(() => vi.fn());

vi.mock("@/components/TopNav", () => ({ TopNav: () => <div data-testid="top-nav" /> }));
vi.mock("streamdown", () => ({ Streamdown: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    assistant: {
      chat: {
        useMutation: ({ onSuccess }: { onSuccess: (response: unknown) => void }) => ({
          isPending: false,
          mutate: (input: { message: string; language: "en" }) => chatMutate(input, onSuccess),
        }),
      },
      transcribe: {
        useMutation: ({ onSuccess }: { onSuccess: (response: { text: string; language: string }) => void }) => ({
          isPending: false,
          mutate: (input: { language: string }) => { transcribeMutate(input); onSuccess({ text: "Navigate to the library", language: input.language }); },
        }),
      },
    },
  },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/assistant", navigationSpy] };
});

class FakeMediaRecorder {
  static isTypeSupported(mimeType: string) { return mimeType === "audio/webm;codecs=opus"; }
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {}
  start() { this.state = "recording"; }
  stop() {
    if (this.state !== "recording") return;
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["voice"], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.();
  }
}

class FakeSpeechRecognition {
  static latest: FakeSpeechRecognition | undefined;
  lang = "";
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    FakeSpeechRecognition.latest = this;
  }
}

import Assistant from "./Assistant";

beforeEach(() => {
  chatMutate.mockReset();
  transcribeMutate.mockReset();
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream);
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: undefined });
  Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
  chatMutate.mockImplementation((input: { message: string; language: LanguageCode }, onSuccess: (response: unknown) => void) => {
    const response = continueRouteConversation(input.message, createConversationState(input.language));
    onSuccess({ reply: response.reply, conversation: response.state, route: response.route });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  navigationSpy.mockReset();
  sessionStorage.clear();
  localStorage.clear();
});

describe("Assistant recorded voice fallback", () => {
  it("records a natural-language direction request and launches a configured route when browser recognition is unavailable", async () => {
    sessionStorage.setItem("aiet-source", "gate");
    const user = userEvent.setup();
    render(<LanguageProvider><Assistant /></LanguageProvider>);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(getUserMedia).toHaveBeenCalledWith({ audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true } });
    expect(screen.getByRole("status").textContent).toContain("Voice input is ready");
    expect(screen.getAllByText(/Voice input is ready/)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Stop voice input" }));
    await waitFor(() => expect(chatMutate).toHaveBeenCalledWith(expect.objectContaining({ message: "from Main Gate to Central Library", language: "en" }), expect.any(Function)));
    await user.click(await screen.findByRole("button", { name: "Start voice guidance" }));
    expect(readAssistantRouteLaunch()).toMatchObject({ sourceNodeId: "gate", destinationId: "d10", autoStart: true, voiceOn: true, language: "en" });
    expect(navigationSpy).toHaveBeenLastCalledWith("/map");
  });

  it("uses the preferred selected language for on-demand recorded voice transcription", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><Assistant /></LanguageProvider>);

    await user.selectOptions(screen.getByLabelText("Voice input language"), "tcy");
    await user.click(screen.getByTestId("voice-input-toggle"));
    await user.click(screen.getByTestId("voice-input-toggle"));

    await waitFor(() => expect(transcribeMutate).toHaveBeenCalledWith(expect.objectContaining({ language: "tcy" })));
  });

  it("uses the selected language for browser recognition and shows its localized permission message", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeSpeechRecognition });
    render(<LanguageProvider><Assistant /></LanguageProvider>);

    await user.selectOptions(screen.getByLabelText("Voice input language"), "hi");
    await user.click(screen.getByTestId("voice-input-toggle"));

    expect(FakeSpeechRecognition.latest?.lang).toBe("hi-IN");
    expect(FakeSpeechRecognition.latest?.start).toHaveBeenCalledOnce();
    await act(async () => { FakeSpeechRecognition.latest?.onerror?.({ error: "not-allowed" }); });
    expect(screen.getByRole("status").textContent).toContain(voicePermissionDenied.hi);
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
