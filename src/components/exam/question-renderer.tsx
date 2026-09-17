"use client";

import { Check, ChevronUp, ChevronDown } from "lucide-react";

interface QuestionRendererProps {
  question: {
    id: string;
    type: string;
    options?: string[];
    hint?: string;
  };
  answer: unknown;
  onAnswer: (value: unknown) => void;
  disabled?: boolean;
}

export function QuestionRenderer({ question, answer, onAnswer, disabled = false }: QuestionRendererProps) {
  const { type, options } = question;

  // ── MCQ / Riddle / Pattern (radio) ──────────────────────────────────────
  if (["MCQ", "RIDDLE", "PATTERN", "LOGICAL", "IMAGE_PUZZLE"].includes(type)) {
    return (
      <div className="space-y-2">
        {(options || []).map((opt: string, i: number) => {
          const selected = answer === opt;
          return (
            <button
              key={i}
              onClick={() => onAnswer(opt)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selected
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selected ? "border-brand-500" : "border-border"
              }`}>
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Multi-select (checkbox) ─────────────────────────────────────────────
  if (type === "MULTI_SELECT") {
    const selected = Array.isArray(answer) ? (answer as string[]) : [];
    return (
      <div className="space-y-2">
        {(options || []).map((opt: string, i: number) => {
          const checked = selected.includes(opt);
          return (
            <button
              key={i}
              onClick={() => onAnswer(checked ? selected.filter((s) => s !== opt) : [...selected, opt])}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                checked
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                checked ? "bg-brand-500 border-brand-500" : "border-2 border-border"
              }`}>
                {checked && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
        <p className="text-xs text-muted-foreground mt-2">Select all that apply</p>
      </div>
    );
  }

  // ── Cipher / text input ─────────────────────────────────────────────────
  if (type === "CIPHER") {
    return (
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Your Answer</label>
        <input
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Type your decoded answer..."
          value={(answer as string) || ""}
          onChange={(e) => onAnswer(e.target.value)}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
    );
  }

  // ── Ordering ────────────────────────────────────────────────────────────
  if (type === "ORDERING") {
    const items: string[] = Array.isArray(answer) && (answer as string[]).length
      ? (answer as string[])
      : [...(options || [])];

    const moveUp = (i: number) => {
      if (i === 0) return;
      const arr = [...items];
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      onAnswer(arr);
    };
    const moveDown = (i: number) => {
      if (i === items.length - 1) return;
      const arr = [...items];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      onAnswer(arr);
    };

    return (
      <div>
        <p className="text-xs text-muted-foreground mb-3">Arrange in the correct order:</p>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-500/5 border border-border">
              <span className="w-6 text-center font-extrabold text-brand-500 text-sm">{i + 1}</span>
              <span className="flex-1 text-sm">{item}</span>
              <div className="flex flex-col">
                <button onClick={() => moveUp(i)} disabled={disabled || i === 0} className="p-0.5 disabled:opacity-20">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveDown(i)} disabled={disabled || i === items.length - 1} className="p-0.5 disabled:opacity-20">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Fallback: text input ────────────────────────────────────────────────
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Your Answer</label>
      <input
        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Type your answer..."
        value={(answer as string) || ""}
        onChange={(e) => onAnswer(e.target.value)}
        autoComplete="off"
        disabled={disabled}
      />
    </div>
  );
}
