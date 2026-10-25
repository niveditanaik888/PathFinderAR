import { AIChatBox, type Message } from "@/components/AIChatBox";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSpeechRecognition, speakText, stopSpeaking, supportsSpeechSynthesis } from "@/lib/browserSpeech";
import { audioBlobToBase64, getPreferredRecordingMimeType, isAcceptableVoiceRecording, MAX_VOICE_RECORDING_MS, supportsRecordedVoiceInput } from "@/lib/voiceRecording";
import { saveAssistantRouteLaunch } from "@/lib/assistantRouteLaunch";
import { AssistantRouteResult } from "@/components/AssistantRouteResult";
import { trpc } from "@/lib/trpc";
import { getAssistantErrorTranslationKey } from "@shared/assistant-errors";
import { assistantNetworkUnavailable, languageOptions, routeLaunchUnavailable, voicePermissionDenied, type LanguageCode } from "@shared/i18n";
import { voiceInputCopy } from "@shared/voice-input";
import { prepareSpokenRouteRequest, type AssistantConversationState, type GuidedRoute } from "@shared/assistant-conversation";
import { Globe2, Languages, LoaderCircle, Mic, MicOff, Route, Volume2, VolumeX } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ALVAS_ROBO_ALT, ALVAS_ROBO_IMAGE } from "@/lib/alvasRobo";

const suggestedQuestions = {
  en: ["Where is the Central Library?", "How do I reach the AI Lab?", "Which configured places have step-free access?"],
  kn: ["ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯ ಎಲ್ಲಿದೆ?", "AI ಲ್ಯಾಬ್‌ಗೆ ಹೇಗೆ ಹೋಗುವುದು?", "ಹಂತ-ಮುಕ್ತ ಪ್ರವೇಶವಿರುವ ಸ್ಥಳಗಳು ಯಾವುವು?"],
  tcy: ["ಮಧ್ಯ ಗ್ರಂಥಾಲಯ ಎಡ್ಡೆ ಉಂಡು?", "AI ಲ್ಯಾಬ್‌ಗ್ ಎಂಚಿನ ಪೋವುದು?", "ಮೆಟ್ಟಿಲು ಇಜ್ಜದ ಪ್ರವೇಶ ಉಪ್ಪುನ ಸ್ಥಳೊಲು ಯಾವುದು?"],
  hi: ["केंद्रीय पुस्तकालय कहाँ है?", "AI लैब तक कैसे पहुँचें?", "किन स्थानों पर बिना सीढ़ी प्रवेश है?"],
  ta: ["மத்திய நூலகம் எங்கே உள்ளது?", "AI ஆய்வகத்தை எப்படி அடைவது?", "படிக்கட்டு இல்லாமல் அணுகக்கூடிய இடங்கள் எவை?"],
  te: ["సెంట్రల్ లైబ్రరీ ఎక్కడ ఉంది?", "AI ల్యాబ్‌కు ఎలా చేరుకోవాలి?", "మెట్లు లేకుండా చేరుకోగల ప్రదేశాలు ఏవి?"],
  ml: ["സെൻട്രൽ ലൈബ്രറി എവിടെയാണ്?", "AI ലാബിലെത്താൻ എങ്ങനെ?", "പടികളില്ലാതെ എത്തിച്ചേരാവുന്ന സ്ഥലങ്ങൾ ഏതാണ്?"],
} as const;

