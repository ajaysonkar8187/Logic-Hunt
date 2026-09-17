"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Shield, GraduationCap, Hash, Clock, Zap, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAppStore } from "@/lib/store";

type Role = "student" | "admin";

const highlights = [
  { icon: Clock, text: "Per-question timers keep every round moving" },
  { icon: Zap, text: "11 puzzle types — MCQ, ciphers, riddles, and more" },
  { icon: Trophy, text: "Live leaderboards and instant response sheets" },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setStudentInfo = useAppStore((s) => s.setStudentInfo);
  const [role, setRole] = useState<Role>(searchParams.get("role") === "admin" ? "admin" : "student");

  // Student fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventCode, setEventCode] = useState(searchParams.get("event") || "");
  const [studentError, setStudentError] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);

  // Admin fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError("");
    if (!name.trim() || name.trim().length < 2) { setStudentError("Name must be at least 2 characters."); return; }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) { setStudentError("Name should contain only letters and spaces."); return; }
    if (!/^[^\s@]+@sitare\.org$/i.test(email.trim())) { setStudentError("Only @sitare.org email addresses are allowed."); return; }
    const code = eventCode.trim();
    if (!code) { setStudentError("Enter the event code."); return; }

    setStudentLoading(true);
    try {
      const eventRes = await fetch(`/api/events?slug=${encodeURIComponent(code)}`);
      const eventData = await eventRes.json();
      if (!eventData.success) {
        setStudentError("Event not found. Check the event code and try again.");
        setStudentLoading(false);
        return;
      }
      if (eventData.data.status !== "ACTIVE") {
        setStudentError("This competition is not active yet.");
        setStudentLoading(false);
        return;
      }

      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", name: name.trim(), email: email.trim(), eventId: eventData.data.id }),
      });
      const d = await res.json();
      if (d.success) {
        setStudentInfo({ id: d.data.id, name: d.data.name, email: d.data.email, eventId: d.data.eventId });
        router.push(`/event/${eventData.data.slug}/rules`);
      } else {
        setStudentError(d.error || "Login failed");
        setStudentLoading(false);
      }
    } catch {
      setStudentError("Network error. Please try again.");
      setStudentLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);

    const result = await signIn("admin-login", {
      email: adminEmail,
      password: adminPassword,
      redirect: false,
    });

    if (result?.error) {
      setAdminError("Invalid credentials.");
      setAdminLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-purple-700 flex-col justify-between p-12 text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">Logic Hunt</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">
            One platform.
            <br />
            Every logic challenge.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-sm mb-9">
            Whether you're competing or running the show, sign in here to get started.
          </p>

          <div className="space-y-4">
            {highlights.map((h) => (
              <div key={h.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <h.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-white/90">{h.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Logic Hunt. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
            ← Back
          </Link>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Logic Hunt</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
          </div>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted mb-7">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === "student" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === "admin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          </div>

          <AnimatePresence mode="wait">
            {role === "student" ? (
              <motion.form
                key="student"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleStudentSubmit}
                className="space-y-4"
              >
                {studentError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{studentError}</div>}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setStudentError(""); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="you@sitare.org"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStudentError(""); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Event Code</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                      placeholder="e.g. logic-hunt-2026"
                      value={eventCode}
                      onChange={(e) => { setEventCode(e.target.value); setStudentError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleStudentSubmit(e as any)}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">Find this in your invite link or ask your organizer.</p>
                </div>

                <button
                  type="submit"
                  disabled={studentLoading}
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {studentLoading ? "Joining…" : "Start Challenge →"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="admin"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleAdminSubmit}
                className="space-y-4"
              >
                {adminError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{adminError}</div>}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="admin@logichunt.com"
                    value={adminEmail}
                    onChange={(e) => { setAdminEmail(e.target.value); setAdminError(""); }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {adminLoading ? "Signing in…" : "Sign In"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
