"use client";
import React from "react";
import { useLanguage } from "../context/LanguageContext";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    setLanguage(language === "en" ? "am" : "en");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle language"
      className="relative flex items-center p-1 rounded-full overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-blue-500/50 outline-none"
      style={{
        background: "var(--bg-glass)",
        border: "1px solid var(--border-card)",
        width: "72px",
        height: "32px",
      }}
    >
      {/* Sliding background pill */}
      <div 
        className="absolute top-1 bottom-1 rounded-full transition-all duration-300"
        style={{
          width: "30px",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          left: language === "en" ? "4px" : "36px",
          boxShadow: "0 2px 8px rgba(59,130,246,0.4)"
        }}
      />
      
      {/* Labels */}
      <div className="relative w-full flex justify-between px-1.5 text-[11px] font-black z-10 pointer-events-none">
        <span className="flex-1 text-center transition-colors duration-300 tracking-wider" 
              style={{ color: language === "en" ? "#ffffff" : "var(--text-muted)" }}>EN</span>
        <span className="flex-1 text-center transition-colors duration-300 tracking-wider" 
              style={{ color: language === "am" ? "#ffffff" : "var(--text-muted)" }}>AM</span>
      </div>
    </button>
  );
};
