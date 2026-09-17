"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Brain, ChevronRight, Check, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime, seededShuffle } from "@/lib/utils";
import { QuestionRenderer } from "@/components/exam/question-renderer";

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { studentInfo, exam, setExamField, setAnswer, addViolation } = useAppStore();

  const [event, setEvent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const startTimeRef = useRef(Date.now());
  const autoSaveRef = useRef<NodeJS.Timeout>();

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement as any;
    const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (requestFs) requestFs.call(el).catch(() => {});
  }, []);

  // Fetch event data
  useEffect(() => {
    if (!studentInfo) { router.push(`/event/${slug}/login`); return; }
    fetch(`/api/events?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setEvent(d.data);
        const eqs = d.data.eventQuestions.map((eq: any) => eq.question);
        const seed = studentInfo.id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
        const shuffled = seededShuffle(eqs, seed).map((q: any) => ({
          ...q,
          options: ["MCQ", "MULTI_SELECT", "RIDDLE", "PATTERN"].includes(q.type) && q.options
            ? seededShuffle(q.options, seed + q.id.charCodeAt(0))
            : q.options,
        }));
        setQuestions(shuffled);
        setExamField("questionTimeLeft", shuffled[0]?.timeLimitSec || 30);
        setExamField("startedAt", Date.now());
      });
  }, [slug, studentInfo, router, setExamField]);

  const currentQ = questions[exam.currentIndex];
  const totalQ = questions.length;

  // Per-question timer
  useEffect(() => {
    if (exam.submitted || !currentQ) return;
    setExamField("questionTimeLeft", currentQ.timeLimitSec || 30);
    setShowHint(false);
  }, [exam.currentIndex]);

  useEffect(() => {
    if (exam.submitted || !currentQ) return;
    const iv = setInterval(() => {
      const newTime = exam.questionTimeLeft - 1;
      if (newTime <= 0) {
        setWarningMsg("Time's up for this question. Moving to the next question — you cannot come back to it.");
        setShowWarning(true);
        if (exam.currentIndex < totalQ - 1) {
          setExamField("currentIndex", exam.currentIndex + 1);
        } else {
          handleSubmit();
        }
      } else {
        setExamField("questionTimeLeft", newTime);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [exam.questionTimeLeft, exam.submitted, exam.currentIndex, totalQ, currentQ]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (exam.submitted || !studentInfo) return;
    autoSaveRef.current = setInterval(() => {
      if (!currentQ) return;
      const answer = exam.answers[currentQ.id];
      if (answer !== undefined) {
        fetch("/api/exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-answer", participantId: studentInfo.id, questionId: currentQ.id, answer }),
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(autoSaveRef.current);
  }, [exam.submitted, exam.answers, currentQ?.id, studentInfo]);

  // Enter fullscreen on mount (best-effort; requires a prior user gesture to succeed)
  useEffect(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  // Fullscreen exit detection
  useEffect(() => {
    if (exam.submitted) return;
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        const v = { type: "FULLSCREEN_EXIT", timestamp: Date.now() };
        addViolation(v);
        if (studentInfo) fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "violation", participantId: studentInfo.id, type: "FULLSCREEN_EXIT" }) }).catch(() => {});
        setWarningMsg("You exited fullscreen. This activity has been logged.");
        setNeedsFullscreen(true);
        setShowWarning(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [exam.submitted, studentInfo, addViolation]);

  // Anti-cheat
  useEffect(() => {
    if (exam.submitted) return;

    const handleVis = () => {
      if (document.hidden) {
        const v = { type: "TAB_SWITCH", timestamp: Date.now() };
        addViolation(v);
        if (studentInfo) fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "violation", participantId: studentInfo.id, type: "TAB_SWITCH" }) }).catch(() => {});
        setWarningMsg("You switched tabs. This activity has been logged.");
        setShowWarning(true);
      }
    };
    const handleBlur = () => {
      const v = { type: "WINDOW_BLUR", timestamp: Date.now() };
      addViolation(v);
      if (studentInfo) fetch("/api/exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "violation", participantId: studentInfo.id, type: "WINDOW_BLUR" }) }).catch(() => {});
      setWarningMsg("You left the exam window. This activity has been logged.");
      setShowWarning(true);
    };
    const prevent = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) || (e.ctrlKey && e.key === "u") || (e.ctrlKey && e.key === "p")) {
        e.preventDefault();
        addViolation({ type: "DEVTOOLS_ATTEMPT", timestamp: Date.now() });
      }
    };

    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("keydown", blockKeys);
    };
  }, [exam.submitted, studentInfo, addViolation]);

  const handleSubmit = useCallback(async () => {
    if (exam.submitted) return;
    setExamField("submitted", true);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    await fetch("/api/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", participantId: studentInfo?.id, answers: exam.answers, timeTaken }),
    }).catch(() => {});

    router.push(`/event/${slug}/thank-you`);
  }, [exam.submitted, exam.answers, studentInfo, slug, router, setExamField]);

  // Auto-submit after 3 violations
  const autoSubmitRef = useRef(false);
  useEffect(() => {
    if (exam.submitted || autoSubmitRef.current) return;
    if (exam.violations.length >= 3) {
      autoSubmitRef.current = true;
      setWarningMsg("Multiple violations detected. Your exam has been submitted automatically.");
      setShowWarning(true);
      handleSubmit();
    }
  }, [exam.violations.length, exam.submitted, handleSubmit]);

  if (!currentQ) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading exam...</p></div>;
  }

  const isLowQ = exam.questionTimeLeft <= 10;
  const typeLabel: Record<string, string> = { MCQ: "MCQ", MULTI_SELECT: "Multi-Select", RIDDLE: "Riddle", CIPHER: "Cipher", ORDERING: "Ordering", PATTERN: "Pattern", LOGICAL: "Logical" };

  return (
    <div className="min-h-screen bg-background flex flex-col exam-active">
      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-5" onClick={() => { if (!needsFullscreen) setShowWarning(false); }}>
          <div className="bg-card border border-border rounded-2xl p-8 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2 text-destructive">Warning</h3>
            <p className="text-sm text-muted-foreground mb-5">{warningMsg}</p>
            <button
              onClick={() => {
                if (needsFullscreen) { enterFullscreen(); setNeedsFullscreen(false); }
                setShowWarning(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm"
            >
              {needsFullscreen ? "Return to Fullscreen" : "Return to Exam"}
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 bg-card/90 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-brand-500" />
          <span className="font-bold text-sm">Logic Hunt</span>
        </div>
        <div className="flex items-center gap-3">
          {exam.violations.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">⚠ {exam.violations.length}</span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-5">
        {/* Progress */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-muted-foreground">Question {exam.currentIndex + 1} of {totalQ}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${currentQ.difficulty === "EASY" ? "bg-emerald-500/10 text-emerald-500" : currentQ.difficulty === "MEDIUM" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
              {currentQ.difficulty}
            </span>
            <span className="text-xs text-muted-foreground">{currentQ.marks} pts</span>
          </div>
        </div>

        <div className="h-1 rounded-full bg-border mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-300" style={{ width: `${((exam.currentIndex + 1) / totalQ) * 100}%` }} />
        </div>

        {/* Question timer */}
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold tabular-nums border ${isLowQ ? "border-destructive bg-destructive/5 text-destructive timer-warning" : "border-border bg-card"}`}>
            ⏱ {formatTime(exam.questionTimeLeft)}
          </div>
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-2xl p-6 flex-1 flex flex-col">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">{currentQ.category}</div>
          <h2 className="text-lg font-bold leading-relaxed mb-5">{currentQ.title}</h2>

          {currentQ.hint && !showHint && (
            <button onClick={() => setShowHint(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-500 text-xs font-medium mb-4 w-fit hover:bg-amber-500/5">
              💡 Show Hint
            </button>
          )}
          {showHint && currentQ.hint && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm mb-4">💡 {currentQ.hint}</div>
          )}

          <div className="flex-1">
            <QuestionRenderer
              question={currentQ}
              answer={exam.answers[currentQ.id]}
              onAnswer={(v) => setAnswer(currentQ.id, v)}
            />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Once you move to the next question, you cannot come back to this one.
        </p>

        {/* Navigation */}
        <div className="flex justify-end items-center mt-4 gap-3">
          {exam.currentIndex === totalQ - 1 ? (
            <button
              onClick={() => { if (confirm("Submit your exam? You cannot change answers after this.")) handleSubmit(); }}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
            >
              <Check className="w-4 h-4" /> Submit Exam
            </button>
          ) : (
            <button
              onClick={() => setExamField("currentIndex", Math.min(totalQ - 1, exam.currentIndex + 1))}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
