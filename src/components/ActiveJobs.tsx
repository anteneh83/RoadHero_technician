"use client";
import { useState, useCallback } from "react";
import { useJobs, Job, JobStatus } from "../context/JobsContext";
import {
  MapPin, Car, Phone, RefreshCw, Briefcase, Wrench,
  DollarSign, CheckCircle, Clock, Loader2, Calendar,
  FileText, Building2, Navigation, AlertTriangle, Timer,
} from "lucide-react";
import QuoteModal from "./QuoteModal";
import QuoteDetailModal from "./QuoteDetailModal";
import JobMap from "./JobMap";
import { useLanguage } from "../context/LanguageContext";

// ─── Status filter tabs ───────────────────────────────────────────────────────
const STATUS_FILTERS: { label: string; value: JobStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "En Route", value: "EN_ROUTE" },
  { label: "Arrived", value: "ARRIVED" },
  { label: "Diagnosing", value: "DIAGNOSING" },
  { label: "Quote Pending", value: "QUOTE_PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
];

// ─── Status chip metadata ─────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType; pulse?: boolean }> = {
  ACCEPTED: { label: "Accepted", cls: "status-diagnosing", icon: Clock, pulse: true },
  EN_ROUTE: { label: "En Route", cls: "status-arrived", icon: Navigation, pulse: true },
  ARRIVED: { label: "Arrived", cls: "status-arrived", icon: MapPin, pulse: true },
  DIAGNOSING: { label: "Diagnosing", cls: "status-diagnosing", icon: Wrench, pulse: true },
  QUOTE_PENDING: { label: "Quote Pending", cls: "status-quote-pending", icon: DollarSign },
  QUOTE_ACCEPTED: { label: "Quote Accepted", cls: "status-quote-accept", icon: CheckCircle },
  IN_PROGRESS: { label: "In Progress", cls: "status-in-progress", icon: Timer, pulse: true },
  COMPLETED: { label: "Completed", cls: "status-completed", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", cls: "", icon: AlertTriangle },
};

// ─── Status transitions (matches backend exactly) ─────────────────────────────
const NEXT_ACTIONS: Partial<Record<JobStatus, { label: string; next: JobStatus; color: string }[]>> = {
  ACCEPTED: [{ label: "I'm On My Way", next: "EN_ROUTE", color: "#06b6d4" }],
  EN_ROUTE: [{ label: "I've Arrived", next: "ARRIVED", color: "#3b82f6" }],
  ARRIVED: [{ label: "Start Work", next: "IN_PROGRESS", color: "#8b5cf6" }],
  QUOTE_ACCEPTED: [{ label: "Start Work", next: "IN_PROGRESS", color: "#8b5cf6" }],
  IN_PROGRESS: [{ label: "Complete Job ✓", next: "COMPLETED", color: "#10b981" }],
};

// ─── StatusChip ──────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const { t } = useLanguage();
  const meta = STATUS_META[status] || { label: status, cls: "", icon: Clock };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
      {meta.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      <Icon className="w-3 h-3" />
      {t(meta.label as any)}
    </span>
  );
}

// ─── Open navigation helper ───────────────────────────────────────────────────
function openNavigation(lat?: number, lng?: number, address?: string) {
  if (lat && lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  } else if (address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  }
}