export default function Assistant() {
  const { language, setLanguage, speechLocale, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [chatError, setChatError] = useState("");
  const [conversation, setConversation] = useState<AssistantConversationState | undefined>();
  const [guidedRoute, setGuidedRoute] = useState<GuidedRoute | undefined>();
  const [, setLocation] = useLocation();
  const recognitionRef = useRef<ReturnType<typeof getSpeechRecognition>>(undefined);
  const recorderRef = useRef<MediaRecorder | undefined>(undefined);
  const recorderStreamRef = useRef<MediaStream | undefined>(undefined);
  const recorderTimeoutRef = useRef<number | undefined>(undefined);
  const recorderChunksRef = useRef<Blob[]>([]);

  const assistantMutation = trpc.assistant.chat.useMutation({
    onSuccess: ({ reply, conversation: nextConversation, route }) => {
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setConversation(nextConversation);
      if (route) setGuidedRoute(route);
      setChatError("");
      if (voiceReplies) speakText(reply, language);
    },
    onError: (error) => setChatError(t(getAssistantErrorTranslationKey(error.data?.code))),
  });
  const transcriptionMutation = trpc.assistant.transcribe.useMutation({
    onSuccess: ({ text }) => {
      if (!text.trim()) {
        setVoiceStatus(voiceInputCopy[language as LanguageCode].noSpeech);
        return;
      }
      setVoiceStatus("");
      sendMessage(text, "voice");
    },
    onError: () => setVoiceStatus(voiceInputCopy[language as LanguageCode].transcriptionFailed),
  });

  const stopRecordingStream = () => {
    if (recorderTimeoutRef.current) window.clearTimeout(recorderTimeoutRef.current);
    recorderTimeoutRef.current = undefined;
    recorderStreamRef.current?.getTracks().forEach((track) => track.stop());
    recorderStreamRef.current = undefined;
  };

  useEffect(() => () => {
    recognitionRef.current?.abort();
    recorderRef.current?.stop();
    stopRecordingStream();
    stopSpeaking();
  }, []);

  const sendMessage = (content: string, inputMode: "text" | "voice" = "text") => {
    const message = (inputMode === "voice" ? prepareSpokenRouteRequest(content, sessionStorage.getItem("aiet-source") ?? undefined) : content).trim();
    if (!message || assistantMutation.isPending) return;
    if (!navigator.onLine) {
      setChatError(assistantNetworkUnavailable[language as LanguageCode]);
      return;
    }
    const history = messages
      .filter((item): item is { role: "user" | "assistant"; content: string } => item.role === "user" || item.role === "assistant")
      .slice(-6)
      .map(({ role, content: entry }) => ({ role, content: entry }));
    setMessages((current) => [...current, { role: "user", content: message }]);
    const currentSource = sessionStorage.getItem("aiet-source") ?? undefined;
    const conversationPayload: AssistantConversationState | undefined = conversation
      ? { ...conversation, sourceNodeId: conversation.sourceNodeId ?? currentSource }
      : undefined;
    assistantMutation.mutate({ message, language, history, conversation: conversationPayload });
  };

  const startRecordedVoiceInput = async (announceFallback = false) => {
    const copy = voiceInputCopy[language as LanguageCode];
    if (!supportsRecordedVoiceInput()) {
      setVoiceStatus(copy.captureUnsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { autoGainControl: true, echoCancellation: true, noiseSuppression: true },
      });
      const mimeType = getPreferredRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderStreamRef.current = stream;
      recorderChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) recorderChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stopRecordingStream();
        setListening(false);
        const blob = new Blob(recorderChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        if (!isAcceptableVoiceRecording(blob.size)) {
          setVoiceStatus(blob.size ? copy.recordingTooLong : copy.noSpeech);
          return;
        }
        setVoiceStatus(copy.transcribing);
        try {
          transcriptionMutation.mutate({
            audioBase64: await audioBlobToBase64(blob),
            mimeType: normalizeRecordedMimeType(blob.type),
            language: language as LanguageCode,
          });
        } catch {
          setVoiceStatus(copy.transcriptionFailed);
        }
      };
      recorderRef.current = recorder;
      recorder.start(900);
      recorderTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, MAX_VOICE_RECORDING_MS);
      setListening(true);
      setVoiceStatus(announceFallback ? copy.fallbackReady : copy.recording);
    } catch (error) {
      setListening(false);
      const name = error instanceof DOMException ? error.name : "";
      setVoiceStatus(name === "NotAllowedError" || name === "SecurityError" ? voicePermissionDenied[language as LanguageCode] : copy.captureUnsupported);
    }
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      return;
    }
    const recognition = getSpeechRecognition();
    if (!recognition) {
      void startRecordedVoiceInput(true);
      return;
    }
    recognition.lang = speechLocale;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) sendMessage(transcript, "voice");
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceStatus(voicePermissionDenied[language as LanguageCode]);
        return;
      }
      if (event.error === "aborted") return;
      void startRecordedVoiceInput(true);
    };
    recognition.onend = () => {
      if (recorderRef.current?.state !== "recording") setListening(false);
    };
    recognitionRef.current = recognition;
    setVoiceStatus(t("listening"));
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      void startRecordedVoiceInput(true);
    }
  };

  const toggleVoiceReplies = () => {
    if (!supportsSpeechSynthesis()) {
      setVoiceStatus(t("speechUnavailable"));
      return;
    }
    setVoiceReplies((active) => !active);
    if (voiceReplies) stopSpeaking();
  };

  return (
    <div className="min-h-screen bg-[#fffaf8] text-slate-950">
      <TopNav />
      <main className="container py-7 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#2a0a13] px-6 py-9 text-white shadow-xl shadow-[#2a0a13]/15 sm:px-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#ffd66c]/15 blur-3xl" />
          <div className="absolute inset-y-0 right-0 hidden w-[34%] overflow-hidden md:block"><div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#2a0a13]/10 to-[#2a0a13]" /><img src={ALVAS_ROBO_IMAGE} alt="" className="h-full w-full object-cover object-center opacity-80" /></div>
          <div className="relative max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffd66c]"><Globe2 className="h-4 w-4" />Alva's multilingual campus guide</p>
            <div className="mt-3 flex items-center gap-3"><img src={ALVAS_ROBO_IMAGE} alt={ALVAS_ROBO_ALT} className="h-14 w-14 rounded-2xl border border-[#ffd66c]/45 object-cover shadow-lg shadow-black/20 md:hidden" /><h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Alvas Robo</h1></div>
            <p className="mt-4 max-w-2xl text-base leading-7 text-rose-100/80">{t("assistantSubtitle")}</p>
          </div>
        </section>
        <section className="mx-auto mt-6 grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="min-w-0 rounded-[1.5rem] border border-[#eadbdc] bg-white p-3 shadow-sm sm:p-4">
            <AIChatBox messages={messages} onSendMessage={sendMessage} isLoading={assistantMutation.isPending} placeholder={t("assistantPlaceholder")} emptyStateMessage={t("assistantEmpty")} suggestedPrompts={[...suggestedQuestions[language]]} height="min(56vh, 560px)" />
            {assistantMutation.isPending && <p role="status" aria-live="polite" className="mt-3 flex items-center gap-2 rounded-xl bg-[#fff8df] px-3 py-2 text-sm font-medium text-[#6e4a00]"><LoaderCircle className="h-4 w-4 animate-spin" />{t("assistantThinking")}</p>}
            {chatError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{chatError}</p>}
            {guidedRoute && <AssistantRouteResult route={guidedRoute} accessibilityRequired={conversation?.accessibilityRequired ?? false} language={language} saveLaunch={saveAssistantRouteLaunch} navigate={setLocation} onError={() => setChatError(routeLaunchUnavailable[language as LanguageCode])} />}
          </div>
          <aside className="space-y-4">
            <section className="rounded-2xl border border-[#eadbdc] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3"><img src={ALVAS_ROBO_IMAGE} alt={ALVAS_ROBO_ALT} className="h-12 w-12 rounded-2xl border border-amber-200 object-cover shadow-sm" /><div><h2 className="font-display text-lg font-bold">Alvas Robo</h2><p className="text-sm text-slate-500">{t("assistantSourceNote")}</p></div></div>
              <div className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><Languages className="mt-0.5 h-4 w-4 shrink-0 text-[#7e132b]" /><p>{t("assistantLanguageSupport")} <span className="font-semibold">English, ಕನ್ನಡ, ತುಳು, हिन्दी, தமிழ், తెలుగు, മലയാളം.</span></p></div>
              <label className="mt-5 grid gap-1.5 text-xs font-semibold text-slate-700">
                <span>{t("language")}</span>
                <select aria-label="Voice input language" value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)} disabled={listening || transcriptionMutation.isPending} className="min-h-10 rounded-lg border border-[#d9c9cd] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#9b1d38] focus:ring-2 focus:ring-[#9b1d38]/15 disabled:cursor-not-allowed disabled:opacity-60">
                  {Object.entries(languageOptions).map(([code, option]) => <option key={code} value={code}>{option.nativeLabel} · {option.label}</option>)}
                </select>
                <span className="font-normal text-slate-500">The selected language is used for voice input and replies.</span>
              </label>
              <div className="mt-4 grid gap-2">
                <Button data-testid="voice-input-toggle" type="button" onClick={toggleListening} disabled={transcriptionMutation.isPending} variant="outline" className={listening ? "border-[#9b1d38] bg-rose-50 text-[#7e132b]" : ""}>{listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{listening ? t("stopListening") : t("startListening")}</Button>
                <Button type="button" onClick={toggleVoiceReplies} variant="outline" className={voiceReplies ? "border-[#9b1d38] bg-rose-50 text-[#7e132b]" : ""}>{voiceReplies ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}{voiceReplies ? t("voiceRepliesOn") : t("voiceRepliesOff")}</Button>
              </div>
              <p className="mt-3 rounded-xl bg-[#fff8df] px-3 py-2 text-xs leading-5 text-[#6e4a00]">Choose a language, then speak naturally. For example: “Navigate to the library.” If you have selected a source, PathFinder prepares the verified campus route immediately.</p>
              {voiceStatus && <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">{voiceStatus}</p>}
            </section>
            <section className="rounded-2xl border border-[#eadbdc] bg-[#fff8df] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b1d38]">PathFinder</p><p className="mt-2 text-sm leading-6 text-slate-700">The assistant can help identify configured places, accessibility notes, and next steps for route planning.</p><Link href="/destinations" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#7e132b] hover:text-[#9b1d38]"><Route className="h-4 w-4" />{t("assistantRoute")}</Link></section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function normalizeRecordedMimeType(mimeType: string): "audio/webm" | "audio/ogg" | "audio/wav" | "audio/mpeg" | "audio/mp4" {
  if (mimeType.startsWith("audio/ogg")) return "audio/ogg";
  if (mimeType.startsWith("audio/wav")) return "audio/wav";
  if (mimeType.startsWith("audio/mpeg") || mimeType.startsWith("audio/mp3")) return "audio/mpeg";
  if (mimeType.startsWith("audio/mp4") || mimeType.startsWith("audio/m4a")) return "audio/mp4";
  return "audio/webm";
}
