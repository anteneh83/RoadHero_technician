"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface TechnicianProfile {
  full_name: string;
  phone_number: string;
  skills: string[];
  provider: {
    business_name: string;
    is_online: boolean;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (phoneNumber: string, pin: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  accessToken: string | null;
  refreshToken: string | null;
  profile: TechnicianProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const API_BASE_URL = "https://roadhero.online/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored tokens on mount
    const storedAccess = localStorage.getItem('access_token');
    const storedRefresh = localStorage.getItem('refresh_token');
    if (storedAccess && storedRefresh) {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setIsAuthenticated(true);
      // Fetch profile
      fetchProfile(storedAccess);
    } else {
      setLoading(false);
    }
  }, []);

  const normalizeProfile = (raw: any): TechnicianProfile => {
    // Handle null/undefined raw data
    if (!raw) {
      console.warn('Profile data is null or undefined');
      return {
        full_name: "",
        phone_number: "",
        skills: [],
        provider: {
          business_name: "",
          is_online: false,
        },
      };
    }

    const profileSource = raw?.data ?? raw;

    // Handle null/undefined profileSource
    if (!profileSource) {
      console.warn('Profile source data is null or undefined');
      return {
        full_name: "",
        phone_number: "",
        skills: [],
        provider: {
          business_name: "",
          is_online: false,
        },
      };
    }

    const user = profileSource.user || {};
    const technician = profileSource.technician || {};

    // Safely extract values with fallbacks
    const fullName = profileSource.full_name || user.full_name || technician.full_name || "";
    const phoneNumber = profileSource.phone_number || user.phone_number || "";
    const skills = Array.isArray(profileSource.skills)
    ? (profileSource.skills as unknown[])
        .filter((skill: unknown): skill is string => typeof skill === "string" && skill.trim() !== "")
    : Array.isArray(technician.specialties)
    ? (technician.specialties as unknown[])
        .filter((specialty: unknown): specialty is string => typeof specialty === "string" && specialty.trim() !== "")
    : [];

    const provider = profileSource.provider || {};
    const businessName = provider.business_name || technician.provider_name || "";
    const isOnline = typeof provider.is_online === "boolean"
      ? provider.is_online
      : typeof technician.is_active === "boolean"
      ? technician.is_active
      : false;

    return {
      full_name: String(fullName).trim(),
      phone_number: String(phoneNumber).trim(),
      skills,
      provider: {
        business_name: String(businessName).trim(),
        is_online: Boolean(isOnline),
      },
    };
  };

  const fetchProfile = async (token: string) => {
    if (!token) {
      console.error('Cannot fetch profile: no access token provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/provider/tech/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch profile:', response.status, response.statusText);
        // Don't set profile to null on error, keep existing profile if available
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Handle various response formats
      const profileData = data?.data || data;

      if (!profileData) {
        console.warn('Profile response contains no data');
        setProfile({
          full_name: "",
          phone_number: "",
          skills: [],
          provider: {
            business_name: "",
            is_online: false,
          },
        });
        setLoading(false);
        return;
      }

      const normalizedProfile = normalizeProfile(profileData);
      setProfile(normalizedProfile);

    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // On network error, don't clear existing profile
    } finally {
      setLoading(false);
    }
  };

  const login = async (phoneNumber: string, pin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/provider/auth/tech/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          pin,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data?.message || 'Invalid phone number or PIN';
        console.error('Login failed:', message, data);
        return { success: false, message };
      }

      const access = data.data?.access || data.data?.token || data.access || data.token;
      const refresh = data.data?.refresh || data.data?.refresh_token || data.refresh || data.refresh_token;

      if (!access || !refresh) {
        console.error('Login failed: missing access or refresh tokens', data);
        return { success: false, message: 'Invalid login response from server' };
      }

      setAccessToken(access);
      setRefreshToken(refresh);
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setIsAuthenticated(true);
      await fetchProfile(access);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Unable to reach login server' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    setProfile(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, accessToken, refreshToken, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
