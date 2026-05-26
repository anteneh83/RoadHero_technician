"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Login from "../components/Login";
import Dashboard from "../components/Dashboard";

function TechnicianLoader() {
  const { t } = useLanguage();
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      gap: "0px",
    }}>
      {/* Outer glow ring */}
      <div style={{
        position: "relative",
        width: 120,
        height: 120,
        marginBottom: 32,
      }}>
        {/* Spinning arc ring */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "var(--accent-blue)",
          borderRightColor: "var(--accent-blue)",
          animation: "tech-spin 1.1s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite",
        }} />
        {/* Second counter-spin ring (orange) */}
        <div style={{
          position: "absolute",
          inset: 10,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "var(--accent-orange)",
          borderLeftColor: "var(--accent-orange)",
          animation: "tech-spin-rev 1.6s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite",
        }} />
        {/* Center icon background */}
        <div style={{
          position: "absolute",
          inset: 18,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(249,115,22,0.1))",
          border: "1px solid rgba(59,130,246,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "tech-pulse 2s ease-in-out infinite",
        }}>
          {/* Wrench SVG icon */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: "wrench-rock 2s ease-in-out infinite" }}
          >
            <path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
              stroke="#3b82f6"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand logo / name */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--accent-orange)",
          marginBottom: 6,
          opacity: 0.9,
        }}>
          {t("RoadHero")}
        </div>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}>
          {t("Technician Portal")}
        </div>
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 13,
        color: "var(--text-secondary)",
        marginBottom: 36,
        letterSpacing: "0.01em",
      }}>
        {t("Authenticating your session…")}
      </div>

      {/* Bouncing dots */}
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: i === 1 ? "var(--accent-orange)" : "var(--accent-blue)",
            animation: `bounce-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes tech-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes tech-spin-rev {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes tech-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.25); }
          50%       { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        }
        @keyframes wrench-rock {
          0%, 100% { transform: rotate(-12deg); }
          50%       { transform: rotate(12deg); }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.5; }
          40%            { transform: translateY(-10px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null on the server / before client mount so the server-rendered
  // HTML is always an empty shell — preventing hydration mismatches caused
  // by auth state being read from localStorage (client-only).
  if (!mounted) return <main suppressHydrationWarning />;

  if (loading) return <TechnicianLoader />;

  return isAuthenticated ? <Dashboard /> : <Login />;
}
