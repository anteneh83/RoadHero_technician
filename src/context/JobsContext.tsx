"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useAuth, API_BASE_URL } from "./AuthContext";

export type JobStatus =
  | "ACCEPTED" | "EN_ROUTE" | "ARRIVED" | "DIAGNOSING"
  | "QUOTE_PENDING" | "QUOTE_ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Driver {
  id: number;
  name: string;
  phone: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plate: string;
}

export interface IncidentLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Job {
  id: number;
  status: JobStatus;
  service_type: string;
  driver: Driver;
  vehicle: Vehicle;
  incident_location: IncidentLocation;
  created_at: string;
  completed_at?: string;
  final_price?: string;
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

export function JobsProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [historyNextPage, setHistoryNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/jobs`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      console.log(data, "job data")
      if (res.ok) {
        setJobs(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const fetchHistory = useCallback(async (page = 1) => {
    if (!accessToken) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/jobs/history?page=${page}&page_size=20`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setHistoryError(data?.message || "Failed to load history.");
        return;
      }
      const results: Job[] = Array.isArray(data.data?.results) ? data.data.results : [];
      if (page === 1) {
        setHistory(results);
      } else {
        setHistory(prev => [...prev, ...results]);
      }
      setHistoryCount(data.data?.count ?? results.length);
      setHistoryNextPage(data.data?.next ?? null);
    } catch {
      setHistoryError("Unable to connect to server. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [accessToken]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyNextPage || historyLoading) return;
    const url = new URL(historyNextPage, "https://roadhero.online");
    const page = parseInt(url.searchParams.get("page") || "2");
    await fetchHistory(page);
  }, [historyNextPage, historyLoading, fetchHistory]);

  const updateJobStatus = useCallback(async (
    jobId: number,
    status: JobStatus
  ): Promise<{ success: boolean; message?: string }> => {
    if (!accessToken) return { success: false, message: "Not authenticated" };
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));
        return { success: true };
      }
      return { success: false, message: data?.message || "Failed to update status." };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [accessToken]);

  useEffect(() => {
    if (isAuthenticated) fetchJobs();
  }, [isAuthenticated, fetchJobs]);

  return (
    <JobsContext.Provider value={{
      jobs, history, historyCount, historyNextPage,
      loading, historyLoading, historyError,
      fetchJobs, fetchHistory, loadMoreHistory, updateJobStatus
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
