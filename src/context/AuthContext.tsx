"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

export interface TechnicianProfile {
  id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  photo_url: string;
  rating: string;
  is_active: boolean;
  specialties: string[];
  provider: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (phoneNumber: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  accessToken: string | null;
  refreshToken: string | null;
  profile: TechnicianProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const API_BASE_URL = "https://roadhero.online/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeProfile = (raw: any): TechnicianProfile => {
    const src = raw?.data ?? raw ?? {};
    const specialties: string[] = Array.isArray(src.specialties)
      ? src.specialties.filter((s: unknown): s is string => typeof s === "string" && s.trim() !== "")
      : Array.isArray(src.skills)
        ? src.skills.filter((s: unknown): s is string => typeof s === "string" && s.trim() !== "")
        : [];
    return {
      id: src.id ?? 0,
      user_id: src.user_id ?? 0,
      full_name: String(src.full_name ?? "").trim(),
      phone_number: String(src.phone_number ?? "").trim(),
      photo_url: String(src.photo_url ?? "").trim(),
      rating: String(src.rating ?? "0.00"),
      is_active: Boolean(src.is_active),
      specialties,
      provider: {
        id: src.provider?.id ?? 0,
        name: String(src.provider?.name ?? src.provider?.business_name ?? "").trim(),
      },
    };
  };

  const fetchProfile = useCallback(async (token: string) => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/profile`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setProfile(normalizeProfile(data?.data ?? data));
    } catch {
      // keep existing profile on network error
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedAccess = localStorage.getItem("rh_access");
    const storedRefresh = localStorage.getItem("rh_refresh");
    if (storedAccess && storedRefresh) {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setIsAuthenticated(true);
      fetchProfile(storedAccess);
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (phoneNumber: string, pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/provider/auth/tech/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data?.message || "Invalid phone number or PIN." };
      }
      const access = data.data?.access ?? data.data?.token ?? data.access ?? data.token;
      const refresh = data.data?.refresh ?? data.data?.refresh_token ?? data.refresh ?? data.refresh_token;
      if (!access || !refresh) {
        return { success: false, message: "Invalid response from server." };
      }
      // Set loading BEFORE authenticating so the TechnicianLoader stays visible
      // in page.tsx until fetchProfile completes — prevents the "Profile unavailable" flash.
      setLoading(true);
      setAccessToken(access);
      setRefreshToken(refresh);
      localStorage.setItem("rh_access", access);
      localStorage.setItem("rh_refresh", refresh);
      setIsAuthenticated(true);
      await fetchProfile(access); // sets loading=false in its finally block
      return { success: true };
    } catch {
      setLoading(false);
      return { success: false, message: "Unable to reach server. Check your connection." };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (accessToken) await fetchProfile(accessToken);
  }, [accessToken, fetchProfile]);

  const logout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    setProfile(null);
    localStorage.removeItem("rh_access");
    localStorage.removeItem("rh_refresh");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, refreshProfile, accessToken, refreshToken, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
