"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Brain, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import Link from "next/link";

export default function StudentLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const setStudentInfo = useAppStore((s) => s.setStudentInfo);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [fetched, setFetched] = useState(false);

  // Fetch event on mount
  useState(() => {
    fetch(`/api/events?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setEventData(d.data); setFetched(true); })
      .catch(() => setFetched(true));
  });

  const handleLogin = async () => {
    if (!name.trim() || name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) { setError("Name should contain only letters and spaces."); return; }
    if (!/^[^\s@]+@sitare\.org$/i.test(email.trim())) { setError("Only @sitare.org email addresses are allowed."); return; }
    if (!eventData) { setError("Event not found."); return; }
    if (eventData.status !== "ACTIVE") { setError("This competition is not active yet."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", name: name.trim(), email: email.trim(), eventId: eventData.id }),
      });
      const d = await res.json();
      if (d.success) {
        setStudentInfo({ id: d.data.id, name: d.data.name, email: d.data.email, eventId: d.data.eventId });
        router.push(`/event/${slug}/rules`);
      } else {
        setError(d.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const isActive = eventData?.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="absolute top-5 right-5 flex gap-2">
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">← Back</Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-7">
            <span className="inline-flex px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold mb-4">
              {eventData?.name || "Logic Hunt"}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Welcome to Logic Hunt</h1>
            <p className="text-sm text-muted-foreground">Enter your details to start the challenge</p>
          </div>

          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-5">{error}</div>}

          {fetched && !isActive && (
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              This competition is not active yet. Please wait for the admin to start it.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" placeholder="John Doe" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
              <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition" placeholder="you@sitare.org" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
            <button onClick={handleLogin} disabled={loading || !isActive} className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base transition-colors disabled:opacity-50">
              {loading ? "Joining…" : "Start Challenge →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
