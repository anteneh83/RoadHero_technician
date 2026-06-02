"use client";
import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";
import { useAuth, API_BASE_URL } from "./AuthContext";

export type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "REVISED";
export type ItemType = "PART" | "LABOR";

export interface QuoteItem {
  id: number;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  spare_part_id: number | null;
}

export interface Quote {
  id: number;
  status: QuoteStatus;
  job_id: number;
  provider_id: number;
  technician_id: number;
  notes: string;
  total_amount: string;
  items: QuoteItem[];
  created_at: string;
  rejection_reason?: string;
}

export interface NewItemPayload {
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: string;
  spare_part_id?: number | null;
}

export interface ApiResult {
  success: boolean;
  message?: string;
  error_code?: string;
}

interface QuoteContextType {
  quote: Quote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  quoteErrorCode: string | null;
  createQuote: (jobId: number, notes?: string) => Promise<Quote | null>;
  getQuote: (quoteId: number) => Promise<Quote | null>;
  fetchQuoteByJob: (jobId: number) => Promise<Quote | null>;
  addItem: (quoteId: number, item: NewItemPayload) => Promise<QuoteItem | null>;
  removeItem: (quoteId: number, itemId: number) => Promise<ApiResult>;
  submitQuote: (quoteId: number) => Promise<ApiResult>;
  clearQuote: () => void;
}

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteErrorCode, setQuoteErrorCode] = useState<string | null>(null);
  const quoteMapRef = useRef<Record<number, number>>({});

  const headers = useCallback((): HeadersInit => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  const setError = (msg: string | null, code: string | null = null) => {
    setQuoteError(msg);
    setQuoteErrorCode(code);
  };

  // ─── Create Quote ──────────────────────────────────────────────────────────
  const createQuote = useCallback(async (jobId: number, notes = ""): Promise<Quote | null> => {
    if (!accessToken) return null;
    setQuoteLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/jobs/${jobId}/quotes`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to create recommendation.", data?.error_code ?? null);
        return null;
      }
      const q: Quote = { ...(data.data ?? data), items: data.data?.items ?? [] };
      setQuote(q);
      quoteMapRef.current[jobId] = q.id;
      return q;
    } catch {
      setError("Network error. Please try again.");
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, [accessToken, headers]);

  // ─── Get Quote ─────────────────────────────────────────────────────────────
  const getQuote = useCallback(async (quoteId: number): Promise<Quote | null> => {
    if (!accessToken) return null;
    setQuoteLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/quotes/${quoteId}`, {
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to fetch recommendation.", data?.error_code ?? null);
        return null;
      }
      const q: Quote = data.data ?? data;
      setQuote(q);
      return q;
    } catch {
      setError("Network error. Please try again.");
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, [accessToken, headers]);

  // ─── Fetch Quote by Job ID ─────────────────────────────────────────────────
  const fetchQuoteByJob = useCallback(async (jobId: number): Promise<Quote | null> => {
    if (!accessToken) return null;
    setQuoteLoading(true);
    setError(null);
    try {
      let knownQuoteId = quoteMapRef.current[jobId];

      if (!knownQuoteId) {
        const res = await fetch(`${API_BASE_URL}/provider/tech/jobs/${jobId}/quotes`, {
          headers: headers(),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "Failed to fetch recommendation for this job.", data?.error_code ?? null);
          return null;
        }
        
        // Handle paginated responses or direct list/object envelopes
        const rawList = data.data?.results ?? data.results ?? data.data ?? data;
        const quotesArray = Array.isArray(rawList) ? rawList : [];
        const qSummary = quotesArray[0] || (!Array.isArray(rawList) && rawList?.id ? rawList : null);
        
        if (qSummary && qSummary.id) {
          knownQuoteId = qSummary.id;
          quoteMapRef.current[jobId] = knownQuoteId;
        }
      }

      if (knownQuoteId) {
        const res = await fetch(`${API_BASE_URL}/provider/tech/quotes/${knownQuoteId}`, {
          headers: headers(),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "Failed to fetch recommendation details.", data?.error_code ?? null);
          return null;
        }
        return data.data ?? data;
      }

      setError("No recommendation found for this job.");
      return null;
    } catch (err) {
      console.error("[fetchQuoteByJob] Error:", err);
      setError("Network error. Please try again.");
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, [accessToken, headers]);

  // ─── Add Line Item ─────────────────────────────────────────────────────────
  const addItem = useCallback(async (quoteId: number, item: NewItemPayload): Promise<QuoteItem | null> => {
    if (!accessToken) return null;
    setError(null);
    try {
      // Strip spare_part_id if null/undefined to keep payload clean
      const payload: Record<string, unknown> = {
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      };
      if (item.spare_part_id != null) payload.spare_part_id = item.spare_part_id;

      const res = await fetch(`${API_BASE_URL}/provider/tech/quotes/${quoteId}/items`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to add item.", data?.error_code ?? null);
        return null;
      }
      const newItem: QuoteItem = data.data ?? data;
      setQuote(prev => {
        if (!prev) return prev;
        const items = [...prev.items, newItem];
        const total = items.reduce((s, i) => s + parseFloat(i.line_total), 0);
        return { ...prev, items, total_amount: total.toFixed(2) };
      });
      return newItem;
    } catch {
      setError("Network error. Please try again.");
      return null;
    }
  }, [accessToken, headers]);

  // ─── Remove Line Item ──────────────────────────────────────────────────────
  const removeItem = useCallback(async (quoteId: number, itemId: number): Promise<ApiResult> => {
    if (!accessToken) return { success: false, message: "Not authenticated." };
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/quotes/${quoteId}/items/${itemId}`, {
        method: "DELETE",
        headers: headers(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setQuote(prev => {
          if (!prev) return prev;
          const items = prev.items.filter(i => i.id !== itemId);
          const total = items.reduce((s, i) => s + parseFloat(i.line_total), 0);
          return { ...prev, items, total_amount: total.toFixed(2) };
        });
        return { success: true, message: data?.message };
      }
      return { success: false, message: data?.message || "Failed to remove item.", error_code: data?.error_code };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [accessToken, headers]);

  // ─── Submit Quote to Driver ────────────────────────────────────────────────
  const submitQuote = useCallback(async (quoteId: number): Promise<ApiResult> => {
    if (!accessToken) return { success: false, message: "Not authenticated." };
    try {
      const res = await fetch(`${API_BASE_URL}/provider/tech/quotes/${quoteId}/submit`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setQuote(prev => prev ? { ...prev, status: "SENT" } : prev);
        return { success: true, message: data?.message || "Quote sent to driver for approval." };
      }
      return {
        success: false,
        message: data?.message || "Failed to submit recommendation.",
        error_code: data?.error_code,
      };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [accessToken, headers]);

  // ─── Clear ─────────────────────────────────────────────────────────────────
  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return (
    <QuoteContext.Provider value={{
      quote, quoteLoading, quoteError, quoteErrorCode,
      createQuote, getQuote, fetchQuoteByJob, addItem, removeItem, submitQuote, clearQuote,
    }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside QuoteProvider");
  return ctx;
}
