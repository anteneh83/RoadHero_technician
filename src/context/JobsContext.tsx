"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from "react";
import { useAuth, API_BASE_URL } from "./AuthContext";

export type JobStatus =
  | "ACCEPTED" | "EN_ROUTE" | "ARRIVED" | "DIAGNOSING"
  | "QUOTE_PENDING" | "QUOTE_ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Driver {
  id?: number;
  name: string;
  phone: string;
}

export interface Vehicle {
  make?: string;
  model?: string;
  year?: number;
  plate?: string;
}

export interface IncidentLocation {
  lat?: number;
  lng?: number;
  address: string;
}

export interface Job {
  id: number;
  status: JobStatus;
  service_type: string;    // mapped from category OR service_type
  description?: string;
  provider_name?: string;
  driver: Driver;
  vehicle?: Vehicle;
  incident_location: IncidentLocation;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  final_price?: string;
  is_scheduled?: boolean;
  scheduled_time?: string | null;
  eta_minutes?: number | null;
}

export interface HistoryPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

interface JobsContextType {
  jobs: Job[];
  history: Job[];
  historyCount: number;
  historyNextPage: string | null;
  loading: boolean;
  historyLoading: boolean;
  historyError: string | null;
  fetchJobs: () => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  updateJobStatus: (jobId: number, status: JobStatus) => Promise<{ success: boolean; message?: string }>;
}

const JobsContext = createContext<JobsContextType | null>(null);

// ─── Normaliser ─────────────────────────────────────────────────────────────
// Handles BOTH the old flat shape AND the new nested API shape:
//   Old: { driver_name, driver_phone, address, service_type }
//   New: { driver: { full_name, phone_number }, location: { … }, category }
function normalizeJob(raw: any): Job {
  // Driver — try new shape first, fall back to old flat fields
  const driver: Driver = {
    id: raw.driver?.id ?? undefined,
    name: raw.driver?.full_name ?? raw.driver?.name ?? raw.driver_name ?? "—",
    phone: raw.driver?.phone_number ?? raw.driver?.phone ?? raw.driver_phone ?? "",
  };

  // Location — new API uses "location", old uses "incident_location" or flat "address"
  const loc = raw.location ?? raw.incident_location;
  const incident_location: IncidentLocation = loc
    ? { lat: loc.lat, lng: loc.lng, address: loc.address ?? "" }
    : { address: raw.address ?? "" };

  // Vehicle — new API uses plate_number, old uses plate
  const vehicle: Vehicle | undefined = raw.vehicle
    ? {
        make: raw.vehicle.make,
        model: raw.vehicle.model,
        year: raw.vehicle.year,
        plate: raw.vehicle.plate_number ?? raw.vehicle.plate,
      }
    : undefined;

  return {
    id: raw.id,
    status: raw.status ?? (raw.completed_at ? "COMPLETED" : "ACCEPTED"),
    service_type: raw.category ?? raw.service_type ?? "",
    description: raw.description ?? undefined,
    provider_name: raw.provider_name ?? undefined,
    driver,
    vehicle,
    incident_location,
    created_at: raw.created_at ?? "",
    accepted_at: raw.accepted_at ?? undefined,
    completed_at: raw.completed_at ?? undefined,
    final_price: raw.final_price ?? (raw.total_collected != null ? String(raw.total_collected) : undefined),
    is_scheduled: raw.is_scheduled ?? false,
    scheduled_time: raw.scheduled_time ?? null,
    eta_minutes: raw.eta_minutes ?? null,
  };
}

// ─── Extract results from any response shape ─────────────────────────────────
// Handles: data.data.results[], data.data[], data.results[], data[]
function extractResults(data: any): any[] {
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data))          return data.data;
  if (Array.isArray(data?.results))       return data.results;
  if (Array.isArray(data))               return data;
  return [];
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [historyNextPage, setHistoryNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = useCallback((): HeadersInit => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  // ─── Fetch active jobs ─────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/jobs`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        const raw = extractResults(data);
        setJobs(raw.map(normalizeJob));
      }
    } catch {
      // silent fail — user can manually refresh
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders]);

  // ─── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/provider/tech/jobs/history?page=${page}&page_size=20`,
        { headers: authHeaders() },
      );
      const data = await res.json();

      if (!res.ok) {
        setHistoryError(data?.message || "Failed to load history.");
        return;
      }
      // History response can also vary in shape
      const inner = data?.data ?? data;
      const results: Job[] = Array.isArray(inner?.results)
        ? inner.results.map(normalizeJob)
        : Array.isArray(inner?.jobs)
          ? inner.jobs.map(normalizeJob)
          : Array.isArray(inner)
            ? inner.map(normalizeJob)
            : [];

      if (page === 1) {
        setHistory(results);
      } else {
        setHistory(prev => [...prev, ...results]);
      }
      setHistoryCount(inner?.count ?? results.length);
      setHistoryNextPage(inner?.next ?? null);
    } catch {
      setHistoryError("Unable to connect to server. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [accessToken, authHeaders]);

  // ─── Load more history ─────────────────────────────────────────────────────
  const loadMoreHistory = useCallback(async () => {
    if (!historyNextPage || historyLoading) return;
    const url = new URL(historyNextPage, "https://roadhero.online");
    const page = parseInt(url.searchParams.get("page") || "2");
    await fetchHistory(page);
  }, [historyNextPage, historyLoading, fetchHistory]);

  // ─── Update job status ─────────────────────────────────────────────────────
  const updateJobStatus = useCallback(async (
    jobId: number,
    status: JobStatus,
  ): Promise<{ success: boolean; message?: string }> => {
    if (!accessToken) return { success: false, message: "Not authenticated" };
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        // Optimistically update local state
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
        return { success: true, message: data?.message };
      }
      return { success: false, message: data?.message || "Failed to update status." };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [accessToken, authHeaders]);

  // ─── Auto-fetch on login + poll every 30s ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchJobs();

    // Poll every 30 seconds for new job assignments
    pollRef.current = setInterval(fetchJobs, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, fetchJobs]);

  return (
    <JobsContext.Provider value={{
      jobs, history, historyCount, historyNextPage,
      loading, historyLoading, historyError,
      fetchJobs, fetchHistory, loadMoreHistory, updateJobStatus,
    }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used inside JobsProvider");
  return ctx;
}
