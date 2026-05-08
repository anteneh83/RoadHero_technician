"use client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
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
}

export interface NewItemPayload {
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: string;
  spare_part_id?: number;
}

interface QuoteContextType {
  quote: Quote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  createQuote: (jobId: number, notes?: string) => Promise<Quote | null>;
  getQuote: (quoteId: number) => Promise<Quote | null>;
  addItem: (quoteId: number, item: NewItemPayload) => Promise<QuoteItem | null>;
  removeItem: (quoteId: number, itemId: number) => Promise<boolean>;
  submitQuote: (quoteId: number) => Promise<{ success: boolean; message?: string }>;
  clearQuote: () => void;
}

const QuoteContext = createContext<QuoteContextType | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const createQuote = useCallback(async (jobId: number, notes = ""): Promise<Quote | null> => {
    if (!accessToken) return null;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/jobs/${jobId}/quotes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuoteError(data?.message || "Failed to create quote.");
        return null;
      }
      const q: Quote = data.data ?? data;
      setQuote(q);
      return q;
    } catch {
      setQuoteError("Network error. Please try again.");
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, [accessToken]);

  const getQuote = useCallback(async (quoteId: number): Promise<Quote | null> => {
    if (!accessToken) return null;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/provider/quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setQuoteError(data?.message || "Failed to fetch quote.");
        return null;
      }
      const q: Quote = data.data ?? data;
      setQuote(q);
      return q;
    } catch {
      setQuoteError("Network error. Please try again.");
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, [accessToken]);

  const addItem = useCallback(async (quoteId: number, item: NewItemPayload): Promise<QuoteItem | null> => {
    if (!accessToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/provider/quotes/${quoteId}/items`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuoteError(data?.message || "Failed to add item.");
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
      setQuoteError("Network error. Please try again.");
      return null;
    }
  }, [accessToken]);

  const removeItem = useCallback(async (quoteId: number, itemId: number): Promise<boolean> => {
    if (!accessToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/provider/quotes/${quoteId}/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setQuote(prev => {
          if (!prev) return prev;
          const items = prev.items.filter(i => i.id !== itemId);
          const total = items.reduce((s, i) => s + parseFloat(i.line_total), 0);
          return { ...prev, items, total_amount: total.toFixed(2) };
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [accessToken]);

  const submitQuote = useCallback(async (quoteId: number): Promise<{ success: boolean; message?: string }> => {
    if (!accessToken) return { success: false, message: "Not authenticated." };
    try {
      const res = await fetch(`${API_BASE_URL}/provider/quotes/${quoteId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setQuote(prev => prev ? { ...prev, status: "SENT" } : prev);
        return { success: true, message: data?.message };
      }
      return { success: false, message: data?.message || "Failed to submit quote." };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [accessToken]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setQuoteError(null);
  }, []);

  return (
    <QuoteContext.Provider value={{ quote, quoteLoading, quoteError, createQuote, getQuote, addItem, removeItem, submitQuote, clearQuote }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside QuoteProvider");
  return ctx;
}
