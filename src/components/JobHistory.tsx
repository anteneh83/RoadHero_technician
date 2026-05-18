"use client";
import { useEffect } from "react";
import { useJobs, Job } from "../context/JobsContext";
import {
  Clock, CheckCircle, XCircle, Car, User,
  RefreshCw, ChevronDown, Loader2, FileText, DollarSign,
} from "lucide-react";

function HistoryCard({ job, delay }: { job: Job; delay: number }) {
  const isCompleted = job.status === "COMPLETED";
  const isCancelled = job.status === "CANCELLED";

  const completedDate = job.completed_at
    ? new Date(job.completed_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : null;
  const completedTime = job.completed_at
    ? new Date(job.completed_at).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const hasAmount = job.final_price != null && parseFloat(job.final_price) > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden animate-slide-up"
      style={{
        background: "rgba(20,28,46,0.92)",
        border: `1px solid ${isCompleted ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.08)"}`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Top strip */}
      <div
        className="h-1 w-full"
        style={{
          background: isCompleted
            ? "linear-gradient(90deg, #10b981, #059669)"
            : isCancelled
            ? "rgba(239,68,68,0.5)"
            : "rgba(148,163,184,0.15)",
        }}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base font-bold truncate" style={{ color: "#f1f5f9" }}>
                {job.service_type || "Service"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                  isCompleted ? "status-completed" : isCancelled ? "status-cancelled" : ""
                }`}
              >
                {job.status}
              </span>
            </div>

            {/* Driver */}
            <p className="flex items-center gap-1.5 text-sm" style={{ color: "#64748b" }}>
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.driver?.name || "—"}</span>
            </p>
          </div>

          {/* Right: price + date */}
          <div className="text-right flex-shrink-0">
            {hasAmount ? (
              <p className="text-lg font-black" style={{ color: "#10b981" }}>
                {parseFloat(job.final_price!).toLocaleString()}
                <span className="text-xs font-medium ml-0.5">ETB</span>
              </p>
            ) : (
              <p className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{ background: "rgba(148,163,184,0.08)", color: "#475569" }}>
                No charge
              </p>
            )}
            {completedDate && (
              <p className="text-xs font-semibold mt-1" style={{ color: "#475569" }}>
                {completedDate}
              </p>
            )}
            {completedTime && (
              <p className="text-xs" style={{ color: "#334155" }}>{completedTime}</p>
            )}
          </div>
        </div>

        {/* Vehicle */}
        {job.vehicle && (job.vehicle.make || job.vehicle.model) && (
          <p className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "#475569" }}>
            <Car className="w-3.5 h-3.5 flex-shrink-0" />
            {[job.vehicle.year, job.vehicle.make, job.vehicle.model].filter(Boolean).join(" ")}
            {job.vehicle.plate && (
              <span className="ml-1 px-1.5 py-0.5 rounded font-mono"
                style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                {job.vehicle.plate}
              </span>
            )}
          </p>
        )}

        {/* Description */}
        {job.description && (
          <div
            className="rounded-xl px-3 py-2 mt-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.07)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#334155" }}>
              <FileText className="w-3 h-3 inline mr-1" />Description
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
              {job.description}
            </p>
          </div>
        )}

        {/* Job ID */}
        <p className="text-xs mt-2 font-mono" style={{ color: "#1e293b" }}>
          Job #{job.id}
        </p>
      </div>
    </div>
  );
}

export default function JobHistory() {
  const {
    history, historyCount, historyNextPage,
    historyLoading, historyError,
    fetchHistory, loadMoreHistory,
  } = useJobs();

  useEffect(() => {
    fetchHistory(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full pb-8">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{
          background: "rgba(10,15,30,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(148,163,184,0.06)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black" style={{ color: "#f1f5f9" }}>Job History</h2>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              {historyCount > 0
                ? `${historyCount} completed job${historyCount !== 1 ? "s" : ""}`
                : "Past completed & cancelled jobs"}
            </p>
          </div>
          <button
            onClick={() => fetchHistory(1)}
            disabled={historyLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}
          >
            <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Summary stats */}
        {historyCount > 0 && (
          <div className="flex gap-3 mt-3">
            <div
              className="flex-1 rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
              <div>
                <p className="text-xs font-black" style={{ color: "#10b981" }}>{historyCount}</p>
                <p className="text-xs" style={{ color: "#334155" }}>Completed</p>
              </div>
            </div>
            <div
              className="flex-1 rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.12)" }}
            >
              <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
              <div>
                <p className="text-xs font-black" style={{ color: "#60a5fa" }}>
                  {history
                    .filter(j => j.final_price && parseFloat(j.final_price) > 0)
                    .reduce((s, j) => s + parseFloat(j.final_price!), 0)
                    .toLocaleString()} ETB
                </p>
                <p className="text-xs" style={{ color: "#334155" }}>Total Earned</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Error */}
        {historyError && (
          <div
            className="rounded-2xl p-5 text-center animate-scale-in"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#f87171" }} />
            <p className="text-sm font-semibold mb-4" style={{ color: "#f87171" }}>{historyError}</p>
            <button
              onClick={() => fetchHistory(1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Skeletons */}
        {historyLoading && history.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!historyLoading && !historyError && history.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(16,185,129,0.1)" }}
            >
              <Clock className="w-10 h-10" style={{ color: "#10b981" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f1f5f9" }}>No history yet</h3>
            <p className="text-sm" style={{ color: "#475569" }}>
              Completed jobs will appear here.
            </p>
          </div>
        )}

        {/* History cards */}
        {history.map((job, i) => (
          <HistoryCard key={job.id} job={job} delay={i * 0.04} />
        ))}

        {/* Load more */}
        {historyNextPage && !historyLoading && (
          <button
            onClick={loadMoreHistory}
            className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
              color: "#3b82f6",
            }}
          >
            <ChevronDown className="w-4 h-4" /> Load More
          </button>
        )}

        {/* Loading more spinner */}
        {historyLoading && history.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3b82f6" }} />
          </div>
        )}

        {/* End of list */}
        {!historyNextPage && history.length > 0 && !historyLoading && (
          <p className="text-center text-xs py-4" style={{ color: "#1e293b" }}>
            — End of history —
          </p>
        )}
      </div>
    </div>
  );
}
