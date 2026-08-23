"use client";

import { useRef, useState } from "react";
import { Volume2, Loader2, PauseCircle } from "lucide-react";

interface Props {
  text: string;
}

// Boost factor applied via Web Audio API GainNode.
// Native <audio>/HTMLMediaElement volume caps out at 1.0 (100%), which is not loud
// enough for some Orpheus TTS output. Routing through a GainNode lets us amplify
// beyond 100%. Adjust this constant if it's still too quiet/too loud/clips.
const VOLUME_BOOST = 3.5;

export default function TtsPlayer({ text }: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  function setupAudioGraph(audio: HTMLAudioElement) {
    // Reuse a single AudioContext/graph per player instance.
    const Ctx =
      window.AudioContext || (window as any).webkitAudioContext;
    const ctx = audioCtxRef.current ?? new Ctx();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = VOLUME_BOOST;

    // Compressor prevents harsh clipping when boosting volume this much.
    const compressor = ctx.createDynamicsCompressor();

    source.connect(gain);
    gain.connect(compressor);
    compressor.connect(ctx.destination);

    sourceNodeRef.current = source;
    gainNodeRef.current = gain;
  }

  async function handlePlay() {
    setError(null);

    if (audioRef.current && urlRef.current) {
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Gagal membuat audio.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;

      setupAudioGraph(audio);

      await audio.play();
      setPlaying(true);
    } catch (e: any) {
      setError(e.message ?? "Gagal memutar audio.");
    } finally {
      setLoading(false);
    }
  }

  function handlePause() {
    audioRef.current?.pause();
    setPlaying(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={playing ? handlePause : handlePlay}
        disabled={loading}
        className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 font-medium transition w-fit"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : playing ? (
          <PauseCircle size={18} />
        ) : (
          <Volume2 size={18} />
        )}
        {loading ? "Menyiapkan audio..." : playing ? "Jeda" : "Putar Audio"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
