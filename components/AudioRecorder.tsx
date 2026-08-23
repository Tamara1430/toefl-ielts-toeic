"use client";

import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onTranscript, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await sendForTranscription(blob, mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e: any) {
      setError("Tidak bisa mengakses mikrofon. Pastikan izin mic diaktifkan.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function sendForTranscription(blob: Blob, mimeType: string) {
    setProcessing(true);
    setError(null);
    try {
      const ext = mimeType === "audio/webm" ? "webm" : "mp4";
      const formData = new FormData();
      formData.append("audio", blob, `recording.${ext}`);

      const res = await fetch("/api/stt", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Gagal transkrip audio.");
      onTranscript(json.text as string);
    } catch (e: any) {
      setError(e.message ?? "Terjadi kesalahan saat transkrip.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={disabled || processing}
            className="flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 font-medium transition"
          >
            <Mic size={18} />
            Mulai Rekam
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-full bg-neutral-800 hover:bg-neutral-900 text-white px-5 py-2.5 font-medium transition animate-pulse"
          >
            <Square size={18} />
            Berhenti
          </button>
        )}
        {processing && (
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Loader2 size={16} className="animate-spin" /> Mentranskrip...
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
