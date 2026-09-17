"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";

const NOTIFICATIONS = [
  { title: "Welcome!", msg: "Thanks for joining our platform", time: "Just now", read: false, icon: "👋" },
  { title: "Profile updated", msg: "Your profile was updated successfully", time: "1 hour ago", read: false, icon: "✅" },
  { title: "New feature available", msg: "AI Assistant is now available. Try it out!", time: "2 days ago", read: true, icon: "🔔" },
  { title: "Order confirmed", msg: "Your order #1234 has been confirmed", time: "3 days ago", read: true, icon: "🔔" },
  { title: "Payment received", msg: "Payment of ₹1,179 for Pro Plan received", time: "1 week ago", read: true, icon: "💰" },
  { title: "Review requested", msg: "How was your experience? Leave a review", time: "2 weeks ago", read: true, icon: "⭐" },
];

export function Notifications({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const accent = theme.accent ?? "#c4b5fd";
  const [filter, setFilter] = useState("all");

  const filtered = filter === "unread" ? NOTIFICATIONS.filter(n => !n.read) : NOTIFICATIONS;
  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <main className="flex-1 mx-auto max-w-2xl px-6 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--brand-secondary)" }}>Notifications</h1>
            <p className="text-sm opacity-50">{unreadCount} unread</p>
          </div>
          <div className="relative">
            <span className="text-3xl animate-pulse">🔔</span>
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--critical)] text-white text-xs font-bold flex items-center justify-center animate-scale-in">{unreadCount}</span>}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "unread"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === f ? 'text-white shadow-sm' : 'bg-surface border hover:shadow-sm'}`} style={filter === f ? { background: "var(--brand-gradient)" } : { borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
              {f === "all" ? "All" : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {filtered.map((n, i) => (
            <div key={i} className={`group card-lift rounded-2xl border bg-surface p-4 flex items-start gap-4 ${!n.read ? 'border-l-4' : ''}`} style={{ borderColor: n.read ? `${accent}20` : undefined, borderLeftColor: !n.read ? "var(--brand-secondary)" : undefined }}>
              <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: "var(--brand-secondary)" }}>{n.title}</p>
                <p className="text-sm opacity-60 mt-0.5 truncate">{n.msg}</p>
                <p className="text-xs opacity-30 mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 animate-pulse" style={{ background: "var(--brand-primary)" }} />}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 opacity-50">
            <div className="text-5xl mb-3">🔕</div>
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No unread notifications</p>
          </div>
        )}
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
