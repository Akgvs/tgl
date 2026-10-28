import React from "react";
import { useProfile } from "../context/ProfileContext";
import { SAMPLE_CANDIDATES } from "../data/sampleCandidates";
import {
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Upload,
  RefreshCw
} from "lucide-react";

interface AnalyticsBannerProps {
  onOpenModal: () => void;
}

export const AnalyticsBanner: React.FC<AnalyticsBannerProps> = ({ onOpenModal }) => {
  const { profile, activeCandidateId, switchCandidate } = useProfile();

  const getCandidateSubtitle = () => {
    switch (activeCandidateId) {
      case "ananya":
        return "Systems-leaning generalist • Strong fit for SWE-heavy roles";
      case "karthik":
        return "Data-leaning analyst • Strong fit for Data Scientist / Analyst roles";
      case "priya":
        return "Entry-level support-oriented • Best fit for Oracle Financial Services";
      case "rohan":
        return "Strong all-rounder • Competitive fit across SWE, Cloud, and Data";
      default:
        return "Custom candidate profile";
    }
  };

  return (
    <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-slate-50 px-4 py-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Analytics Ingestion Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Analytics Pipeline Inbound
              </span>
              <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                Source: {profile.cv_file || "Role 2 Resume Parsing JSON"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="font-semibold text-slate-800">{profile.name}</span> — {getCandidateSubtitle()}
            </p>
          </div>
        </div>

        {/* Right: Quick Ingestion Switchers & Modal Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white/80 border border-indigo-200/80 p-1 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 px-1.5 hidden md:inline">
              Sample Inputs:
            </span>
            {(["ananya", "karthik", "priya", "rohan"] as const).map((key) => (
              <button
                key={key}
                onClick={() => switchCandidate(key)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-all ${
                  activeCandidateId === key
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Ingest Role 2 JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
