import { Volume2 } from "lucide-react";
import React, { useState } from "react";

export const ENGLISH_ROUTE_SAMPLE = "Turn left in 30 metres.";

type EnglishRouteSampleButtonProps = {
  compact?: boolean;
  className?: string;
};

export function EnglishRouteSampleButton({ compact = false, className = "" }: EnglishRouteSampleButtonProps) {
  const [status, setStatus] = useState("English route sample is ready.");

  const playSample = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setStatus("English audio sample is unavailable in this browser. You can still read the English route prompt.");
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(ENGLISH_ROUTE_SAMPLE);
      utterance.lang = "en-IN";
      utterance.rate = 0.9;
      utterance.onend = () => setStatus("English route sample finished.");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setStatus("Playing the English route sample.");
    } catch {
      setStatus("English audio sample could not start. You can still read the English route prompt.");
    }
  };

  return (
    <div className={className}>
      <button type="button" onClick={playSample} className={compact ? "grid h-9 w-9 place-items-center rounded-lg border border-current/20 transition hover:bg-current/10 active:scale-[.97]" : "inline-flex min-h-11 items-center gap-2 border border-[#a91e42]/30 bg-[#fff7f3] px-3 py-2 text-sm font-bold text-[#7e1532] transition hover:bg-[#f8e7df] active:scale-[.97]"} aria-label="Hear an English route sample" aria-describedby={compact ? "english-sample-status-nav" : "english-sample-status"}>
        <Volume2 className="h-4 w-4" />
        {!compact && <span>Hear English</span>}
      </button>
      <p id={compact ? "english-sample-status-nav" : "english-sample-status"} className={compact ? "sr-only" : "mt-2 text-xs leading-5 text-[#62585a]"} aria-live="polite">{status}</p>
    </div>
  );
}

// Preserve existing imports while the shared control now presents the accessible English sample.
export const TuluVoiceSampleButton = EnglishRouteSampleButton;
