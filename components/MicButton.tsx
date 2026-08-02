"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

/**
 * Dictation button powered by the browser's built-in Web Speech API
 * (SpeechRecognition) — no API keys, on-device. Recognized speech is appended
 * to the composer's current text. Works in Chrome/Edge on localhost or HTTPS.
 */
export function MicButton({
  value,
  onChange,
  accent = "#7c5cff",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  accent?: string;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [insecure, setInsecure] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  const baseRef = useRef("");
  const finalRef = useRef("");
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // Voice needs a secure context: HTTPS or localhost/127.0.0.1.
    const secure =
      window.isSecureContext ||
      ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    setSupported(!!SR && secure);
    setInsecure(!!SR && !secure);
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const join = (base: string, add: string) =>
    base.trim() ? base.replace(/\s+$/, "") + " " + add : add;

  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setError(null);

    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    baseRef.current = valueRef.current;
    finalRef.current = "";

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t;
        else interim += t;
      }
      const combined = (finalRef.current + interim).replace(/\s+/g, " ").trim();
      onChange(join(baseRef.current, combined));
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setError("Microphone blocked — allow mic access for this site");
      else if (e.error === "no-speech") setError("Didn't catch that — try again");
      else if (e.error === "audio-capture") setError("No microphone found");
      else if (e.error === "aborted") setError(null);
      else setError(e.error || "Voice error");
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      /* start() can throw if already running */
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const toggle = () => (listening ? stop() : start());

  const title = insecure
    ? "Voice needs localhost or HTTPS — open the app at http://localhost:3000, not an IP address"
    : !supported
    ? "Voice input needs Chrome or Edge"
    : error
    ? error
    : listening
    ? "Stop dictation"
    : "Click to talk — dictate with your voice";

  const enabled = supported && !disabled;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!enabled}
      title={title}
      aria-label={title}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
        listening
          ? "border-transparent text-white"
          : enabled
          ? "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white"
          : "border-white/5 bg-white/[0.02] text-white/25 cursor-not-allowed"
      }`}
      style={listening ? { backgroundColor: "#fb7185" } : undefined}
    >
      {listening && (
        <span className="absolute inset-0 animate-pulse-ring rounded-xl" style={{ backgroundColor: "#fb7185" }} />
      )}
      <Mic size={16} className="relative" />
    </button>
  );
}
