"use client";
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Wrench, Delete, Phone, Globe, Sun, Moon } from "lucide-react";

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function Login() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"phone" | "pin">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }, []);

  const handlePinKey = useCallback((key: string) => {
    if (key === "⌫") {
      setPin(p => p.slice(0, -1));
      setError("");
      return;
    }
    if (key === "") return;
    if (pin.length >= 6) return;
    const next = pin + key;
    setPin(next);

    if (next.length === 6) {
      // auto-submit
      submitLogin(phone, next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, phone]);

  const submitLogin = async (phoneNumber: string, pinValue: string) => {
    setLoading(true);
    setError("");
    const result = await login(phoneNumber, pinValue);
    setLoading(false);
    if (!result.success) {
      setError(t("Invalid PIN or phone number."));
      triggerShake();
      setPin("");
    }
  };

  const handlePhoneNext = () => {
    if (!phone.trim()) { setError(t("Please enter your phone number.")); return; }
    setError("");
    setStep("pin");
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}>

      {/* Top-right controls: Theme + Language */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-90"
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            backdropFilter: "blur(12px)",
          }}
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4" style={{ color: "#f59e0b" }} />
            : <Moon className="w-4 h-4" style={{ color: "#6366f1" }} />}
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === "en" ? "am" : "en")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all active:scale-90"
          style={{
            background: "var(--bg-glass)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Globe className="w-3.5 h-3.5" />
          {language === "en" ? "🇪🇹 AM" : "🇬🇧 EN"}
        </button>
      </div>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-15 animate-float"
          style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 60%)" }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative w-full max-w-sm px-6 animate-slide-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 40px rgba(59,130,246,0.4)" }}>
              <Wrench className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -inset-1 rounded-2xl opacity-30 blur-md"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{t("RoadHero")}</h1>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-muted)" }}>{t("Technician Portal")}</p>
        </div>

        {/* Phone Step */}
        {step === "phone" && (
          <div className="animate-scale-in">
            <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)", backdropFilter: "blur(20px)" }}>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("Welcome back")}</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{t("Enter your phone number to continue")}</p>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center">
                  <Phone className="w-5 h-5" style={{ color: "#3b82f6" }} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handlePhoneNext()}
                  placeholder="+251911888999"
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-base font-medium outline-none transition-all"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    caretColor: "#3b82f6",
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <p className="mt-3 text-sm font-medium" style={{ color: "#f87171" }}>{error}</p>
              )}

              <button
                onClick={handlePhoneNext}
                className="w-full mt-5 py-4 rounded-xl text-base font-bold transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}
              >
                {t("Continue")}
              </button>
            </div>
          </div>
        )}

        {/* PIN Step */}
        {step === "pin" && (
          <div className="animate-scale-in">
            <div className="rounded-2xl p-6" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)", backdropFilter: "blur(20px)" }}>
              <button
                onClick={() => { setStep("phone"); setPin(""); setError(""); }}
                className="text-sm font-medium mb-5 flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: "#3b82f6" }}
              >
                ← {phone}
              </button>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>{t("Enter your PIN")}</h2>
              <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{t("6-digit PIN sent by your provider")}</p>

              {/* PIN Dots */}
              <div className={`flex justify-center gap-3 sm:gap-4 mb-8 ${shake ? "animate-shake" : ""}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`pin-dot ${i < pin.length ? (error ? "error" : "filled") : ""}`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <p className="text-center text-sm font-medium mb-5" style={{ color: "#f87171" }}>{error}</p>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="flex justify-center mb-5">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "rgba(59,130,246,0.3)", borderTopColor: "#3b82f6" }} />
                </div>
              )}

              {/* Keypad */}
              {!loading && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 place-items-center">
                  {KEYS.map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePinKey(key)}
                      disabled={key === ""}
                      className={`pin-key ${key === "" ? "opacity-0 pointer-events-none" : ""}`}
                    >
                      {key === "⌫"
                        ? <Delete className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
                        : key}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          {t("Secured by RoadHero · Technician Access Only")}
        </p>
      </div>
    </div>
  );
}