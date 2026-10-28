import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryCode, RADIX_SKILL_CATEGORIES } from "../types/contract";
import { CategoryBadge } from "../components/CategoryBadge";
import {
  Building2,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BarChart2,
  RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";

interface Page4TalentCheckProps {
  onNext: () => void;
  onBack: () => void;
}

interface CompanyBar {
  id: string;
  name: string;
  roles: string[];
  description: string;
  thresholds: Record<CategoryCode, number>;
}

const COMPANIES: Record<string, CompanyBar> = {
  google: {
    id: "google",
    name: "Google LLC",
    roles: ["Software Engineer (SWE)", "Data Scientist"],
    description: "High bar in algorithmic problem solving (DSA 9/10), deep systems/OS, and scalable architecture.",
    thresholds: {
      COD: 9, DSA: 9, OOD: 8, APTI: 9, COMM: 8, AI: 8,
      CLOUD: 7, SQL: 7, SWE: 9, SYSD: 9, NETW: 8, OS: 8, OTHER: 5
    }
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft Corporation",
    roles: ["Software Engineer", "Data Analyst"],
    description: "Balanced high bar across cloud computing (Azure), enterprise design patterns, SQL, and DSA.",
    thresholds: {
      COD: 8, DSA: 8, OOD: 8, APTI: 8, COMM: 8, AI: 7,
      CLOUD: 8, SQL: 8, SWE: 8, SYSD: 8, NETW: 7, OS: 7, OTHER: 5
    }
  },
  oracle: {
    id: "oracle",
    name: "Oracle Financial Services Software",
    roles: ["Associate Software Engineer", "Application Support Analyst"],
    description: "Strong emphasis on SQL, relational integrity, enterprise Java/OOP, client communication, and incident triage.",
    thresholds: {
      COD: 7, DSA: 6, OOD: 7, APTI: 7, COMM: 8, AI: 4,
      CLOUD: 5, SQL: 8, SWE: 7, SYSD: 5, NETW: 6, OS: 6, OTHER: 5
    }
  }
};

export const Page4TalentCheck: React.FC<Page4TalentCheckProps> = ({ onNext, onBack }) => {
  const { profile } = useProfile();
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>("google");
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(true);
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);

  const company = COMPANIES[selectedCompanyKey] || COMPANIES.google;

  // Compute candidate level (1-10) for each of the 12 skillsets
  const candidateScores = useMemo(() => {
    const scores: Record<CategoryCode, number> = {
      COD: 3, DSA: 3, OOD: 3, APTI: 3, COMM: 3, AI: 2,
      CLOUD: 2, SQL: 3, SWE: 3, SYSD: 2, NETW: 2, OS: 2, OTHER: 3
    };

    profile.skills.forEach((s) => {
      const boost = s.confidence === "high" ? 2.5 : s.confidence === "medium" ? 1.5 : 0.8;
      scores[s.category_code] = Math.min(10, Math.round(scores[s.category_code] + boost));
    });

    if (profile.hackathons.length > 0) {
      scores.SWE = Math.min(10, scores.SWE + 1);
      scores.APTI = Math.min(10, scores.APTI + 1);
    }
    if (profile.internships.length > 0) {
      scores.COMM = Math.min(10, scores.COMM + 1);
      scores.SWE = Math.min(10, scores.SWE + 1);
    }

    return scores;
  }, [profile.skills, profile.hackathons, profile.internships]);

  // Compute readiness score & gaps
  const { readinessScore, gaps, strengths } = useMemo(() => {
    let totalReq = 0;
    let totalMet = 0;
    const gapList: Array<{ category: CategoryCode; req: number; cand: number; gap: number }> = [];
    const strengthList: Array<{ category: CategoryCode; req: number; cand: number }> = [];

    (Object.keys(company.thresholds) as CategoryCode[]).forEach((cat) => {
      if (cat === "OTHER") return;
      const req = company.thresholds[cat];
      const cand = candidateScores[cat] || 2;
      totalReq += req;
      totalMet += Math.min(req, cand);

      if (cand < req) {
        gapList.push({ category: cat, req, cand, gap: req - cand });
      } else {
        strengthList.push({ category: cat, req, cand });
      }
    });

    const score = Math.round((totalMet / totalReq) * 100);

    return {
      readinessScore: score,
      gaps: gapList.sort((a, b) => b.gap - a.gap),
      strengths: strengthList,
    };
  }, [company, candidateScores]);

  const handleRunCheck = () => {
    setIsRunningCheck(true);
    setTimeout(() => {
      setIsRunningCheck(false);
      setHasEvaluated(true);
      if (readinessScore >= 80) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-800 border border-cyan-200/60 mb-2">
            Step 4 of 5 · Role 4: Talent Check
          </span>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Company Bar Benchmark
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare your profile across all 12 RADIX skillsets against the target company's expected hiring standard.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Proceed to Step 5: Job Matching</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Target Company Selector & Run Button */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Company to Evaluate:
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(COMPANIES).map((key) => {
                const comp = COMPANIES[key];
                const isSelected = selectedCompanyKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCompanyKey(key);
                      setHasEvaluated(true);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {comp.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRunCheck}
            disabled={isRunningCheck}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRunningCheck ? "animate-spin" : ""}`} />
            <span>{isRunningCheck ? "Evaluating 12 Skillsets..." : "Run Talent Check"}</span>
          </button>
        </div>
      </div>

      {/* Score and Gap Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Company Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Target Bar</span>
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-900">{company.name}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{company.description}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Company Roles:</span>
            <div className="flex flex-wrap gap-1">
              {company.roles.map((r) => (
                <span key={r} className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-100">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-purple-600" />
                <span>Readiness Score</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">0-100</span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-heading text-5xl font-black text-slate-900">{readinessScore}%</span>
              <span
                className={`text-xs font-bold ${
                  readinessScore >= 80 ? "text-emerald-600" : readinessScore >= 65 ? "text-amber-600" : "text-rose-600"
                }`}
              >
                {readinessScore >= 80 ? "Meets Bar" : readinessScore >= 65 ? "Competitive" : "Gaps to Bridge"}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  readinessScore >= 80 ? "bg-emerald-500" : readinessScore >= 65 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            Meets or exceeds expected hiring bar in <strong className="text-emerald-700">{strengths.length} of 12</strong> skill categories.
          </p>
        </div>

        {/* Gaps List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Skillset Gaps ({gaps.length})</span>
            </div>

            <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {gaps.map((g) => {
                const meta = RADIX_SKILL_CATEGORIES[g.category];
                return (
                  <div key={g.category} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge code={g.category} size="sm" />
                      <span className="font-medium text-slate-700">{meta.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-rose-600">
                      Level {g.cand}/10 (Bar: {g.req})
                    </span>
                  </div>
                );
              })}

              {gaps.length === 0 && (
                <div className="p-3 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl font-medium">
                  🎉 No gaps identified! Ready for technical rounds.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 12-Skillset Detailed Comparison Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="font-heading text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-600" />
          <span>Full 12-Skillset Benchmark Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(company.thresholds) as CategoryCode[]).map((cat) => {
            if (cat === "OTHER") return null;
            const meta = RADIX_SKILL_CATEGORIES[cat];
            const req = company.thresholds[cat];
            const cand = candidateScores[cat] || 2;
            const isGap = cand < req;

            return (
              <div key={cat} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryBadge code={cat} size="sm" />
                    <span className="font-semibold text-slate-800">{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500">Bar: {req}/10</span>
                    <span className="text-slate-300">•</span>
                    <span className={`font-bold ${isGap ? "text-rose-600" : "text-emerald-600"}`}>
                      Yours: {cand}/10 {isGap ? "(!)" : "✓"}
                    </span>
                  </div>
                </div>

                <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isGap ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${(cand / 10) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10"
                    style={{ left: `${(req / 10) * 100}%` }}
                    title={`Required bar: ${req}/10`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profile Builder</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue to Step 5: Specific Job Matching</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
