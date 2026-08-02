"use client";

import { useEffect, useState } from "react";
import { Plus, Play, Square, RefreshCw, Trash2, ListChecks, Check } from "lucide-react";
import { toast } from "sonner";

interface EventItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timeLimitMin: number;
  status: string;
  _count: { participants: number; eventQuestions: number };
}

interface QuestionItem {
  id: string;
  title: string;
  type: string;
  category: string;
  marks: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", timeLimitMin: 15 });
  const [managingId, setManagingId] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuestionItem[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());

  const fetchEvents = () => {
    fetch("/api/events").then((r) => r.json()).then((d) => d.success && setEvents(d.data));
  };
  useEffect(fetchEvents, []);

  const openManage = async (eventId: string) => {
    if (managingId === eventId) { setManagingId(null); return; }
    setManagingId(eventId);
    const [allRes, linkedRes] = await Promise.all([
      fetch("/api/questions").then((r) => r.json()),
      fetch(`/api/questions?eventId=${eventId}`).then((r) => r.json()),
    ]);
    if (allRes.success) setAllQuestions(allRes.data);
    if (linkedRes.success) setLinkedIds(new Set(linkedRes.data.map((q: QuestionItem) => q.id)));
  };

  const toggleQuestion = async (eventId: string, questionId: string) => {
    const isLinked = linkedIds.has(questionId);
    const next = new Set(linkedIds);
    isLinked ? next.delete(questionId) : next.add(questionId);
    setLinkedIds(next); // optimistic

    const res = isLinked
      ? await fetch(`/api/event-questions?eventId=${eventId}&questionId=${questionId}`, { method: "DELETE" })
      : await fetch("/api/event-questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, questionId }) });

    const d = await res.json();
    if (!d.success) {
      toast.error(d.error || "Failed to update");
      setLinkedIds(linkedIds); // revert
      return;
    }
    fetchEvents(); // refresh question count
  };

  const createEvent = async () => {
    if (!form.name.trim()) return;
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.success) { toast.success("Event created"); fetchEvents(); setShowCreate(false); setForm({ name: "", description: "", timeLimitMin: 15 }); }
    else toast.error(d.error);
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const d = await res.json();
    if (d.success) { toast.success(`Event ${status.toLowerCase()}`); fetchEvents(); }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event and all its data?")) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    toast.success("Event deleted");
    fetchEvents();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Events</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <h3 className="font-bold mb-4">Create Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Event Name</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Logic Hunt 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Time Limit (min)</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" type="number" min={1} value={form.timeLimitMin} onChange={(e) => setForm({ ...form, timeLimitMin: +e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
              <input className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createEvent} className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => {
          const statusColor = ev.status === "ACTIVE" ? "text-emerald-500 bg-emerald-500/10" : ev.status === "COMPLETED" ? "text-brand-500 bg-brand-500/10" : "text-amber-500 bg-amber-500/10";
          return (
            <div key={ev.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{ev.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor}`}>{ev.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ev.description || "No description"} · {ev.timeLimitMin} min · {ev._count.eventQuestions} questions · {ev._count.participants} participants
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => openManage(ev.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent">
                    <ListChecks className="w-3 h-3" /> {managingId === ev.id ? "Close" : "Manage Questions"}
                  </button>
                  {ev.status === "DRAFT" && (
                    <button onClick={() => updateStatus(ev.id, "ACTIVE")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                      <Play className="w-3 h-3" /> Start
                    </button>
                  )}
                  {ev.status === "ACTIVE" && (
                    <button onClick={() => updateStatus(ev.id, "COMPLETED")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold">
                      <Square className="w-3 h-3" /> Stop
                    </button>
                  )}
                  {ev.status === "COMPLETED" && (
                    <button onClick={() => updateStatus(ev.id, "DRAFT")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium">
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  )}
                  <button onClick={() => deleteEvent(ev.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {managingId === ev.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  {allQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questions in the bank yet — add some on the Questions page first.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                      {allQuestions.map((q) => {
                        const checked = linkedIds.has(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => toggleQuestion(ev.id, q.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left text-sm transition-all ${
                              checked ? "border-brand-500 bg-brand-500/10" : "border-border hover:bg-accent/50"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${checked ? "bg-brand-500" : "border-2 border-border"}`}>
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="flex-1 truncate">{q.title}</span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{q.category} · {q.marks}pts</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No events yet. Create one to get started.</div>
        )}
      </div>
    </div>
  );
}
