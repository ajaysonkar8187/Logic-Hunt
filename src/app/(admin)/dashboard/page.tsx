"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Target, Trophy, Activity } from "lucide-react";

interface Stats {
  totalParticipants: number;
  totalQuestions: number;
  avgScore: number;
  highestScore: number;
  completionRate: number;
  difficulties: { difficulty: string; count: number }[];
  scoreDistribution: Record<string, number>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .catch(console.error);
  }, []);

  const statCards = [
    { label: "Participants", value: stats?.totalParticipants ?? 0, icon: Users, color: "text-brand-500 bg-brand-500/10" },
    { label: "Questions", value: stats?.totalQuestions ?? 0, icon: BookOpen, color: "text-purple-500 bg-purple-500/10" },
    { label: "Avg Score", value: stats?.avgScore ?? 0, icon: Target, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Highest", value: stats?.highestScore ?? 0, icon: Trophy, color: "text-amber-500 bg-amber-500/10" },
    { label: "Completion", value: `${stats?.completionRate ?? 0}%`, icon: Activity, color: "text-rose-500 bg-rose-500/10" },
  ];

  const diffColors: Record<string, string> = { EASY: "bg-emerald-500", MEDIUM: "bg-amber-500", HARD: "bg-rose-500" };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Difficulty breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">Question Difficulty</h3>
          {(stats?.difficulties || []).map((d) => {
            const total = stats?.totalQuestions || 1;
            const pct = Math.round((d.count / total) * 100);
            return (
              <div key={d.difficulty} className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium capitalize">{d.difficulty.toLowerCase()}</span>
                  <span className="text-xs text-muted-foreground">{d.count} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-border">
                  <div className={`h-full rounded-full transition-all duration-500 ${diffColors[d.difficulty] || "bg-brand-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {!stats?.difficulties?.length && <p className="text-sm text-muted-foreground">No questions yet.</p>}
        </div>

        {/* Score distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">Score Distribution</h3>
          {stats?.scoreDistribution && Object.keys(stats.scoreDistribution).length > 0 ? (
            <div className="flex items-end gap-1.5 h-32">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => {
                const max = Math.max(...Object.values(stats.scoreDistribution));
                const h = max ? (count / max) * 100 : 0;
                return (
                  <div key={range} className="flex-1 text-center">
                    <div
                      className="bg-gradient-to-t from-brand-500 to-purple-500 rounded-t mx-auto transition-all duration-500"
                      style={{ height: `${h}%`, minHeight: 4 }}
                    />
                    <div className="text-[9px] text-muted-foreground mt-1 truncate">{range}</div>
                    <div className="text-[10px] font-bold">{count}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
