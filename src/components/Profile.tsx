"use client";
import { useAuth } from "../context/AuthContext";
import { Wrench, Phone, Building2, Star, LogOut, ShieldCheck, ShieldX } from "lucide-react";

export default function Profile() {
  const { profile, logout } = useAuth();
  if (!profile) return null;

  const initials = profile.full_name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "T";

  const ratingNum = parseFloat(profile.rating ?? "0");
  const ratingDisplay = isNaN(ratingNum) ? "—" : ratingNum.toFixed(1);

  return (
    <div className="min-h-full pb-8">
      {/* Hero header */}
      <div className="relative pt-10 pb-16 px-4 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d1629 0%, #111827 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex flex-col items-center">
          <div className="relative mb-4">
            {/* Avatar — photo if available, else initials */}
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="w-24 h-24 rounded-3xl object-cover"
                style={{ boxShadow: "0 0 30px rgba(59,130,246,0.5)" }}
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", boxShadow: "0 0 30px rgba(59,130,246,0.5)" }}>
                {initials}
              </div>
            )}
            {/* Active / inactive dot */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0a0f1e] ${profile.is_active ? "bg-emerald-400" : "bg-slate-500"}`} />
          </div>

          <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{profile.full_name || "Technician"}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{profile.phone_number}</p>

          {/* Active status badge */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: profile.is_active ? "rgba(16,185,129,0.15)" : "rgba(71,85,105,0.3)",
              border: `1px solid ${profile.is_active ? "rgba(16,185,129,0.3)" : "rgba(71,85,105,0.4)"}`,
            }}>
            <div className={`w-2 h-2 rounded-full ${profile.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span className="text-xs font-semibold" style={{ color: profile.is_active ? "#34d399" : "var(--text-muted)" }}>
              {profile.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Provider Info */}
        <div className="rounded-2xl p-5 animate-slide-up"
          style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.15)" }}>
              <Building2 className="w-5 h-5" style={{ color: "#3b82f6" }} />
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Provider</span>
          </div>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {profile.provider?.name || "—"}
          </p>
        </div>

        {/* Specialties */}
        <div className="rounded-2xl p-5 animate-slide-up"
          style={{ animationDelay: "0.05s", background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.15)" }}>
              <Wrench className="w-5 h-5" style={{ color: "#f97316" }} />
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Specialties</span>
          </div>
          {(!profile.specialties || profile.specialties.length === 0)
            ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No specialties listed.</p>
            : (
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm font-semibold capitalize"
                    style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>
                    {s}
                  </span>
                ))}
              </div>
            )
          }
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {/* Rating */}
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: "rgba(245,158,11,0.15)" }}>
              <Star className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </div>
            <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{ratingDisplay}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>Rating</p>
          </div>

          {/* Status */}
          <div className="rounded-2xl p-4" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: profile.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)" }}>
              {profile.is_active
                ? <ShieldCheck className="w-4 h-4" style={{ color: "#10b981" }} />
                : <ShieldX className="w-4 h-4" style={{ color: "#ef4444" }} />}
            </div>
            <p className="text-2xl font-black" style={{ color: profile.is_active ? "#34d399" : "#f87171" }}>
              {profile.is_active ? "Active" : "Inactive"}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>Status</p>
          </div>
        </div>

        {/* Specialties count */}
        <div className="rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "0.12s", background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Specialties</p>
              <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{profile.specialties?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)" }}>
              <Wrench className="w-6 h-6" style={{ color: "#a78bfa" }} />
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95 animate-slide-up"
          style={{ animationDelay: "0.15s", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
