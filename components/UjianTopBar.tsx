"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface UjianTopBarProps {
  examLabel: string;
  /** Current step (1-based) and total steps — omit while still on the
   * "before you start" screen, where there's no progress yet. */
  step?: number;
  totalSteps?: number;
  /** Where the exit (X) button sends the user after confirming. */
  exitHref: string;
}

export default function UjianTopBar({ examLabel, step, totalSteps, exitHref }: UjianTopBarProps) {
  const router = useRouter();

  function handleExit() {
    const ok = window.confirm(
      "Keluar dari Ujian sekarang? Progress sesi ini akan hilang dan tidak tersimpan."
    );
    if (ok) router.push(exitHref);
  }

  const pct =
    step && totalSteps ? Math.round((step / totalSteps) * 100) : null;

  return (
    <div className="sticky top-0 z-30 bg-surface border-b border-rule">
      <div className="container-page px-5 py-3 flex items-center gap-3">
        <button
          onClick={handleExit}
          aria-label="Keluar dari ujian"
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-ink-faint hover:text-red hover:bg-red-tint transition-colors"
        >
          <X size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink truncate">Ujian {examLabel}</p>
            {step && totalSteps && (
              <span className="stat-num text-xs text-ink-soft shrink-0">
                {step}/{totalSteps}
              </span>
            )}
          </div>
          {pct !== null && (
            <div className="h-1.5 rounded-full bg-[var(--rule)] overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: "var(--indigo)" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
