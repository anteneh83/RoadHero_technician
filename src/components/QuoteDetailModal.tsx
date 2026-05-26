"use client";
import { useEffect, useState } from "react";
import { useQuote, Quote } from "../context/QuoteContext";
import { useLanguage } from "../context/LanguageContext";
import { X, FileText, Loader2, Package, Wrench, CheckCircle, AlertCircle } from "lucide-react";

interface QuoteDetailModalProps {
  jobId: number;
  onClose: () => void;
}

export default function QuoteDetailModal({ jobId, onClose }: QuoteDetailModalProps) {
  const { fetchQuoteByJob, quoteLoading, quoteError } = useQuote();
  const { t } = useLanguage();
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuoteByJob(jobId).then(q => {
      if (q) setQuote(q);
    });
  }, [jobId, fetchQuoteByJob]);

  const total = quote ? parseFloat(quote.total_amount) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-h-[90dvh] flex flex-col rounded-t-3xl animate-sheet-up overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h3 className="text-lg font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <FileText className="w-5 h-5 text-blue-500" /> {t("Recommendation Detail")}
            </h3>
            {quote && (
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                Recommendation #{quote.id} · <span className={
                  quote.status === "APPROVED" ? "text-emerald-400" :
                  quote.status === "REJECTED" ? "text-red-400" :
                  quote.status === "SENT" ? "text-amber-400" : "text-blue-400"
                }>{quote.status}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90" style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {quoteLoading && !quote ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm font-medium">{t("Fetching recommendation...")}</p>
            </div>
          ) : quoteError && !quote ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-red-400 font-medium">{quoteError}</p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{t("The recommendation may not have been created yet or there was a network error.")}</p>
            </div>
          ) : quote ? (
            <div className="space-y-5 animate-scale-in">
              {/* Status Banner */}
              {quote.status === "APPROVED" && (
                <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{t("Driver Approved")}</p>
                    <p className="text-xs text-emerald-500/80 mt-0.5">{t("The driver accepted this recommendation. Proceed with the repair.")}</p>
                  </div>
                </div>
              )}
              {quote.status === "REJECTED" && (
                <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-400">{t("Driver Rejected")}</p>
                    {quote.rejection_reason && (
                      <p className="text-xs text-red-400/80 mt-1 italic">"{quote.rejection_reason}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Total Banner */}
              <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)" }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{t("Total Amount")}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{quote.items.length} items</p>
                </div>
                <span className="text-3xl font-black" style={{ color: "var(--accent-green)" }}>
                  {total.toLocaleString("en-ET", { minimumFractionDigits: 2 })} ETB
                </span>
              </div>

              {/* Notes */}
              {quote.notes && (
                <div className="rounded-xl p-4" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{t("Diagnostic Notes")}</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{quote.notes}</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{t("Line Items")}</p>
                {quote.items.length === 0 ? (
                  <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>{t("No items attached.")}</p>
                ) : (
                  quote.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)" }}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ background: item.item_type === 'PART' ? "rgba(59,130,246,0.15)" : "rgba(249,115,22,0.15)" }}>
                        {item.item_type === 'PART' ? <Package className="w-5 h-5" style={{ color: "var(--accent-blue-light)" }} /> : <Wrench className="w-5 h-5" style={{ color: "var(--accent-orange)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {item.quantity} × {parseFloat(item.unit_price).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono" style={{ color: "var(--accent-blue-light)" }}>{parseFloat(item.line_total).toLocaleString()} ETB</p>
                        {item.spare_part_id && (
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--accent-purple)" }}>Part #{item.spare_part_id}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
