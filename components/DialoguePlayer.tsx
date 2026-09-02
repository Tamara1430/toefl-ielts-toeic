"use client";

import { useRef, useState } from "react";
import { Volume2, Loader2, Square, Mic2 } from "lucide-react";
import {
  ORPHEUS_VOICE_POOL,
  ORPHEUS_VOICE_POOL_MALE,
  ORPHEUS_VOICE_POOL_FEMALE,
  EDGE_TTS_VOICE_POOL,
  EDGE_TTS_VOICE_POOL_MALE,
  EDGE_TTS_VOICE_POOL_FEMALE,
} from "@/lib/examConfig";

export interface DialogueTurn {
  speaker: string;
  gender?: "male" | "female";
  text: string;
  audioUrl?: string;
}

interface Props {
  turns: DialogueTurn[];
}

// Boost factor applied via Web Audio API GainNode — native <audio> volume caps at
// 100%, which isn't loud enough for some Orpheus TTS output.
const VOLUME_BOOST = 3.5;

const SPEAKER_BADGE_COLORS = [
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
];

// Gender-aware voice assignment (matches lib/audioGeneration.ts's server-side
// logic) — only used as a live fallback for older cached-audio-less
// questions. If the question has a declared gender per speaker, this picks a
// matching voice; otherwise falls back to the old alternating pool.
function buildSpeakerMap(turns: DialogueTurn[]) {
  const map = new Map<string, { voice: string; edgeVoice: string; colorClass: string }>();
  let maleIndex = 0;
  let femaleIndex = 0;
  let fallbackIndex = 0;
  let colorIndex = 0;

  for (const t of turns) {
    if (map.has(t.speaker)) continue;

    let voice: string;
    let edgeVoice: string;
    if (t.gender === "male") {
      voice = ORPHEUS_VOICE_POOL_MALE[maleIndex % ORPHEUS_VOICE_POOL_MALE.length];
      edgeVoice = EDGE_TTS_VOICE_POOL_MALE[maleIndex % EDGE_TTS_VOICE_POOL_MALE.length];
      maleIndex++;
    } else if (t.gender === "female") {
      voice = ORPHEUS_VOICE_POOL_FEMALE[femaleIndex % ORPHEUS_VOICE_POOL_FEMALE.length];
      edgeVoice = EDGE_TTS_VOICE_POOL_FEMALE[femaleIndex % EDGE_TTS_VOICE_POOL_FEMALE.length];
      femaleIndex++;
    } else {
      voice = ORPHEUS_VOICE_POOL[fallbackIndex % ORPHEUS_VOICE_POOL.length];
      edgeVoice = EDGE_TTS_VOICE_POOL[fallbackIndex % EDGE_TTS_VOICE_POOL.length];
      fallbackIndex++;
    }

    map.set(t.speaker, {
      voice,
      edgeVoice,
      colorClass: SPEAKER_BADGE_COLORS[colorIndex % SPEAKER_BADGE_COLORS.length],
    });
    colorIndex++;
  }
  return map;
}

export default function DialoguePlayer({ turns }: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioElsRef = useRef<HTMLAudioElement[] | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopRequestedRef = useRef(false);

  const speakerMap = buildSpeakerMap(turns);
  const multiSpeaker = speakerMap.size > 1;

  function ensureAudioContext() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  }

  function connectBoost(audio: HTMLAudioElement) {
    const ctx = ensureAudioContext();
    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = VOLUME_BOOST;
    const compressor = ctx.createDynamicsCompressor();
    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(ctx.destination);
  }

  async function fetchTurnAudioUrl(turn: DialogueTurn): Promise<string> {
    // Prefer the pre-generated, cached audio (baked into the question at
    // generation time) — this avoids a live Groq TTS call on every playback.
    if (turn.audioUrl) return turn.audioUrl;

    // Fallback for older questions generated before audio caching existed.
    const meta = speakerMap.get(turn.speaker);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: turn.text, voice: meta?.voice, edgeVoice: meta?.edgeVoice }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Gagal membuat audio.");
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async function playFrom(startIndex: number) {
    const elements = audioElsRef.current;
    if (!elements) return;
    stopRequestedRef.current = false;

    for (let i = startIndex; i < elements.length; i++) {
      if (stopRequestedRef.current) return;
      setCurrentIndex(i);
      const audio = elements[i];
      try {
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Gagal memutar salah satu giliran bicara."));
          audio.play().catch(reject);
        });
      } catch (e: any) {
        setError(e.message ?? "Gagal memutar audio.");
        break;
      }
    }
    if (!stopRequestedRef.current) {
      setCurrentIndex(null);
      setPlaying(false);
    }
  }

  async function handlePlay() {
    setError(null);

    if (audioElsRef.current) {
      setPlaying(true);
      playFrom(0);
      return;
    }

    setLoading(true);
    try {
      const urls = await Promise.all(turns.map((t) => fetchTurnAudioUrl(t)));
      const elements = urls.map((url) => {
        const audio = new Audio(url);
        audio.crossOrigin = "anonymous";
        connectBoost(audio);
        return audio;
      });
      audioElsRef.current = elements;
      setPlaying(true);
      playFrom(0);
    } catch (e: any) {
      setError(e.message ?? "Gagal menyiapkan audio.");
    } finally {
      setLoading(false);
    }
  }

  function handleStop() {
    stopRequestedRef.current = true;
    audioElsRef.current?.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setPlaying(false);
    setCurrentIndex(null);
  }

  const activeSpeaker = currentIndex !== null ? turns[currentIndex]?.speaker : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {!playing ? (
          <button
            onClick={handlePlay}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 font-medium transition"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
            {loading ? "Menyiapkan audio..." : "Putar Percakapan"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 rounded-full bg-neutral-800 hover:bg-neutral-900 text-white px-5 py-2.5 font-medium transition"
          >
            <Square size={16} /> Berhenti
          </button>
        )}

        {playing && activeSpeaker && (
          <span className="flex items-center gap-1.5 text-sm text-neutral-600 bg-neutral-100 rounded-full px-3 py-1.5">
            <Mic2 size={14} className="animate-pulse text-indigo-600" />
            Sedang bicara: <span className="font-medium">{activeSpeaker}</span>
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {multiSpeaker && (
        <div className="flex gap-2 flex-wrap text-xs">
          {Array.from(speakerMap.entries()).map(([speaker, meta]) => (
            <span key={speaker} className={`rounded-full border px-2.5 py-1 ${meta.colorClass}`}>
              {speaker}
            </span>
          ))}
        </div>
      )}

      <details className="mt-1 text-sm text-neutral-500">
        <summary className="cursor-pointer select-none">
          Tampilkan transkrip (setelah mendengarkan)
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          {turns.map((t, i) => (
            <p
              key={i}
              className={`transition ${
                currentIndex === i ? "font-medium text-neutral-900" : "text-neutral-500"
              }`}
            >
              <span className="font-semibold">{t.speaker}: </span>
              {t.text}
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
