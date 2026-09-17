"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function RulesPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const studentInfo = useAppStore((s) => s.studentInfo);
  const [accepted, setAccepted] = useState(false);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (!studentInfo) { router.push(`/event/${slug}/login`); return; }
    fetch(`/api/events?slug=${slug}`).then((r) => r.json()).then((d) => d.success && setEvent(d.data));
  }, [slug, studentInfo, router]);

  const qCount = event?.eventQuestions?.length || 0;
  const totalMarks = event?.eventQuestions?.reduce((a: number, eq: any) => a + eq.question.marks, 0) || 0;

  const rules = [
    { icon: "📝", text: `${qCount} questions to solve` },
    { icon: "🏆", text: `${totalMarks} total marks` },
    { icon: "⏳", text: "Each question has its own timer — auto-advances when it expires" },
    { icon: "⏮️", text: "Once you move to the next question, you cannot go back" },
    { icon: "✅", text: "No negative marking" },
    { icon: "1️⃣", text: "One attempt only — you cannot retake the exam" },
    { icon: "🔀", text: "Questions and options are randomized" },
    { icon: "🔒", text: "Scores and rankings will not be shown after submission" },
    { icon: "🖥️", text: "The exam runs in fullscreen — exiting it is logged as a violation" },
    { icon: "🚫", text: "Do not switch tabs, leave fullscreen, or copy/paste — activity is logged" },
    { icon: "📤", text: "3 logged violations will auto-submit your exam" },
  ];

  const handleBegin = async () => {
    if (!studentInfo) return;
    const el = document.documentElement as any;
    const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (requestFs) {
      try { await requestFs.call(el); } catch {}
    }
    await fetch("/api/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", participantId: studentInfo.id }),
    });
    router.push(`/event/${slug}/exam`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="absolute top-5 right-5"><ThemeToggle /></div>
      <div className="w-full max-w-lg">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📋</div>
            <h2 className="text-xl font-bold">Exam Rules</h2>
            <p className="text-sm text-muted-foreground mt-1">Read carefully before you begin</p>
          </div>

          <div className="space-y-2.5 mb-6">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-brand-500/5">
                <span className="text-lg">{r.icon}</span>
                <span className="text-sm">{r.text}</span>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 cursor-pointer px-3.5 py-3 rounded-xl border transition-colors mb-5"
            style={{ borderColor: accepted ? "var(--ring)" : undefined, backgroundColor: accepted ? "hsl(var(--primary) / 0.05)" : undefined }}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
              className="w-4 h-4 rounded" style={{ accentColor: "hsl(var(--primary))" }} />
            <span className="text-sm font-semibold">I have read and accept the rules</span>
          </label>

          <button onClick={handleBegin} disabled={!accepted}
            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base transition-colors disabled:opacity-40">
            Begin Exam →
          </button>
        </div>
      </div>
    </div>
  );
}
