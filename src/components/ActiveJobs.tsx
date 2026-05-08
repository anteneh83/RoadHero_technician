"use client";
import { useState, useCallback } from "react";
import { useJobs, Job, JobStatus } from "../context/JobsContext";
import { MapPin, Car, User, Phone, RefreshCw, Briefcase, Wrench, DollarSign, Play, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import QuoteModal from "./QuoteModal";

const STATUS_FILTERS: { label: string; value: JobStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Arrived", value: "ARRIVED" },
  { label: "Diagnosing", value: "DIAGNOSING" },
  { label: "Quote Pending", value: "QUOTE_PENDING" },
  { label: "Quote Accepted", value: "QUOTE_ACCEPTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
];

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType; pulse?: boolean }> = {
  ARRIVED:       { label: "Arrived",        cls: "status-arrived",       icon: MapPin,       pulse: true },
  DIAGNOSING:    { label: "Diagnosing",      cls: "status-diagnosing",    icon: Wrench,       pulse: true },
  QUOTE_PENDING: { label: "Quote Pending",   cls: "status-quote-pending", icon: DollarSign },
  QUOTE_ACCEPTED:{ label: "Quote Accepted",  cls: "status-quote-accept",  icon: CheckCircle },
  IN_PROGRESS:   { label: "In Progress",     cls: "status-in-progress",   icon: Play,         pulse: true },
  ACCEPTED:      { label: "Accepted",        cls: "status-diagnosing",    icon: Clock },
  EN_ROUTE:      { label: "En Route",        cls: "status-diagnosing",    icon: MapPin },
  COMPLETED:     { label: "Completed",       cls: "status-completed",     icon: CheckCircle },
};

const NEXT_ACTIONS: Partial<Record<JobStatus, { label: string; next: JobStatus; color: string }[]>> = {
  ARRIVED:        [{ label: "Start Diagnosing", next: "DIAGNOSING",  color: "#3b82f6" }, { label: "Start Work",  next: "IN_PROGRESS", color: "#8b5cf6" }],
  QUOTE_ACCEPTED: [{ label: "Start Work",       next: "IN_PROGRESS", color: "#8b5cf6" }],
  IN_PROGRESS:    [{ label: "Complete Job",     next: "COMPLETED",   color: "#10b981" }],
};

function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, cls: "", icon: Clock };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
      {meta.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function JobCard({ job, onQuote }: { job: Job; onQuote: (jobId: number) => void }) {
  const { updateJobStatus, fetchJobs } = useJobs();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const actions = NEXT_ACTIONS[job.status] ?? [];
  const showQuoteBtn = job.status === "DIAGNOSING";

  const handleAction = useCallback(async (next: JobStatus, label: string) => {
    setActionLoading(label);
    const result = await updateJobStatus(job.id, next);
    setActionLoading(null);
    if (result.success) {
      setToast({ ok: true, msg: `Status → ${next.replace(/_/g, " ")}` });
      await fetchJobs();
    } else {
      setToast({ ok: false, msg: result.message || "Failed." });
    }
    setTimeout(() => setToast(null), 3000);
  }, [job.id, updateJobStatus, fetchJobs]);

  return (
    <div className="rounded-2xl overflow-hidden animate-slide-up"
      style={{ background: "rgba(20,28,46,0.95)", border: "1px solid rgba(148,163,184,0.1)" }}>
      {/* Card header */}
      <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-base font-black truncate" style={{ color: "#f1f5f9" }}>{job.service_type}</span>
              <StatusChip status={job.status} />
            </div>
            <p className="flex items-center gap-1.5 text-sm" style={{ color: "#64748b" }}>
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              {job.driver?.name || "—"}
            </p>
          </div>
          <span className="text-lg" style={{ color: "#334155" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="h-px" style={{ background: "rgba(148,163,184,0.08)" }} />

          {/* Vehicle & location */}
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
              <Car className="w-4 h-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
              {job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model}
              {job.vehicle?.plate && <span className="ml-1 px-2 py-0.5 rounded text-xs font-mono"
                style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>{job.vehicle.plate}</span>}
            </p>
            <p className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#f97316" }} />
              {job.incident_location?.address || "—"}
            </p>
            {job.driver?.phone && (
              <a href={`tel:${job.driver.phone}`}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#3b82f6" }}>
                <Phone className="w-4 h-4 flex-shrink-0" />
                {job.driver.phone}
              </a>
            )}
          </div>

          {/* Status hint */}
          {job.status === "QUOTE_PENDING" && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
              ⏳ Waiting for driver to approve your quote.
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: toast.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${toast.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, color: toast.ok ? "#34d399" : "#f87171" }}>
              {toast.msg}
            </div>
          )}

          {/* Action buttons */}
          {actions.map(a => (
            <button key={a.label} onClick={() => handleAction(a.next, a.label)}
              disabled={!!actionLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              style={{ background: `${a.color}22`, border: `1px solid ${a.color}44`, color: a.color }}>
              {actionLoading === a.label ? <Loader2 className="w-4 h-4 animate-spin" /> : a.label}
            </button>
          ))}

          {showQuoteBtn && (
            <button onClick={() => onQuote(job.id)}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
              <DollarSign className="w-4 h-4" /> Create & Send Quote
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActiveJobs() {
  const { jobs, loading, fetchJobs } = useJobs();
  const [filter, setFilter] = useState<JobStatus | "ALL">("ALL");
  const [quoteJobId, setQuoteJobId] = useState<number | null>(null);

  const filtered = filter === "ALL" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="min-h-full pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-black" style={{ color: "#f1f5f9" }}>Active Jobs</h2>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} assigned
            </p>
          </div>
          <button onClick={fetchJobs} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filter === f.value ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${filter === f.value ? "rgba(59,130,246,0.5)" : "rgba(148,163,184,0.1)"}`,
                color: filter === f.value ? "#60a5fa" : "#64748b",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && jobs.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(59,130,246,0.1)" }}>
              <Briefcase className="w-10 h-10" style={{ color: "#3b82f6" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#f1f5f9" }}>
              {filter === "ALL" ? "No active jobs" : `No ${filter.replace(/_/g, " ")} jobs`}
            </h3>
            <p className="text-sm" style={{ color: "#475569" }}>
              {filter === "ALL" ? "New jobs will appear here when assigned." : "Try a different filter."}
            </p>
          </div>
        )}

        {filtered.map((job, i) => (
          <div key={job.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <JobCard job={job} onQuote={setQuoteJobId} />
          </div>
        ))}
      </div>

      {quoteJobId !== null && (
        <QuoteModal
          jobId={quoteJobId}
          onClose={() => setQuoteJobId(null)}
          onSubmitted={() => { setQuoteJobId(null); fetchJobs(); }}
        />
      )}
    </div>
  );
}
