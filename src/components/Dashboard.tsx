"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useJobs } from "../context/JobsContext";
import { Job, JobStatus } from "../context/JobsContext";
import {
  MapPin,
  Car,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  DollarSign,
  LogOut,
  Wrench,
  Briefcase,
  History,
  Loader2,
  RefreshCw,
  Star
} from "lucide-react";

function JobCard({ job }: { job: Job }) {
  const { updateJobStatus } = useJobs();

  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case "ACCEPTED":
        return {
          color: "text-sky-700 bg-sky-100 dark:bg-sky-900/20",
          icon: Clock,
          bgColor: "bg-sky-50 dark:bg-sky-900/10"
        };
      case "EN_ROUTE":
        return {
          color: "text-teal-700 bg-teal-100 dark:bg-teal-900/20",
          icon: MapPin,
          bgColor: "bg-teal-50 dark:bg-teal-900/10"
        };
      case "ARRIVED":
        return {
          color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
          icon: AlertCircle,
          bgColor: "bg-orange-50 dark:bg-orange-900/10"
        };
      case "DIAGNOSING":
        return {
          color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
          icon: Wrench,
          bgColor: "bg-blue-50 dark:bg-blue-900/10"
        };
      case "QUOTE_PENDING":
        return {
          color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
          icon: DollarSign,
          bgColor: "bg-yellow-50 dark:bg-yellow-900/10"
        };
      case "QUOTE_ACCEPTED":
        return {
          color: "text-green-600 bg-green-100 dark:bg-green-900/20",
          icon: CheckCircle,
          bgColor: "bg-green-50 dark:bg-green-900/10"
        };
      case "IN_PROGRESS":
        return {
          color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
          icon: Play,
          bgColor: "bg-purple-50 dark:bg-purple-900/10"
        };
      case "COMPLETED":
        return {
          color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
          icon: CheckCircle,
          bgColor: "bg-emerald-50 dark:bg-emerald-900/10"
        };
      default:
        return {
          color: "text-gray-600 bg-gray-100 dark:bg-gray-900/20",
          icon: Clock,
          bgColor: "bg-gray-50 dark:bg-gray-900/10"
        };
    }
  };

  const getNextAction = (status: JobStatus) => {
    switch (status) {
      case "ACCEPTED":
        return {
          label: "Mark En Route",
          nextStatus: "EN_ROUTE" as JobStatus,
          color: "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700",
          icon: MapPin
        };
      case "EN_ROUTE":
        return {
          label: "Mark Arrived",
          nextStatus: "ARRIVED" as JobStatus,
          color: "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
          icon: MapPin
        };
      case "ARRIVED":
        return {
          label: "Start Diagnosing",
          nextStatus: "DIAGNOSING" as JobStatus,
          color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
          icon: Wrench
        };
      case "DIAGNOSING":
        return {
          label: "Send Quote",
          nextStatus: "QUOTE_PENDING" as JobStatus,
          color: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
          icon: DollarSign
        };
      case "QUOTE_ACCEPTED":
        return {
          label: "Start Work",
          nextStatus: "IN_PROGRESS" as JobStatus,
          color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
          icon: Play
        };
      case "IN_PROGRESS":
        return {
          label: "Complete Job",
          nextStatus: "COMPLETED" as JobStatus,
          color: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
          icon: CheckCircle
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig(job.status);
  const StatusIcon = statusConfig.icon;
  const action = getNextAction(job.status);

  const handleAction = async () => {
    if (action) {
      await updateJobStatus(job.id, action.nextStatus);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Car className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {job.service_type}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <User className="w-4 h-4 mr-1" />
                {job.driver.name}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center">
              <Car className="w-4 h-4 mr-2" />
              {job.vehicle.make} {job.vehicle.model}
            </p>
            <p className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {job.incident_location.address}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-semibold ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{job.status.replace("_", " ")}</span>
          </div>
          {job.final_price && (
            <div className="flex items-center space-x-1 text-lg font-bold text-green-600">
              <DollarSign className="w-4 h-4" />
              <span>{job.final_price} ETB</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {job.status === "ACCEPTED" && (
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-700">
            Job assigned. Tap the button below when you start heading to the driver.
          </div>
        )}
        {job.status === "EN_ROUTE" && (
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-700">
            You are en route. Update the status once you arrive at the vehicle.
          </div>
        )}
        {job.status === "QUOTE_PENDING" && (
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-3 text-sm text-yellow-700">
            Quote submitted. Waiting for driver approval before work can begin.
          </div>
        )}
        {job.status === "QUOTE_ACCEPTED" && (
          <div className="rounded-2xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            Quote approved. You can now begin repair work.
          </div>
        )}
      </div>

      {action && (
        <button
          onClick={handleAction}
          className={`w-full ${action.color} text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2`}
        >
          <action.icon className="w-5 h-5" />
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}

function HistoryCard({ job }: { job: Job }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {job.service_type}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <User className="w-4 h-4 mr-1" />
                {job.driver.name}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center">
              <Car className="w-4 h-4 mr-2" />
              {job.vehicle.make} {job.vehicle.model}
            </p>
            <p className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {job.incident_location.address}
            </p>
            <p className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Completed {job.completed_at}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center space-x-1 text-2xl font-bold text-green-600 mb-2">
            <DollarSign className="w-6 h-6" />
            <span>{job.final_price} ETB</span>
          </div>
          <div className="flex items-center space-x-1 text-green-600">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile, logout, loading: authLoading } = useAuth();
  const { jobs, history, loading, historyLoading, historyError, fetchHistory, fetchJobs } = useJobs();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) {
      fetchHistory();
    }
  }, [activeTab, history.length]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 text-center max-w-lg">
          <p className="text-lg font-semibold text-gray-900 mb-4">Unable to load your profile.</p>
          <p className="text-sm text-gray-600 mb-6">Please log in again to resume your technician workflow.</p>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Logout & Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-600">
                  Welcome back, {profile.full_name}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {profile.provider.business_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchJobs}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Jobs</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {(Array.isArray(profile.skills) ? profile.skills : []).map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Profile Summary */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Technician</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {profile.full_name || "Unnamed Technician"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {profile.phone_number || "No phone number available"}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${profile.provider.is_online ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {profile.provider.is_online ? "Online" : "Offline"}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Provider</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {profile.provider.business_name || "Unknown provider"}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-500">Skill count</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{Array.isArray(profile.skills) ? profile.skills.length : 0}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-500">Job status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{activeTab === "active" ? "Active jobs" : "History"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-2xl p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold ${
                activeTab === "active"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Active Jobs ({jobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-sm font-semibold ${
                activeTab === "history"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white"
              }`}
            >
              <History className="w-5 h-5" />
              <span>History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {activeTab === "active" && loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-500 animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading your active jobs...</p>
          </div>
        ) : activeTab === "history" && historyLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <History className="w-6 h-6 text-green-500 animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading your job history...</p>
          </div>
        ) : activeTab === "active" ? (
          jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No active jobs</h3>
              <p className="text-gray-600">You're all caught up! New jobs will appear here when available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )
        ) : (
          historyError ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load history</h3>
              <p className="text-gray-600 mb-6">{historyError}</p>
              <button
                onClick={() => fetchHistory()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          ) : history.length === 0 && !historyLoading ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed jobs yet</h3>
              <p className="text-gray-600">Your completed jobs will appear here once you finish your first job.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((job) => <HistoryCard key={job.id} job={job} />)}
            </div>
          )
        )}
      </main>
    </div>
  );
}