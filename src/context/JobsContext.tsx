"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type JobStatus =
  | "ACCEPTED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "DIAGNOSING"
  | "QUOTE_PENDING"
  | "QUOTE_ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface Job {
  id: number;
  status: JobStatus;
  service_type: string;
  driver: {
    name: string;
  };
  vehicle: {
    make: string;
    model: string;
  };
  incident_location: {
    address: string;
  };
  final_price?: string;
  completed_at?: string;
}

interface JobsContextType {
  jobs: Job[];
  history: Job[];
  loading: boolean;
  historyLoading: boolean;
  historyError: string | null;
  fetchJobs: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  updateJobStatus: (jobId: number, status: JobStatus) => Promise<boolean>;
}

const JobsContext = createContext<JobsContextType | null>(null);
const API_BASE_URL = "https://roadhero.online/api/v1";

export function JobsProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!accessToken) {
      console.error('Cannot fetch jobs: no access token available');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/provider/tech/jobs`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to fetch jobs:', response.status, data);
        return;
      }
      setJobs(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!accessToken) {
      console.error('Cannot fetch history: no access token available');
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/provider/tech/jobs/history`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data?.message || `Failed to load history (${response.status})`;
        console.error('Failed to fetch history:', response.status, data);
        setHistoryError(errorMessage);
        return;
      }
      setHistory(Array.isArray(data.data?.results) ? data.data.results : []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistoryError('Unable to connect to server. Please try again later.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateJobStatus = async (jobId: number, status: JobStatus): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/provider/tech/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        // Update local state
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status } : job
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update job status:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
    }
  }, [isAuthenticated]);

  return (
    <JobsContext.Provider value={{ jobs, history, loading, historyLoading, historyError, fetchJobs, fetchHistory, updateJobStatus }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used inside JobsProvider");
  return ctx;
}
