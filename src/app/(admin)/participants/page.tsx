"use client";

import { useEffect, useState } from "react";
import { Download, Users } from "lucide-react";

interface Participant {
  rank: number; id: string; name: string; email: string;
  score: number; maxScore: number; timeTaken: number | null;
  accuracy: number; violationCount: number; status: string;
}

export default function ParticipantsPage() {
  const [data, setData] = useState<Participant[]>([]);
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => {
      if (d.success && d.data.length) {
        setEvents(d.data);
        setEventId(d.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/leaderboard?eventId=${eventId}`)
      .then((r) => r.json())
      .then((d) => d.success && setData(d.data.leaderboard));
  }, [eventId]);

  const exportCSV = () => {
    if (!eventId) return;
    window.open(`/api/admin/export?eventId=${eventId}`, "_blank");
  };

  const fmtTime = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const statusColor: Record<string, string> = {
    COMPLETED: "text-emerald-500 bg-emerald-500/10",
    IN_PROGRESS: "text-amber-500 bg-amber-500/10",
    REGISTERED: "text-muted-foreground bg-muted",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Participants</h1>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 rounded-xl border border-border bg-background text-sm" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">No participants yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                {["#", "Name", "Email", "Score", "Accuracy", "Time", "Violations", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-muted-foreground">{p.rank}</td>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 font-bold text-brand-500">{p.score}/{p.maxScore}</td>
                  <td className="px-4 py-3">{p.accuracy}%</td>
                  <td className="px-4 py-3">{fmtTime(p.timeTaken)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.violationCount > 0 ? "text-rose-500 bg-rose-500/10" : "text-emerald-500 bg-emerald-500/10"}`}>
                      {p.violationCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor[p.status] || ""}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
