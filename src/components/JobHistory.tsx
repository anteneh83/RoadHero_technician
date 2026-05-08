"use client";
import { useEffect } from "react";
import { useJobs, Job } from "../context/JobsContext";
import { Clock, CheckCircle, XCircle, Car, User, MapPin, RefreshCw, ChevronDown, Loader2 } from "lucide-react";

function HistoryCard({ job, delay }: { job: Job; delay: number }) {
  const isCompleted = job.status === "COMPLETED";
  const date = job.completed_at
    ? new Date(job.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const time = job.completed_at
    ? new Date(job.completed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="rounded-2xl p-4 animate-slide-up"
      style={{ background: "rgba(20,28,46,0.9)", border: "1px solid rgba(148,163,184,0.08)", animationDelay: `${delay}s` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-base font-bold" style={{ color: "#f1f5f9" }}>{job.service_type}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${isCompleted ? "status-completed" : "status-cancelled"}`}>
              {job.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.driver?.name || "—"}</span>
            </p>
            <p className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
              <Car className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.vehicle?.make} {job.vehicle?.model}</span>
            </p>
            <p className="flex items-center gap-2 text-sm" style={{ color: "#64748b" }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.incident_location?.address || "—"}</span>
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {job.final_price && (
            <p className="text-lg font-black" style={{ color: "#10b981" }}>
              {parseFloat(job.final_price).toLocaleString()} <span className="text-xs font-medium">ETB</span>
            </p>
          )}
          <p className="text-xs font-semibold mt-1" style={{ color: "#475569" }}>{date}</p>
          {time && <p className="text-xs" style={{ color: "#334155" }}>{time}</p>}
        </div>
      </div>
    </div>
  );
}

export default function JobHistory() {
  const { history, historyCount, historyNextPage, historyLoading, historyError, fetchHistory, loadMoreHistory } = useJobs();

  useEffect(() => {
    if (history.length === 0 && !historyLoading) fetchHistory(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full pb-8">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black" style={{ color: "#f1f5f9" }}>Job History</h2>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              {historyCount > 0 ? `${historyCount} total jobs` : "Past completed & cancelled jobs"}
            </p>
          </div>
          <button onClick={() => fetchHistory(1)} disabled={historyLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
            <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {historyError && (
          <div className="rounded-2xl p-5 text-center animate-scale-in"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#f87171" }} />
            <p className="text-sm font-semibold mb-4" style={{ color: "#f87171" }}>{historyError}</p>
            <button onClick={() => fetchHistory(1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
              Try Again
            </button>
          </div>
        )}

        {historyLoading && history.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        )}

        {!historyLoading && !historyError && history.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(16,185,129,0.1)" }}>
              <CheckCircle className="w-10 h-10" style={{ color: "#10b981" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f1f5f9" }}>No history yet</h3>
            <p className="text-sm" style={{ color: "#475569" }}>Completed jobs will appear here.</p>
          </div>
        )}

        {history.map((job, i) => (
          <HistoryCard key={job.id} job={job} delay={i * 0.04} />
        ))}

        {historyNextPage && !historyLoading && (
          <button onClick={loadMoreHistory}
            className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", color: "#3b82f6" }}>
            <ChevronDown className="w-4 h-4" /> Load more
          </button>
        )}

        {historyLoading && history.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3b82f6" }} />
          </div>
        )}

        {!historyNextPage && history.length > 0 && !historyLoading && (
          <p className="text-center text-xs py-4" style={{ color: "#1e293b" }}>— End of history —</p>
        )}
      </div>
    </div>
  );
}
