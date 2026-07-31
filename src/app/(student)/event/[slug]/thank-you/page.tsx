"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";

export default function ThankYouPage() {
  const params = useParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#8b5cf6", "#ef4444", "#06b6d4"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="bg-card border border-border rounded-2xl p-10 max-w-md text-center shadow-lg">
        <div className="text-6xl mb-5">🎉</div>
        <h1 className="text-3xl font-black tracking-tight mb-3">Thank You!</h1>
        <p className="text-muted-foreground leading-relaxed mb-2">
          Your answers have been submitted successfully.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          Results will be announced by the organizers. Keep an eye out!
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-accent transition-colors"
        >
          ← Return Home
        </Link>
      </div>
    </div>
  );
}
