"use client";
import { useState, useCallback } from "react";
import { useQuote, NewItemPayload, ItemType } from "../context/QuoteContext";
import { X, Plus, Trash2, Wrench, Package, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface QuoteModalProps {
  jobId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

const EMPTY_ITEM: Omit<NewItemPayload, "item_type"> & { item_type: ItemType } = {
  item_type: "PART",
  description: "",
  quantity: 1,
  unit_price: "",
};

export default function QuoteModal({ jobId, onClose, onSubmitted }: QuoteModalProps) {
  const { quote, quoteLoading, quoteError, createQuote, addItem, removeItem, submitQuote, clearQuote } = useQuote();
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"notes" | "items" | "submitted">("notes");
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });
  const [addingItem, setAddingItem] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateQuote = async () => {
    const q = await createQuote(jobId, notes);
    if (q) setStep("items");
    else showToast("error", quoteError || "Failed to create quote.");
  };

  const handleAddItem = useCallback(async () => {
    if (!quote) return;
    if (!newItem.description.trim()) { showToast("error", "Description is required."); return; }
    if (!newItem.unit_price || parseFloat(newItem.unit_price) <= 0) { showToast("error", "Enter a valid price."); return; }
    setAddingItem(true);
    const payload: NewItemPayload = {
      item_type: newItem.item_type,
      description: newItem.description.trim(),
      quantity: newItem.quantity,
      unit_price: parseFloat(newItem.unit_price).toFixed(2),
    };
    const result = await addItem(quote.id, payload);
    setAddingItem(false);
    if (result) {
      setNewItem({ ...EMPTY_ITEM });
      showToast("success", "Item added.");
    } else {
      showToast("error", "Failed to add item.");
    }
  }, [quote, newItem, addItem]);

  const handleRemoveItem = async (itemId: number) => {
    if (!quote) return;
    setRemovingId(itemId);
    await removeItem(quote.id, itemId);
    setRemovingId(null);
  };

  const handleSubmit = async () => {
    if (!quote) return;
    if (quote.items.length === 0) { showToast("error", "Add at least one item before submitting."); return; }
    setSubmitting(true);
    const result = await submitQuote(quote.id);
    setSubmitting(false);
    if (result.success) {
      setStep("submitted");
      setTimeout(() => { clearQuote(); onSubmitted(); }, 2000);
    } else {
      showToast("error", result.message || "Failed to submit quote.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-h-[90dvh] flex flex-col rounded-t-3xl animate-sheet-up overflow-hidden"
        style={{ background: "#111827", border: "1px solid rgba(148,163,184,0.1)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(148,163,184,0.3)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
          <div>
            <h3 className="text-lg font-black" style={{ color: "#f1f5f9" }}>
              {step === "notes" ? "Create Quote" : step === "items" ? "Add Line Items" : "Quote Sent!"}
            </h3>
            {quote && (
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                Quote #{quote.id} · {quote.status}
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(148,163,184,0.1)" }}>
            <X className="w-4 h-4" style={{ color: "#94a3b8" }} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-5 mt-3 flex-shrink-0 px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-up"
            style={{ background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            {toast.type === "success"
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />}
            <p className="text-sm font-medium" style={{ color: toast.type === "success" ? "#10b981" : "#f87171" }}>{toast.msg}</p>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Step: Notes */}
          {step === "notes" && (
            <div className="space-y-4 animate-scale-in">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>
                  Diagnostic Notes (optional)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Engine oil depleted. Full replacement needed."
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.15)", color: "#f1f5f9", caretColor: "#3b82f6" }}
                />
              </div>
              <button onClick={handleCreateQuote} disabled={quoteLoading}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
                {quoteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Quote</>}
              </button>
            </div>
          )}

          {/* Step: Items */}
          {step === "items" && quote && (
            <div className="space-y-5 animate-scale-in">
              {/* Total */}
              <div className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <span className="text-sm font-semibold" style={{ color: "#34d399" }}>Total Amount</span>
                <span className="text-2xl font-black" style={{ color: "#10b981" }}>
                  {parseFloat(quote.total_amount).toLocaleString()} ETB
                </span>
              </div>

              {/* Existing items */}
              {quote.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Items ({quote.items.length})</p>
                  {quote.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.08)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: item.item_type === "PART" ? "rgba(59,130,246,0.15)" : "rgba(249,115,22,0.15)" }}>
                        {item.item_type === "PART"
                          ? <Package className="w-4 h-4" style={{ color: "#3b82f6" }} />
                          : <Wrench className="w-4 h-4" style={{ color: "#f97316" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }}>{item.description}</p>
                        <p className="text-xs" style={{ color: "#475569" }}>
                          {item.quantity} × {parseFloat(item.unit_price).toLocaleString()} = {parseFloat(item.line_total).toLocaleString()} ETB
                        </p>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} disabled={removingId === item.id}
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

              {/* Add item form */}
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "rgba(20,28,46,0.9)", border: "1px solid rgba(148,163,184,0.1)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Add Item</p>

                {/* Type toggle */}
                <div className="flex gap-2">
                  {(["PART", "LABOR"] as ItemType[]).map(t => (
                    <button key={t} onClick={() => setNewItem(p => ({ ...p, item_type: t }))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: newItem.item_type === t ? (t === "PART" ? "rgba(59,130,246,0.2)" : "rgba(249,115,22,0.2)") : "rgba(255,255,255,0.04)",
                        border: `1px solid ${newItem.item_type === t ? (t === "PART" ? "rgba(59,130,246,0.4)" : "rgba(249,115,22,0.4)") : "rgba(148,163,184,0.1)"}`,
                        color: newItem.item_type === t ? (t === "PART" ? "#60a5fa" : "#fb923c") : "#64748b",
                      }}>
                      {t === "PART" ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                      {t}
                    </button>
                  ))}
                </div>

                <input placeholder="Description *"
                  value={newItem.description}
                  onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.12)", color: "#f1f5f9", caretColor: "#3b82f6" }} />

                <div className="flex gap-3">
                  <input type="number" placeholder="Qty" min={1}
                    value={newItem.quantity}
                    onChange={e => setNewItem(p => ({ ...p, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-20 px-3 py-3 rounded-xl text-sm text-center outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.12)", color: "#f1f5f9" }} />
                  <input type="number" placeholder="Unit price (ETB) *"
                    value={newItem.unit_price}
                    onChange={e => setNewItem(p => ({ ...p, unit_price: e.target.value }))}
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(148,163,184,0.12)", color: "#f1f5f9", caretColor: "#3b82f6" }} />
                </div>

                <button onClick={handleAddItem} disabled={addingItem}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
                  style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}>
                  {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Item</>}
                </button>
              </div>
            </div>
          )}

          {/* Step: Submitted */}
          {step === "submitted" && (
            <div className="text-center py-10 animate-scale-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(16,185,129,0.15)", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}>
                <CheckCircle className="w-10 h-10" style={{ color: "#10b981" }} />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: "#f1f5f9" }}>Quote Sent!</h3>
              <p className="text-sm" style={{ color: "#475569" }}>
                The driver has been notified and is reviewing your quote.
              </p>
            </div>
          )}
        </div>

        {/* Footer — Submit */}
        {step === "items" && quote && (
          <div className="px-5 pb-6 pt-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}>
            <button onClick={handleSubmit} disabled={submitting || quote.items.length === 0}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Quote to Driver</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