// ─── JobCard ──────────────────────────────────────────────────────────────────
function JobCard({ job, onQuote, onViewQuote }: { job: Job; onQuote: (jobId: number) => void; onViewQuote: (jobId: number) => void }) {
  const { updateJobStatus, fetchJobs } = useJobs();
  const { t, language } = useLanguage();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const actions = NEXT_ACTIONS[job.status] ?? [];
  // Quote button shows when job is in ARRIVED or DIAGNOSING state
  const showQuoteBtn = job.status === "ARRIVED" || job.status === "DIAGNOSING";
  const hasLocation = !!(job.incident_location?.lat || job.incident_location?.address);

  const handleAction = useCallback(async (next: JobStatus, label: string) => {
    // Require confirmation before completing a job
    if (next === "COMPLETED" && !confirmComplete) {
      setConfirmComplete(true);
      return;
    }
    setConfirmComplete(false);
    setActionLoading(label);
    const result = await updateJobStatus(job.id, next);
    setActionLoading(null);
    if (result.success) {
      const msg = next === "EN_ROUTE"
        ? t("Status updated — you're now En Route 🚗")
        : next === "ARRIVED"
          ? t("Marked as Arrived ✓")
          : next === "IN_PROGRESS"
            ? t("Work started ⚙️")
            : next === "COMPLETED"
              ? t("Job completed! 🎉")
              : `${t("Status →")} ${next.replace(/_/g, " ")}`;
      setToast({ ok: true, msg });
      await fetchJobs();
    } else {
      setToast({ ok: false, msg: result.message ? t(result.message as any) : t("Failed to update status.") });
    }
    setTimeout(() => setToast(null), 4000);
  }, [job.id, updateJobStatus, fetchJobs, confirmComplete, t]);

  const handleNavigate = () => {
    if (job.incident_location?.lat == null && !job.incident_location?.address) {
      setToast({ ok: false, msg: t("No location provided for this job.") });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    // If still ACCEPTED, mark as EN_ROUTE when opening navigation
    if (job.status === "ACCEPTED") {
      handleAction("EN_ROUTE", "I'm On My Way");
    }
    openNavigation(job.incident_location?.lat, job.incident_location?.lng, job.incident_location?.address);
  };

  return (
    <div className="rounded-2xl overflow-hidden animate-slide-up"
      style={{ background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>

      {/* Card header — always visible */}
      <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-base font-black truncate" style={{ color: "var(--text-primary)" }}>
                {job.service_type ? t(job.service_type as any) : t("Service Request")}
              </span>
              <StatusChip status={job.status} />
              {job.is_scheduled && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                  📅 {t("Scheduled")}
                </span>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{job.driver?.name || "—"}</span>
              {job.eta_minutes != null && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(6,182,212,0.1)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.2)" }}>
                  {t("ETA")} {job.eta_minutes} {t("min")}
                </span>
              )}
            </p>
          </div>
          <span className="text-lg flex-shrink-0" style={{ color: "var(--text-muted)" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="h-px" style={{ background: "var(--border-subtle)" }} />

          {/* Info rows */}
          <div className="space-y-2">

            {job.provider_name && (
              <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-purple)" }} />
                <span style={{ color: "var(--text-primary)" }}>{job.provider_name}</span>
              </p>
            )}

            {job.driver?.phone && (
              <a href={`tel:${job.driver.phone}`}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#3b82f6" }}>
                <Phone className="w-4 h-4 flex-shrink-0" />
                {job.driver.phone}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {t("Tap to call")}</span>
              </a>
            )}

            {job.incident_location?.address && (
              <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#f97316" }} />
                {job.incident_location.address}
              </p>
            )}

            {job.incident_location?.lat != null && job.incident_location?.lng != null && (
              <JobMap
                lat={job.incident_location.lat}
                lng={job.incident_location.lng}
                address={job.incident_location.address}
              />
            )}

            {job.vehicle && (
              <p className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Car className="w-4 h-4 flex-shrink-0" style={{ color: "#3b82f6" }} />
                {[job.vehicle.year, job.vehicle.make, job.vehicle.model].filter(Boolean).join(" ") || "—"}
                {job.vehicle.plate && (
                  <span className="ml-1 px-2 py-0.5 rounded text-xs font-mono"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                    {job.vehicle.plate}
                  </span>
                )}
              </p>
            )}

            {job.scheduled_time && (
              <p className="flex items-center gap-2 text-xs" style={{ color: "#a78bfa" }}>
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {t("Scheduled")}: {new Date(job.scheduled_time).toLocaleString(language === "am" ? "am-ET" : "en-US")}
              </p>
            )}

            {job.accepted_at && (
              <p className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {t("Accepted")}: {new Date(job.accepted_at).toLocaleString(language === "am" ? "am-ET" : "en-US")}
              </p>
            )}

            {job.created_at && (
              <p className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {t("Created")}: {new Date(job.created_at).toLocaleString(language === "am" ? "am-ET" : "en-US")}
              </p>
            )}
          </div>

          {/* Description / spare parts */}
          {job.description && (() => {
            const parts = job.description.split("--- Requested Spare Parts ---");
            const notes = parts[0]?.trim();
            const spareParts = parts[1]?.trim();
            return (
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-subtle)" }}>
                {notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                      <FileText className="w-3 h-3 inline mr-1" />{t("Problem Description")}
                    </p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{notes}</p>
                  </div>
                )}
                {spareParts && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                      <Wrench className="w-3 h-3 inline mr-1" />{t("Requested Spare Parts")}
                    </p>
                    <p className="text-sm whitespace-pre-wrap font-mono" style={{ color: "#fbbf24" }}>{spareParts}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Navigate button — shows when there's a location */}
          {hasLocation && (job.status === "ACCEPTED" || job.status === "EN_ROUTE") && (
            <button onClick={handleNavigate}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
              style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}>
              <Navigation className="w-4 h-4" />
              {job.status === "ACCEPTED" ? t("Navigate & Mark En Route") : t("Open Navigation")}
            </button>
          )}

          {/* Status update hints */}
          {job.status === "QUOTE_PENDING" && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
              ⏳ {t("Waiting for driver to approve your estimate.")}
            </div>
          )}

          {/* View Quote button */}
          {(job.status === "QUOTE_PENDING" || job.status === "QUOTE_ACCEPTED" || job.status === "IN_PROGRESS" || job.status === "COMPLETED") && (
            <button onClick={() => onViewQuote(job.id)}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
              <FileText className="w-4 h-4" /> {t("View Sent Recommendation")}
            </button>
          )}

          {/* Toast */}
          {toast && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: toast.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${toast.ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                color: toast.ok ? "#34d399" : "#f87171",
              }}>
              {toast.msg}
            </div>
          )}

          {/* Complete confirmation prompt */}
          {confirmComplete && (
            <div className="rounded-xl px-4 py-3 space-y-3"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <p className="text-sm font-semibold" style={{ color: "#34d399" }}>
                ✅ {t("Confirm job completion?")}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("This will notify the driver and cannot be undone.")}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmComplete(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "var(--border-subtle)", color: "var(--text-muted)" }}>
                  {t("Cancel")}
                </button>
                <button onClick={() => handleAction("COMPLETED", "Complete Job ✓")}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                  style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("Yes, Complete")}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!confirmComplete && actions.map(a => (
            <button key={a.label} onClick={() => handleAction(a.next, a.label)}
              disabled={!!actionLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              style={{
                background: `${a.color}22`, border: `1px solid ${a.color}44`, color: a.color
              }}>
              {actionLoading === a.label ? <Loader2 className="w-4 h-4 animate-spin" /> : t(a.label as any)}
            </button>
          ))}

          {/* Create Quote button */}
          {showQuoteBtn && (
            <button onClick={() => onQuote(job.id)}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
              }}>
              <DollarSign className="w-4 h-4" /> {t("Create & Send Spare Part Recommendation")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ActiveJobs (main view) ───────────────────────────────────────────────────
export default function ActiveJobs() {
  const { jobs, loading, fetchJobs, updateJobStatus } = useJobs();
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<JobStatus | "ALL">("ALL");
  const [quoteJobId, setQuoteJobId] = useState<number | null>(null);
  const [viewQuoteJobId, setViewQuoteJobId] = useState<number | null>(null);

  const filtered = filter === "ALL" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="min-h-full pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{t("Active Jobs")}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {language === "en" ? `${jobs.length} job${jobs.length !== 1 ? "s" : ""} assigned` : `${jobs.length} ስራ ተመድቧል`}
              <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>· {t("auto-refreshes every 30s")}</span>
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
                background: filter === f.value ? "rgba(59,130,246,0.25)" : "var(--bg-card-hover)",
                border: `1px solid ${filter === f.value ? "rgba(59,130,246,0.5)" : "var(--border-subtle)"}`,
                color: filter === f.value ? "#60a5fa" : "var(--text-muted)",
              }}>
              {t(f.label as any)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Loading skeletons */}
        {loading && jobs.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(59,130,246,0.1)" }}>
              <Briefcase className="w-10 h-10" style={{ color: "#3b82f6" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {filter === "ALL" ? t("No active jobs") : `${t("No jobs")} (${t(STATUS_META[filter]?.label as any)})`}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {filter === "ALL"
                ? t("Waiting for assignment… refreshing every 30s.")
                : t("Try a different filter.")}
            </p>
          </div>
        )}

        {/* Job cards */}
        {filtered.map((job, i) => (
          <div key={job.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <JobCard job={job} onQuote={setQuoteJobId} onViewQuote={setViewQuoteJobId} />
          </div>
        ))}
      </div>

      {/* Quote creation modal */}
      {quoteJobId !== null && (
        <QuoteModal
          jobId={quoteJobId}
          onClose={() => setQuoteJobId(null)}
          onSubmitted={() => { setQuoteJobId(null); fetchJobs(); }}
        />
      )}

      {/* Quote detail modal */}
      {viewQuoteJobId !== null && (
        <QuoteDetailModal
          jobId={viewQuoteJobId}
          onClose={() => setViewQuoteJobId(null)}
        />
      )}
    </div>
  );
}
