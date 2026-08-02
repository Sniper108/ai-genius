"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

/**
 * Dictation button powered by the browser's built-in Web Speech API
 * (SpeechRecognition) — no API keys, all on-device. Recognized speech is
 * appended to the composer's current text. Supported in Chrome/Edge.
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
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  const baseRef = useRef(""); // text already in the box when dictation started
  const finalRef = useRef(""); // accumulated finalized speech
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
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
        setError("Microphone permission denied");
      else if (e.error === "no-speech") setError("No speech detected — try again");
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

  const title = !supported
    ? "Voice input isn't supported in this browser (try Chrome or Edge)"
    : error
    ? error
    : listening
    ? "Stop dictation"
    : "Click to talk — dictate with your voice";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!supported || disabled}
      title={title}
      aria-label={title}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-25 ${
        listening ? "text-white" : "text-white/45 hover:bg-white/5 hover:text-white"
      }`}
      style={listening ? { backgroundColor: "#fb7185" } : undefined}
    >
      {listening && (
        <span className="absolute inset-0 animate-pulse-ring rounded-xl" style={{ backgroundColor: "#fb7185" }} />
      )}
      <Mic size={17} className="relative" style={!listening && !error ? { color: undefined } : undefined} />
    </button>
  );
}
