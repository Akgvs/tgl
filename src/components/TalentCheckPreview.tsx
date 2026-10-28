import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryCode, RADIX_SKILL_CATEGORIES } from "../types/contract";
import { CategoryBadge } from "./CategoryBadge";
import {
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Sparkles,
  BarChart2,
  ArrowRight
} from "lucide-react";

interface CompanyThresholds {
  name: string;
  roles: string[];
  thresholds: Record<CategoryCode, number>;
  description: string;
}

const COMPANIES: Record<string, CompanyThresholds> = {
  google: {
    name: "Google LLC",
    roles: ["Software Engineer (SWE)", "Data Scientist"],
    thresholds: {
      COD: 9, DSA: 9, OOD: 8, APTI: 9, COMM: 8, AI: 8,
      CLOUD: 7, SQL: 7, SWE: 9, SYSD: 9, NETW: 8, OS: 8, OTHER: 5
    },
    description: "High bar in algorithms (DSA 9/10), low-level systems (OS/NETW 8), and distributed architecture.",
  },
  microsoft: {
    name: "Microsoft Corporation",
    roles: ["Software Engineer", "Data Analyst"],
    thresholds: {
      COD: 8, DSA: 8, OOD: 8, APTI: 8, COMM: 8, AI: 7,
      CLOUD: 8, SQL: 8, SWE: 8, SYSD: 8, NETW: 7, OS: 7, OTHER: 5
    },
    description: "Balanced expectations across cloud engineering (Azure), robust OOP design, SQL, and enterprise SWE.",
  },
  oracle: {
    name: "Oracle Financial Services Software",
    roles: ["Associate Software Engineer", "Application Support Analyst"],
    thresholds: {
      COD: 7, DSA: 6, OOD: 7, APTI: 7, COMM: 8, AI: 4,
      CLOUD: 5, SQL: 8, SWE: 7, SYSD: 5, NETW: 6, OS: 6, OTHER: 5
    },
    description: "Strong emphasis on SQL, relational integrity, enterprise Java/OOP, client communication, and incident triage.",
  },
};

export const TalentCheckPreview: React.FC = () => {
  const { profile, activeCandidateId } = useProfile();
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>("google");

  const company = COMPANIES[selectedCompanyKey] || COMPANIES.google;

  // Compute candidate level (1-10) for each of the 12 skillsets
  const candidateScores = useMemo(() => {
    const scores: Record<CategoryCode, number> = {
      COD: 3, DSA: 3, OOD: 3, APTI: 3, COMM: 3, AI: 2,
      CLOUD: 2, SQL: 3, SWE: 3, SYSD: 2, NETW: 2, OS: 2, OTHER: 3
    };

    // Calculate level based on skills, evidence quality, and confidence
    profile.skills.forEach((s) => {
      const boost = s.confidence === "high" ? 2.5 : s.confidence === "medium" ? 1.5 : 0.8;
      scores[s.category_code] = Math.min(10, Math.round(scores[s.category_code] + boost));
    });

    // Bonus for hackathons & internships
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

  // Compute gap analysis & readiness score (0-100)
  const { readinessScore, gaps, strengths } = useMemo(() => {
    let totalRequired = 0;
    let totalMet = 0;
    const gapList: Array<{ category: CategoryCode; req: number; cand: number; gap: number }> = [];
    const strengthList: Array<{ category: CategoryCode; req: number; cand: number }> = [];

    (Object.keys(company.thresholds) as CategoryCode[]).forEach((cat) => {
      if (cat === "OTHER") return;
      const req = company.thresholds[cat];
      const cand = candidateScores[cat] || 2;
      totalRequired += req;
      totalMet += Math.min(req, cand);

      if (cand < req) {
        gapList.push({ category: cat, req, cand, gap: req - cand });
      } else {
        strengthList.push({ category: cat, req, cand });
      }
    });

    const score = Math.round((totalMet / totalRequired) * 100);

    return {
      readinessScore: score,
      gaps: gapList.sort((a, b) => b.gap - a.gap),
      strengths: strengthList,
    };
  }, [company, candidateScores]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
              Talent Check Sandbox (Role 4 Simulation)
            </h2>
            <span className="rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 border border-cyan-200">
              Downstream Interop Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrating how Role 4 (Talent Check) directly consumes this profile against company skillset expectations.
          </p>
        </div>

        {/* Company Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {Object.keys(COMPANIES).map((key) => {
            const comp = COMPANIES[key];
            const isSelected = selectedCompanyKey === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCompanyKey(key)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  isSelected
                    ? "bg-white text-blue-700 font-bold shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {comp.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Readiness Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Target Company Bar</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">{company.name}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{company.description}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">In-Scope Roles:</span>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-purple-600" />
                <span>Readiness Score</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">0-100 scale</span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-heading text-4xl font-extrabold tracking-tight text-slate-900">
                {readinessScore}%
              </span>
              <span
                className={`text-xs font-bold ${
                  readinessScore >= 80 ? "text-emerald-600" : readinessScore >= 65 ? "text-amber-600" : "text-rose-600"
                }`}
              >
                {readinessScore >= 80 ? "Strong Benchmark Match" : readinessScore >= 65 ? "Competitive Fit" : "Skill Gaps Identified"}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  readinessScore >= 80 ? "bg-emerald-500" : readinessScore >= 65 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Candidate <strong className="text-slate-700">{profile.name}</strong> meets requirements across{" "}
            <strong className="text-emerald-700">{strengths.length} of 12</strong> skill categories.
          </p>
        </div>

        {/* Priority Skillset Gaps */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Skill Gaps ({gaps.length})</span>
            </div>

            <div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
              {gaps.map((g) => {
                const meta = RADIX_SKILL_CATEGORIES[g.category];
                return (
                  <div key={g.category} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge code={g.category} size="sm" />
                      <span className="font-medium text-slate-700">{meta.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-rose-600">
                      {g.cand}/10 (Req: {g.req})
                    </span>
                  </div>
                );
              })}

              {gaps.length === 0 && (
                <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg">
                  🎉 No skill gaps! Candidate exceeds all 12 skillset bars.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 12-Skillset Comparison Bar Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-600" />
          <span>12-Skillset Bar Comparison: Candidate Level vs. Expected Bar (1-10)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(company.thresholds) as CategoryCode[]).map((cat) => {
            if (cat === "OTHER") return null;
            const meta = RADIX_SKILL_CATEGORIES[cat];
            const req = company.thresholds[cat];
            const cand = candidateScores[cat] || 2;
            const hasGap = cand < req;

            return (
              <div key={cat} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryBadge code={cat} size="sm" />
                    <span className="font-semibold text-slate-800">{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500">Req: {req}</span>
                    <span className="text-slate-300">|</span>
                    <span className={`font-bold ${hasGap ? "text-rose-600" : "text-emerald-600"}`}>
                      Cand: {cand} {hasGap ? "(Gap)" : "✓"}
                    </span>
                  </div>
                </div>

                <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  {/* Candidate Bar */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all ${
                      hasGap ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(cand / 10) * 100}%` }}
                  />
                  {/* Company Target Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10"
                    style={{ left: `${(req / 10) * 100}%` }}
                    title={`Required level: ${req}/10`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
