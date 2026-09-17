"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import { Check, X, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";

function formatAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) return "No answer given";
  if (Array.isArray(answer)) return answer.length ? answer.join(", ") : "No answer given";
  if (typeof answer === "object") return JSON.stringify(answer);
  const s = String(answer).trim();
  return s === "" ? "No answer given" : s;
}

interface SheetItem {
  questionId: string;
  title: string;
  type: string;
  options: string[] | null;
  correctAnswer: unknown;
  explanation: string | null;
  marks: number;
  studentAnswer: unknown;
  isCorrect: boolean;
  score: number;
}

export default function ThankYouPage() {
  const params = useParams();
  const slug = params.slug as string;
  const studentInfo = useAppStore((s) => s.studentInfo);
  const fired = useRef(false);

  const [event, setEvent] = useState<any>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ participant: any; totalMarks: number; sheet: SheetItem[] } | null>(null);

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

  const fetchEvent = () => {
    fetch(`/api/events?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => d.success && setEvent(d.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchResultsFor = async (body: Record<string, unknown>) => {
    setLoading(true);
    setLookupError("");
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "results", ...body }),
      });
      const d = await res.json();
      if (d.success) {
        setResults(d.data);
      } else {
        setLookupError(d.error || "Could not load your response sheet.");
      }
    } catch {
      setLookupError("Network error. Please try again.");
    }
    setLoading(false);
  };

  // Auto-fetch if we already know who this student is and the event has ended
  useEffect(() => {
    if (!event || event.status !== "COMPLETED" || !studentInfo || results || loading) return;
    fetchResultsFor({ participantId: studentInfo.id });
  }, [event, studentInfo]);

  const handleLookup = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookupEmail.trim())) {
      setLookupError("Enter a valid email address.");
      return;
    }
    if (!event) return;
    fetchResultsFor({ email: lookupEmail.trim(), eventId: event.id });
  };

  const eventEnded = event?.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-lg mb-6">
          <div className="text-6xl mb-5">🎉</div>
          <h1 className="text-3xl font-black tracking-tight mb-3">Thank You!</h1>
          <p className="text-muted-foreground leading-relaxed mb-2">
            Your answers have been submitted successfully.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Your response sheet will be available here once the organizer ends the event.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-accent transition-colors"
          >
            ← Return Home
          </Link>
        </div>

        {/* Response sheet section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {!results && !eventEnded && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                The event is still in progress. Your response sheet will unlock once it ends.
              </p>
              <button
                onClick={fetchEvent}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check again
              </button>
            </div>
          )}

          {!results && eventEnded && !studentInfo && (
            <div className="max-w-sm mx-auto py-2">
              <h3 className="font-bold text-sm mb-3 text-center">View your response sheet</h3>
              {lookupError && <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs mb-3">{lookupError}</div>}
              <input
                type="email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition mb-3"
                placeholder="The email you registered with"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <button
                onClick={handleLookup}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Loading…" : "View Response Sheet"}
              </button>
            </div>
          )}

          {!results && eventEnded && studentInfo && loading && (
            <p className="text-center text-sm text-muted-foreground py-4">Loading your response sheet…</p>
          )}

          {!results && eventEnded && studentInfo && !loading && lookupError && (
            <div className="text-center py-4">
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs mb-3">{lookupError}</div>
              <button
                onClick={() => fetchResultsFor({ participantId: studentInfo.id })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          )}

          {results && (
            <div>
              <div className="flex items-center justify-between mb-5 px-1">
                <div>
                  <h3 className="font-bold text-lg">{results.participant.name}'s Response Sheet</h3>
                  <p className="text-xs text-muted-foreground">{results.participant.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-brand-500">{results.participant.score} / {results.totalMarks}</div>
                  <div className="text-xs text-muted-foreground">total score</div>
                </div>
              </div>

              <div className="space-y-3">
                {results.sheet.map((item, i) => (
                  <div key={item.questionId} className="border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold leading-relaxed">{i + 1}. {item.title}</p>
                      <span
                        className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.isCorrect
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {item.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {item.score}/{item.marks}
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className={item.isCorrect ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-destructive font-medium"}>
                          {formatAnswer(item.studentAnswer)}
                        </span>
                      </p>
                      {!item.isCorrect && (
                        <p>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatAnswer(item.correctAnswer)}</span>
                        </p>
                      )}
                      {item.explanation && (
                        <p className="text-muted-foreground italic mt-1.5">💡 {item.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
