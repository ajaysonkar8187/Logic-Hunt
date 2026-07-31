"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Clock, Zap, Shield, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const features = [
  { icon: Clock, title: "Timed Questions", desc: "Each question has its own countdown. Think fast, answer smart." },
  { icon: Zap, title: "11 Question Types", desc: "MCQ, riddles, ciphers, ordering, multi-select, and more." },
  { icon: Shield, title: "Anti-Cheating", desc: "Tab-switch detection, fullscreen lock, and activity logging." },
  { icon: Trophy, title: "Live Leaderboard", desc: "Admins see real-time rankings and analytics as scores come in." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">Logic Hunt</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          <span className="inline-flex px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold tracking-wide mb-6">
            University Orientation Challenge
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none mb-5">
            Test Your{" "}
            <span className="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">
              Logic
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Compete in timed logic challenges. Solve puzzles, crack codes, and prove your reasoning skills against fellow students.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/event/logic-hunt-2026/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base transition-colors shadow-lg shadow-brand-500/25"
            >
              Join Challenge →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border bg-card hover:bg-accent font-semibold text-base transition-colors"
            >
              <Shield className="w-4 h-4" /> Admin Panel
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
