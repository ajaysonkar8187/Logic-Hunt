"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  const [data, setData] = useState<any>(null);
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => {
      if (d.success && d.data.length) { setEvents(d.data); setEventId(d.data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    const fetchData = () => {
      fetch(`/api/leaderboard?eventId=${eventId}`).then((r) => r.json()).then((d) => d.success && setData(d.data));
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const medals = ["🥇", "🥈", "🥉"];
  const stats = data?.stats;
  const board = data?.leaderboard?.filter((p: any) => p.status === "COMPLETED") || [];

  const fmtTime = (s: number | null) => {
    if (!s) return "—";
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Live Leaderboard</h1>
        <select className="px-3 py-2 rounded-xl border border-border bg-background text-sm" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-brand-500" },
            { label: "Active", value: stats.active, color: "text-amber-500" },
            { label: "Completed", value: stats.completed, color: "text-emerald-500" },
            { label: "Avg Score", value: stats.avgScore, color: "text-purple-500" },
          ].map((s) => (
            <div key={s.label} className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl text-center p-4">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {board.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">Waiting for submissions...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {board.map((p: any, i: number) => {
            const borderColor = i === 0 ? "border-amber-400" : i === 1 ? "border-gray-400" : i === 2 ? "border-orange-400" : "border-border";
            const bgColor = i === 0 ? "bg-amber-400/5" : i === 1 ? "bg-gray-400/5" : i === 2 ? "bg-orange-400/5" : "bg-card";
            return (
              <div key={p.id} className={`border-2 ${borderColor} ${bgColor} rounded-2xl p-4 flex items-center gap-4`}>
                <div className="w-10 text-center text-2xl font-black">
                  {i < 3 ? medals[i] : <span className="text-muted-foreground text-base">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-brand-500">{p.score}/{p.maxScore}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtTime(p.timeTaken)} · {p.accuracy}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
