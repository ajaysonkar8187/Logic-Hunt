"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Copy, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Logical Thinking", "Pattern Recognition", "Math Puzzle", "Visual IQ",
  "Critical Thinking", "Coding Logic", "Riddles & Brain Teasers", "General Aptitude",
];
const TYPES: Record<string, string> = {
  MCQ: "MCQ", MULTI_SELECT: "Multi-Select", RIDDLE: "Riddle", CIPHER: "Cipher",
  ORDERING: "Ordering", PATTERN: "Pattern", LOGICAL: "Logical",
  IMAGE_PUZZLE: "Image", SPOT_DIFF: "Spot Diff", MATCH_PAIRS: "Match", SUDOKU: "Sudoku",
};

interface QuestionItem {
  id: string; title: string; type: string; difficulty: string;
  category: string; marks: number; timeLimitSec: number; options: any; correctAnswer: any;
  explanation?: string; hint?: string; tags: string[];
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", type: "MCQ", difficulty: "EASY", category: CATEGORIES[0],
    options: ["", "", "", ""], correctAnswer: "", explanation: "", marks: 2,
    timeLimitSec: 30, hint: "", tags: [] as string[],
  });

  const fetchQ = () => {
    fetch("/api/questions").then((r) => r.json()).then((d) => d.success && setQuestions(d.data));
  };
  useEffect(fetchQ, []);

  const reset = () => {
    setForm({ title: "", type: "MCQ", difficulty: "EASY", category: CATEGORIES[0], options: ["", "", "", ""], correctAnswer: "", explanation: "", marks: 2, timeLimitSec: 30, hint: "", tags: [] });
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Question text is required");
    const payload: any = {
      ...form,
      marks: +form.marks,
      timeLimitSec: +form.timeLimitSec,
      options: form.options.filter((o) => o.trim()),
      correctAnswer: ["MULTI_SELECT", "ORDERING"].includes(form.type)
        ? form.correctAnswer.split(",").map((s: string) => s.trim()).filter(Boolean)
        : form.correctAnswer,
    };

    const url = "/api/questions";
    const method = editId ? "PUT" : "POST";
    if (editId) payload.id = editId;

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (d.success) { toast.success(editId ? "Updated" : "Created"); fetchQ(); reset(); }
    else toast.error(d.error);
  };

  const startEdit = (q: QuestionItem) => {
    setForm({
      title: q.title, type: q.type, difficulty: q.difficulty, category: q.category,
      options: q.options || ["", "", "", ""],
      correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer),
      explanation: q.explanation || "", marks: q.marks, timeLimitSec: q.timeLimitSec,
      hint: q.hint || "", tags: q.tags || [],
    });
    setEditId(q.id);
    setShowForm(true);
  };

  const dupeQ = async (q: QuestionItem) => {
    const { id, ...rest } = q;
    const payload = { ...rest, title: q.title + " (copy)" };
    await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    toast.success("Duplicated");
    fetchQ();
  };

  const deleteQ = async (id: string) => {
    await fetch(`/api/questions?id=${id}`, { method: "DELETE" });
    toast.success("Deleted");
    fetchQ();
  };

  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(filter.toLowerCase()) ||
    q.category.toLowerCase().includes(filter.toLowerCase()) ||
    q.type.toLowerCase().includes(filter.toLowerCase())
  );

  const diffColor: Record<string, string> = { EASY: "text-emerald-500 bg-emerald-500/10", MEDIUM: "text-amber-500 bg-amber-500/10", HARD: "text-rose-500 bg-rose-500/10" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Questions ({questions.length})</h1>
        <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input className="w-full max-w-sm pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Search questions..." value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <h3 className="font-bold mb-4">{editId ? "Edit" : "Create"} Question</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Question</label>
              <textarea className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm min-h-[70px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
              <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Difficulty</label>
              <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Marks</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: +e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Time Limit (sec)</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" type="number" min={5} value={form.timeLimitSec} onChange={(e) => setForm({ ...form, timeLimitSec: +e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Hint (optional)</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} />
            </div>

            {["MCQ", "MULTI_SELECT", "RIDDLE", "PATTERN"].includes(form.type) && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Options</label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <input className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }); }} />
                    {form.options.length > 2 && (
                      <button onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} className="px-2 rounded-lg border border-border text-xs">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, options: [...form.options, ""] })} className="text-xs text-brand-500 font-medium mt-1">+ Add option</button>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Correct Answer {["MULTI_SELECT", "ORDERING"].includes(form.type) && "(comma-separated)"}
              </label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Explanation</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold">{editId ? "Update" : "Create"}</button>
            <button onClick={reset} className="px-4 py-2 rounded-xl border border-border text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((q, i) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500">{TYPES[q.type] || q.type}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${diffColor[q.difficulty] || ""}`}>{q.difficulty}</span>
                <span className="text-[10px] text-muted-foreground">{q.marks} pts · {q.timeLimitSec}s</span>
              </div>
              <div className="text-sm font-medium truncate">{q.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{q.category}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => startEdit(q)} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => dupeQ(q)} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteQ(q.id)} className="p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No questions found.</div>}
      </div>
    </div>
  );
}
