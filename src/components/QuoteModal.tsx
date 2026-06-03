"use client";
import { useState, useCallback, useEffect } from "react";
import { useQuote, NewItemPayload, ItemType } from "../context/QuoteContext";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  X, Plus, Trash2, Wrench, Package, Send, Loader2,
  CheckCircle, AlertCircle, Hash, RotateCcw, Info,
} from "lucide-react";

interface QuoteModalProps {
  jobId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

type Step = "notes" | "items" | "submitted";

interface InventoryItem {
  id: number;
  name: string;
  price: number;           // parsed from string
  available_quantity: number;  // from API: available_quantity
  is_in_stock: boolean;    // from API: is_in_stock
  description?: string;
  low_stock_threshold: number;
}

const EMPTY_ITEM = {
  item_type: "PART" as ItemType,
  description: "",
  quantity: 1,
  unit_price: "",
  spare_part_id: "",   // stored as string for the input, converted on submit
};

// ─── Error code → human-readable banner ────────────────────────────────────
const ERROR_CODE_LABELS: Record<string, { icon: string; color: string }> = {
  INSUFFICIENT_STOCK: { icon: "⚠️", color: "#f97316" },
  INVALID_TRANSITION: { icon: "🔒", color: "#f43f5e" },
  BAD_REQUEST: { icon: "❌", color: "#ef4444" },
};

function ErrorBanner({ message, code }: { message: string; code?: string | null }) {
  const meta = code ? ERROR_CODE_LABELS[code] : null;
  return (
    <div className="rounded-xl px-4 py-3 flex items-start gap-2 animate-slide-up"
      style={{
        background: "rgba(239,68,68,0.12)",
        border: `1px solid rgba(239,68,68,0.3)`,
      }}>
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f87171" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "#f87171" }}>{message}</p>
        {meta && (
          <p className="text-xs mt-0.5 font-mono" style={{ color: meta.color }}>
            {meta.icon} Code: {code}
          </p>
        )}
      </div>
    </div>
  );
}

function Toast({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className="mx-5 mt-3 flex-shrink-0 px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-up"
      style={{
        background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
        border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      }}>
      {ok
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />}
      <p className="text-sm font-medium" style={{ color: ok ? "#10b981" : "#f87171" }}>{msg}</p>
    </div>
  );
}

export default function QuoteModal({ jobId, onClose, onSubmitted }: QuoteModalProps) {
  const {
    quote, quoteLoading, quoteError, quoteErrorCode,
    createQuote, addItem, removeItem, submitQuote, clearQuote,
  } = useQuote();

  const { accessToken, profile } = useAuth();
  const { t } = useLanguage();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<Step>("notes");
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });
  const [addingItem, setAddingItem] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!accessToken) return;
    setInventoryLoading(true);
    setInventoryError(null);

    const providerId = profile?.provider?.id;

    // ── Attempt 1: provider inventory (works if tech token has access) ──
    try {
      const url1 = `${API_BASE_URL}/provider/inventory/`;
      const res1 = await fetch(url1, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const body1 = await res1.json();

      if (res1.ok) {
        const raw = body1.data ?? body1;
        const list: InventoryItem[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
        setInventoryItems(list);
        setInventoryLoading(false);
        return;
      }
      console.warn(`[Inventory] Attempt 1 failed: ${res1.status} — ${body1?.message ?? "unknown error"}`);
    } catch (err) {
      console.error("[Inventory] Attempt 1 network error:", err);
    }

    // ── Attempt 2: public spare-parts endpoint via provider ID ──
    if (providerId) {
      try {
        const url2 = `${API_BASE_URL}/driver/providers/${providerId}/spare-parts`;
        const res2 = await fetch(url2, {
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        });
        const body2 = await res2.json();

        if (res2.ok) {
          const raw = body2.data ?? body2;
          const list: InventoryItem[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.results)
              ? raw.results
              : [];
          // normalise field names from API response
          const normalised: InventoryItem[] = list.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price ?? p.unit_price ?? "0"),
            available_quantity: p.available_quantity ?? p.quantity ?? p.stock ?? 0,
            is_in_stock: p.is_in_stock ?? ((p.available_quantity ?? p.quantity ?? 0) > 0),
            description: p.description,
            low_stock_threshold: p.low_stock_threshold ?? 5,
          }));
          setInventoryItems(normalised);
          setInventoryLoading(false);
          return;
        }
        console.warn(`[Inventory] Attempt 2 failed: ${res2.status} — ${body2?.message ?? "unknown"}`);
      } catch (err) {
        console.error("[Inventory] Attempt 2 network error:", err);
      }
    }

    // Both attempts failed
    const errMsg = "Could not load spare parts — parts can still be entered manually.";
    console.error(`[Inventory] All attempts failed.`);
    setInventoryError(errMsg);
    setInventoryLoading(false);
  }, [accessToken, profile]);

  useEffect(() => {
    if (step === "items") {
      fetchInventory();
    }
  }, [step, fetchInventory]);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Step 1: Create quote ──────────────────────────────────────────────────
  const handleCreateQuote = async () => {
    setLocalError(null);
    const q = await createQuote(jobId, notes.trim());
    if (q) {
      setStep("items");
    } else {
      setLocalError(quoteError || "Failed to create quote.");
    }
  };

  // ─── Step 2: Add item ──────────────────────────────────────────────────────
  const handleAddItem = useCallback(async () => {
    if (!quote) return;
    setLocalError(null);

    if (!newItem.description.trim()) {
      setLocalError("Description is required.");
      return;
    }
    const price = parseFloat(newItem.unit_price);
    if (!newItem.unit_price || isNaN(price) || price <= 0) {
      setLocalError("Enter a valid price greater than 0.");
      return;
    }

    setAddingItem(true);
    const payload: NewItemPayload = {
      item_type: newItem.item_type,
      description: newItem.description.trim(),
      quantity: newItem.quantity,
      unit_price: price,
      spare_part_id: newItem.spare_part_id !== ""
        ? parseInt(newItem.spare_part_id, 10)
        : null,
    };
    const result = await addItem(quote.id, payload);
    setAddingItem(false);

    if (result) {
      setNewItem({ ...EMPTY_ITEM });
      showToast(true, "Item added successfully.");
    } else {
      setLocalError(quoteError || "Failed to add item.");
    }
  }, [quote, newItem, addItem, quoteError]);

  // ─── Remove item ───────────────────────────────────────────────────────────
  const handleRemoveItem = async (itemId: number) => {
    if (!quote) return;
    setRemovingId(itemId);
    const result = await removeItem(quote.id, itemId);
    setRemovingId(null);
    if (!result.success) {
      showToast(false, result.message || "Failed to remove item.");
    }
  };

  // ─── Submit to driver ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!quote) return;
    setLocalError(null);

    if (quote.items.length === 0) {
      setLocalError("Add at least one item before submitting.");
      return;
    }
    setSubmitting(true);
    const result = await submitQuote(quote.id);
    setSubmitting(false);

    if (result.success) {
      setStep("submitted");
      setTimeout(() => { clearQuote(); onSubmitted(); }, 2500);
    } else {
      setLocalError(result.message || "Failed to submit quote.");
    }
  };

  // ─── Total ─────────────────────────────────────────────────────────────────
  const total = quote ? parseFloat(quote.total_amount) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-h-[92dvh] flex flex-col rounded-t-3xl animate-sheet-up overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(148,163,184,0.3)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>
              {step === "notes" && t("New Spare Part Recommendation")}
              {step === "items" && t("Add Line Items")}
              {step === "submitted" && (t("Recommendation Sent!") + " 🎉")}
            </h3>
            {quote && (
              <p className="text-xs mt-0.5 font-mono" style={{ color: "#475569" }}>
                Recommendation #{quote.id} ·{" "}
                <span style={{
                  color: quote.status === "SENT" ? "#fbbf24"
                    : quote.status === "DRAFT" ? "#60a5fa"
                      : "#34d399"
                }}>
                  {quote.status}
                </span>
                {" "}· Job #{jobId}
              </p>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--border-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Global toast */}
        {toast && <Toast ok={toast.ok} msg={toast.msg} />}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Step 1: Notes ───────────────────────────────────────────── */}
          {step === "notes" && (
            <div className="space-y-4 animate-scale-in">

              {/* Info callout */}
              <div className="rounded-xl px-4 py-3 flex items-start gap-2"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                  {t("Add diagnostic notes, then build your itemised recommendation with parts & labour. The driver will receive a push notification to approve.")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--text-muted)" }}>
                  Diagnostic Notes <span style={{ color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Engine oil depleted. Full replacement needed."
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                  style={{
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    caretColor: "#3b82f6",
                  }}
                />
              </div>

              {localError && <ErrorBanner message={localError} code={quoteErrorCode} />}

              <button onClick={handleCreateQuote} disabled={quoteLoading}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
                }}>
                {quoteLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>{t("Create Estimate")}</>}
              </button>
            </div>
          )}

          {/* ── Step 2: Line items ──────────────────────────────────────── */}
          {step === "items" && quote && (
            <div className="space-y-5 animate-scale-in">

              {/* Total amount banner */}
              <div className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#34d399" }}>{t("Total Amount")}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                    {quote.items.length} item{quote.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-2xl font-black" style={{ color: "#10b981" }}>
                  {total.toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                </span>
              </div>

              {/* Existing items list */}
              {quote.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {t("Line Items")} ({quote.items.length})
                  </p>
                  {quote.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3"
                      style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)" }}>
                      {/* Type icon */}
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: item.item_type === "PART" ? "rgba(59,130,246,0.15)" : item.item_type === "LABOR" ? "rgba(249,115,22,0.15)" : "rgba(168,85,247,0.15)" }}>
                        {item.item_type === "PART"
                          ? <Package className="w-4 h-4" style={{ color: "#3b82f6" }} />
                          : item.item_type === "LABOR"
                            ? <Wrench className="w-4 h-4" style={{ color: "#f97316" }} />
                            : <Hash className="w-4 h-4" style={{ color: "#a78bfa" }} />}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {item.description}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {item.quantity} × {parseFloat(item.unit_price).toLocaleString()} = {" "}
                          <span style={{ color: "#60a5fa" }}>
                            {parseFloat(item.line_total).toLocaleString()} ETB
                          </span>
                          {item.spare_part_id && (
                            <span className="ml-2 font-mono" style={{ color: "#a78bfa" }}>
                              Part #{item.spare_part_id}
                            </span>
                          )}
                        </p>
                      </div>
                      {/* Remove */}
                      <button onClick={() => handleRemoveItem(item.id)}
                        disabled={removingId === item.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                        {removingId === item.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Add item form ────────────────────────────────────────── */}
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Add Item
                </p>

                {/* PART / LABOR toggle */}
                <div className="flex gap-2">
                  {(["PART", "LABOR", "FEE"] as ItemType[]).map(t => (
                    <button key={t}
                      onClick={() => setNewItem(p => ({ ...p, item_type: t, quantity: (t === "LABOR" || t === "FEE") ? 1 : p.quantity, spare_part_id: t !== "PART" ? "" : p.spare_part_id }))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: newItem.item_type === t
                          ? (t === "PART" ? "rgba(59,130,246,0.2)" : t === "LABOR" ? "rgba(249,115,22,0.2)" : "rgba(168,85,247,0.2)")
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${newItem.item_type === t
                          ? (t === "PART" ? "rgba(59,130,246,0.4)" : t === "LABOR" ? "rgba(249,115,22,0.4)" : "rgba(168,85,247,0.4)")
                          : "rgba(148,163,184,0.1)"}`,
                        color: newItem.item_type === t
                          ? (t === "PART" ? "#60a5fa" : t === "LABOR" ? "#fb923c" : "#c084fc")
                          : "#64748b",
                      }}>
                      {t === "PART" ? <Package className="w-4 h-4" /> : t === "LABOR" ? <Wrench className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                      {t}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <input
                  placeholder={t("Description *")}
                  value={newItem.description}
                  onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--bg-glass)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    caretColor: "#3b82f6",
                  }}
                />

                {/* Qty + Price row */}
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder={t("Qty")}
                    min={1}
                    value={newItem.quantity}
                    onChange={e => setNewItem(p => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    disabled={newItem.item_type === "LABOR" || newItem.item_type === "FEE"}
                    className="w-20 px-3 py-3 rounded-xl text-sm text-center outline-none"
                    style={{
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <input
                    type="number"
                    placeholder={t("Unit price (ETB) *")}
                    min={0}
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={e => setNewItem(p => ({ ...p, unit_price: e.target.value }))}
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      caretColor: "#3b82f6",
                    }}
                  />
                </div>

                {/* ── Spare Part Custom Picker ─────────────────────── */}
                {newItem.item_type === "PART" && (() => {
                  const selectedPart = inventoryItems.find(i => i.id.toString() === newItem.spare_part_id);
                  return (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>
                        Spare Part — links to inventory
                      </label>

                      <button
                        type="button"
                        onClick={() => !inventoryLoading && setShowPartsDropdown(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left"
                        style={{
                          background: "var(--bg-glass)",
                          border: `1px solid ${inventoryError ? "rgba(239,68,68,0.3)" : showPartsDropdown ? "rgba(167,139,250,0.5)" : "var(--border-subtle)"}`,
                          color: selectedPart ? "var(--text-primary)" : "var(--text-muted)",
                        }}
                      >
                        <span className="truncate">
                          {inventoryLoading
                            ? "⏳ Loading parts…"
                            : selectedPart
                              ? selectedPart.name
                              : inventoryError
                                ? "⚠️ Could not load — enter manually"
                                : inventoryItems.length === 0
                                  ? "No parts in inventory"
                                  : "Select spare part (optional)"}
                        </span>
                        <span className="ml-2 flex-shrink-0" style={{ color: "#7c3aed" }}>
                          {inventoryLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <span className="text-xs">{showPartsDropdown ? "▲" : "▼"}</span>}
                        </span>
                      </button>

                      {/* Custom dropdown list */}
                      {showPartsDropdown && !inventoryLoading && (
                        <div
                          className="rounded-xl overflow-hidden z-10"
                          style={{
                            border: "1px solid rgba(167,139,250,0.25)",
                            background: "var(--bg-card)",
                            maxHeight: 260,
                            overflowY: "auto",
                          }}
                        >
                          {/* Clear selection row */}
                          <button
                            type="button"
                            onClick={() => {
                              setNewItem(p => ({ ...p, spare_part_id: "", description: "", unit_price: "" }));
                              setShowPartsDropdown(false);
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-left text-xs"
                            style={{ color: "#475569", borderBottom: "1px solid rgba(148,163,184,0.08)" }}
                          >
                            — No part selected (manual entry)
                          </button>

                          {inventoryItems.map(item => {
                            const isSelected = item.id.toString() === newItem.spare_part_id;
                            const outOfStock = !item.is_in_stock;
                            const lowStock = item.is_in_stock && item.available_quantity <= item.low_stock_threshold;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                disabled={outOfStock}
                                onClick={() => {
                                  if (outOfStock) return;
                                  setNewItem(p => ({
                                    ...p,
                                    spare_part_id: item.id.toString(),
                                    description: item.name,
                                    unit_price: item.price.toString(),
                                  }));
                                  setShowPartsDropdown(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 text-left"
                                style={{
                                  borderBottom: "1px solid rgba(148,163,184,0.06)",
                                  background: isSelected
                                    ? "rgba(167,139,250,0.12)"
                                    : outOfStock
                                      ? "transparent"
                                      : "transparent",
                                  opacity: outOfStock ? 0.45 : 1,
                                  cursor: outOfStock ? "not-allowed" : "pointer",
                                }}
                              >
                                {/* Left: name */}
                                <div className="flex-1 min-w-0 mr-3">
                                  <p className="text-sm font-semibold truncate"
                                    style={{ color: isSelected ? "#c4b5fd" : outOfStock ? "var(--text-muted)" : "var(--text-primary)" }}>
                                    {item.name}
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                                    {item.price.toLocaleString()} ETB per unit
                                  </p>
                                </div>

                                {/* Right: stock badge */}
                                <div className="flex-shrink-0 text-right">
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                    style={{
                                      background: outOfStock
                                        ? "rgba(239,68,68,0.12)"
                                        : lowStock
                                          ? "rgba(249,115,22,0.12)"
                                          : "rgba(16,185,129,0.12)",
                                      color: outOfStock ? "#f87171" : lowStock ? "#f97316" : "#34d399",
                                    }}
                                  >
                                    {outOfStock ? "Out of stock" : `${item.available_quantity} left`}
                                  </span>
                                  {isSelected && (
                                    <p className="text-xs mt-1" style={{ color: "#7c3aed" }}>✓ selected</p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Error notice */}
                      {inventoryError && (
                        <p className="text-xs flex items-start gap-1.5" style={{ color: "#f97316" }}>
                          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          {inventoryError}
                        </p>
                      )}

                      {/* Selected part info strip */}
                      {selectedPart && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
                          <p className="text-xs flex items-center gap-1.5" style={{ color: "#a78bfa" }}>
                            <Info className="w-3 h-3" />
                            Auto-deducted on driver approval
                          </p>
                          <span className="text-xs font-bold"
                            style={{ color: selectedPart.available_quantity <= selectedPart.low_stock_threshold ? "#f97316" : "#34d399" }}>
                            {selectedPart.available_quantity} in stock
                          </span>
                        </div>
                      )}

                      {/* Stats row */}
                      {!inventoryLoading && !inventoryError && inventoryItems.length > 0 && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {inventoryItems.length} part{inventoryItems.length !== 1 ? "s" : ""} in warehouse
                          {inventoryItems.filter(i => !i.is_in_stock).length > 0 &&
                            <span style={{ color: "#ef4444" }}> · {inventoryItems.filter(i => !i.is_in_stock).length} out of stock</span>}
                        </p>
                      )}
                    </div>
                  );
                })()}



                {/* Spare part info hint */}
                {newItem.item_type === "PART" && newItem.spare_part_id && (() => {
                  const selected = inventoryItems.find(item => item.id.toString() === newItem.spare_part_id);
                  return (
                    <div className="space-y-1">
                      <p className="text-xs flex items-center gap-1.5" style={{ color: "#a78bfa" }}>
                        <Info className="w-3 h-3" />
                        Linked part will be auto-deducted from inventory when driver approves.
                      </p>
                      {selected && (
                        <p className="text-xs flex items-center gap-1" style={{ color: selected.available_quantity <= selected.low_stock_threshold ? "#f97316" : "#34d399" }}>
                          Live Stock: <span className="font-bold">{selected.available_quantity} units</span> available
                          {selected.available_quantity <= selected.low_stock_threshold && " ⚠️ Low Stock!"}
                          {!selected.is_in_stock && " 🚫 Out of Stock!"}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Local form error */}
                {localError && <ErrorBanner message={localError} code={quoteErrorCode} />}

                <button
                  onClick={handleAddItem}
                  disabled={addingItem}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  style={{
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    color: "#60a5fa",
                  }}>
                  {addingItem
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Plus className="w-4 h-4" /> Add Item</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Submitted ────────────────────────────────────────── */}
          {step === "submitted" && (
            <div className="text-center py-10 animate-scale-in">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  boxShadow: "0 0 40px rgba(16,185,129,0.25)",
                }}>
                <CheckCircle className="w-12 h-12" style={{ color: "#10b981" }} />
              </div>
              <h3 className="text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>{t("Recommendation Sent!")}</h3>
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                {t("The driver has been notified and is reviewing your recommendation.")}
              </p>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Recommendation #{quote?.id} · Status: SENT
              </p>

              {/* Summary */}
              {quote && quote.items.length > 0 && (
                <div className="mt-6 rounded-2xl p-4 text-left space-y-2"
                  style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                    {t("Recommendation Summary")}
                  </p>
                  {quote.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="truncate mr-2" style={{ color: "var(--text-secondary)" }}>
                        {item.quantity}× {item.description}
                      </span>
                      <span className="font-mono flex-shrink-0" style={{ color: "#60a5fa" }}>
                        {parseFloat(item.line_total).toLocaleString()} ETB
                      </span>
                    </div>
                  ))}
                  <div className="h-px mt-2" style={{ background: "var(--border-subtle)" }} />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("Total")}</span>
                    <span className="font-black text-base" style={{ color: "#10b981" }}>
                      {total.toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer: Submit button ─────────────────────────────────────────── */}
        {step === "items" && quote && (
          <div className="px-5 pb-6 pt-3 flex-shrink-0 space-y-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}>

            {/* Warn if no items yet */}
            {quote.items.length === 0 && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#fbbf24" }} />
                <p className="text-xs" style={{ color: "#fbbf24" }}>
                  {t("Add at least one item before sending the recommendation.")}
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || quote.items.length === 0}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                boxShadow: quote.items.length > 0 ? "0 4px 20px rgba(16,185,129,0.35)" : "none",
              }}>
              {submitting
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Send className="w-5 h-5" /> {t("Send Recommendation to Driver")}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
