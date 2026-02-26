"use client";

import React, { useState } from "react";
import { X, Clock, ArrowLeft, Palmtree } from "lucide-react";
import clsx from "clsx";
import { usePortalData } from "../portal/PortalDataProvider";

interface AddLogModalProps {
  isOpen: boolean;
  date: Date;
  onClose: () => void;
}

export default function AddLogModal({
  isOpen,
  date,
  onClose,
}: AddLogModalProps) {
  const { user, projects, addLog, updateUser } = usePortalData();
  const [logType, setLogType] = useState<"WORK" | "VACATION" | null>(null);
  const [projectId, setProjectId] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) return;

    if (logType === "WORK" && !projectId) {
      setError("Please select a project");
      return;
    }

    if (!hours || parseFloat(hours) <= 0) {
      setError("Please enter valid hours");
      return;
    }

    setLoading(true);
    try {
      // Use local date without timezone conversion
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      console.log("📝 Submitting log:", {
        dateStr,
        type: logType,
        hours,
        projectId,
      });

      const res = await fetch("/api/employee/time-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          projectId: logType === "WORK" ? projectId : null,
          date: dateStr,
          hours: parseFloat(hours),
          type: logType,
        }),
      });

      const responseData = await res.json();
      console.log("📡 API Response:", {
        status: res.status,
        data: responseData,
      });

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to log");
      }

      // Optimistic update: add the log immediately to local state
      const newLog = responseData[0];
      console.log("⚡ Optimistic update: Adding log to state", newLog);
      addLog(newLog);

      // If it's a vacation, update user's remaining vacation days
      if (logType === "VACATION") {
        const daysDeducted = parseFloat(hours || "8") / 8;
        const updatedUser = {
          ...user,
          remainingVacationDays:
            (user.remainingVacationDays || 0) - daysDeducted,
        };
        console.log(
          "✅ Updating vacation days:",
          updatedUser.remainingVacationDays,
        );
        updateUser(updatedUser);
      }

      console.log("✅ Modal closing");
      onClose();
      resetForm();
    } catch (err) {
      console.error("❌ Error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Error adding log. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setHours("");
    setLogType(null);
    setError("");
  };

  if (!isOpen) return null;

  const dateDisplay = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Type Selection Screen
  if (!logType) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#0F172B]">
                {dateDisplay}
              </h1>
              <p className="text-xs uppercase tracking-wide text-[#90A1B9] font-semibold mt-1">
                Log Activity
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#90A1B9] hover:text-[#62748E] transition-colors p-1"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Type Selector - Card Based */}

          <div className="grid grid-cols-2 gap-4 px-6 py-12">
            <button
              onClick={() => setLogType("WORK")}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Clock size={24} />
              </div>
              <span className="font-bold text-slate-700">Work Hours</span>
            </button>
            <button
              onClick={() => {
                setLogType("VACATION");
                setHours("8");
              }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50/50 transition-all group"
            >
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all">
                <Palmtree size={24} />
              </div>
              <span className="font-bold text-slate-700">Vacation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form Screen
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setLogType(null)}
              className="text-[#155DFC] hover:text-[#1250E6] transition-colors font-semibold text-sm flex items-center gap-1"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
          <h1 className="text-xl font-bold text-[#0F172B]">{dateDisplay}</h1>
          <p className="text-xs uppercase tracking-wide text-[#90A1B9] font-semibold mt-1">
            Log Activity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {logType === "WORK" && (
            <>
              {/* Date Field */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172B] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
                  disabled
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-[#0F172B] bg-[#F8FAFC] border border-[#E2E8F0]"
                />
              </div>

              {/* Project Select */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172B] mb-2">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={clsx(
                    "w-full rounded-lg px-4 py-2.5 text-sm font-medium text-[#0F172B] transition-all",
                    "border-2 bg-white",
                    projectId
                      ? "border-[#155DFC] focus:outline-none"
                      : "border-[#E2E8F0] focus:border-[#155DFC]",
                  )}
                >
                  <option value="">Select a project...</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours Input */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172B] mb-2">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., 4 or 8"
                  className={clsx(
                    "w-full rounded-lg px-4 py-2.5 text-sm font-medium text-[#0F172B] transition-all",
                    "border-2 bg-white",
                    hours
                      ? "border-[#155DFC] focus:outline-none"
                      : "border-[#E2E8F0] focus:border-[#155DFC]",
                  )}
                />
              </div>
            </>
          )}

          {logType === "VACATION" && (
            <>
              {/* Date Field */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172B] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
                  disabled
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-[#0F172B] bg-[#F8FAFC] border border-[#E2E8F0]"
                />
              </div>

              {/* Note */}
              <div className="rounded-lg bg-[#F0F9FF] border border-[#BFDBFE] px-4 py-3">
                <p className="text-sm text-[#1E40AF] font-medium">
                  Note: This will deduct 1 day from your vacation balance.
                </p>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-[#FEE2E2] border border-[#FECACA] px-4 py-3">
              <p className="text-sm text-[#DC2626] font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !hours || (logType === "WORK" && !projectId)}
            className={clsx(
              "w-full rounded-lg py-3 px-4 font-semibold text-white transition-all duration-200 mt-6",
              logType === "VACATION"
                ? "bg-[#16A34A] hover:bg-[#15803D] active:scale-95 disabled:bg-[#CBD5E1]"
                : "bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 disabled:bg-[#CBD5E1]",
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {logType === "WORK"
                  ? "Logging Hours..."
                  : "Logging Vacation..."}
              </span>
            ) : logType === "WORK" ? (
              "Log Hours"
            ) : (
              "Log Vacation Day"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
