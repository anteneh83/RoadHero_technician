"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useJobs } from "../context/JobsContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Briefcase, History, User, Wrench, Moon, Sun } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import ActiveJobs from "./ActiveJobs";
import JobHistory from "./JobHistory";
import Profile from "./Profile";

type Tab = "jobs" | "history" | "profile";

const NAV_ITEMS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: "jobs",    labelKey: "Jobs",    icon: Briefcase },
  { id: "history", labelKey: "History", icon: History },
  { id: "profile", labelKey: "Profile", icon: User },
];

export default function Dashboard() {
  const { profile, logout, loading: authLoading } = useAuth();
  const { jobs } = useJobs();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("jobs");

  /* Loading screen */
  if (authLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ background: "linear-gradient(145deg, var(--bg-secondary), var(--bg-primary))" }}>
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wrench className="w-7 h-7" style={{ color: "#3b82f6" }} />
          </div>
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{t("Loading your portal…")}</p>
      </div>
    );
  }

  /* Profile error */
  if (!profile) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 gap-6"
        style={{ background: "var(--bg-primary)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.15)" }}>
          <Wrench className="w-8 h-8" style={{ color: "#ef4444" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)" }}>{t("Profile unavailable")}</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("Could not load your profile. Please log in again.")}</p>
        </div>
        <button onClick={logout}
          className="px-6 py-3 rounded-xl font-bold"
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#3b82f6" }}>
          {t("Go to Login")}
        </button>
      </div>
    );
  }

  const activeJobCount = jobs.filter(j => !["COMPLETED", "CANCELLED"].includes(j.status)).length;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Top header */}
      <header className="flex-shrink-0 px-4 pt-safe-top"
        style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black" style={{ color: "var(--text-primary)" }}>{t("RoadHero")}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Language Toggle */}
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {profile.full_name.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable page content */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
        {activeTab === "jobs"    && <ActiveJobs />}
        {activeTab === "history" && <JobHistory />}
        {activeTab === "profile" && <Profile />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bottom-nav"
        style={{ background: "var(--bg-glass)", borderTop: "1px solid var(--border-subtle)", backdropFilter: "blur(20px)" }}>
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = item.id === "jobs" && activeJobCount > 0 ? activeJobCount : null;

            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative"
                style={{ color: isActive ? "#3b82f6" : "var(--text-muted)" }}>
                <div className="relative">
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.5} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                      style={{ background: "#f97316" }}>
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{t(item.labelKey as any)}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: "#3b82f6" }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}