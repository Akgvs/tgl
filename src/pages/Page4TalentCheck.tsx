import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryBadge } from "../components/CategoryBadge";
import {
  TALENT_CHECK_COMPANY_SKILLSETS,
  ALL_COMPANIES_LIST,
  computeCandidateCompetencyScores,
  evaluateCandidateAgainstCompany,
  CompanySkillsetExpectation
} from "../data/talentCheckCompanySkillsets";
import {
  Building2,
  Target,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BarChart2,
  RefreshCw,
  MapPin,
  Briefcase,
  Sparkles,
  Search
} from "lucide-react";
import confetti from "canvas-confetti";

interface Page4TalentCheckProps {
  onNext: () => void;
  onBack: () => void;
}

export const Page4TalentCheck: React.FC<Page4TalentCheckProps> = ({ onNext, onBack }) => {
  const { profile } = useProfile();
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>("google");
  const [isRunningCheck, setIsRunningCheck] = useState<boolean>(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");

  const companies = TALENT_CHECK_COMPANY_SKILLSETS.companies;
  const currentCompany: CompanySkillsetExpectation =
    companies[selectedCompanyKey] || companies.google;

  // Compute candidate level (1-10) for each of the 12 skillsets using official rules
  const candidateScores = useMemo(() => {
    return computeCandidateCompetencyScores(profile);
  }, [profile]);

  // Evaluate candidate against company's 12-skillset expectations
  const evaluation = useMemo(() => {
    return evaluateCandidateAgainstCompany(candidateScores, currentCompany);
  }, [candidateScores, currentCompany]);

  const filteredCompanyList = useMemo(() => {
    if (!searchFilter.trim()) return ALL_COMPANIES_LIST;
    const q = searchFilter.toLowerCase();
    return ALL_COMPANIES_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company_id.toLowerCase().includes(q) ||
        (c.id && c.id.toString().includes(q))
    );
  }, [searchFilter]);

  const handleRunCheck = () => {
    setIsRunningCheck(true);
    setTimeout(() => {
      setIsRunningCheck(false);
      if (evaluation.readinessScore >= 80) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 } });
      }
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
              <Sparkles className="h-3 w-3" />
              <span>12-Skillset Benchmark Engine</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              talent_check_company_skillsets.json ({ALL_COMPANIES_LIST.length} companies)
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Company Benchmarks & Talent Check
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Evaluate candidate proficiency levels (1–10) across all 12 competency skillsets against verified company hiring expectations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Target Company Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hackathon Scope Targets:
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {ALL_COMPANIES_LIST.length} Company Records Available
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "google", label: "Google LLC", id: 4 },
                { key: "microsoft", label: "Microsoft Corporation", id: 78 },
                { key: "oracle", label: "Oracle Financial Services", id: 24 }
              ].map(({ key, label, id }) => {
                const isSelected = selectedCompanyKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCompanyKey(key);
                      setExpandedCategory(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? "bg-slate-800 text-slate-300" : "bg-slate-200/70 text-slate-500"}`}>
                      #{id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searchable dropdown across all companies from dataset */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter 116 companies (e.g. Apple, Amazon, Swiggy)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <select
                value={selectedCompanyKey}
                onChange={(e) => {
                  setSelectedCompanyKey(e.target.value);
                  setExpandedCategory(null);
                }}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs max-w-xs"
              >
                {filteredCompanyList.map((c) => (
                  <option key={c.company_id} value={c.company_id}>
                    {c.id ? `[#${c.id}] ` : ""}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunCheck}
              disabled={isRunningCheck}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRunningCheck ? "animate-spin" : ""}`} />
              <span>{isRunningCheck ? "Evaluating 12 Skillsets..." : "Run Benchmark"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Score and Gap Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Company Overview Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>Target Standard</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {currentCompany.id ? `RECORD #${currentCompany.id}` : "12 SKILLSETS"}
              </span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">{currentCompany.name}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{currentCompany.description}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Roles in Scope:
              </span>
              <div className="flex flex-wrap gap-1">
                {(currentCompany.roles || ["Software Engineer"]).map((r) => (
                  <span key={r} className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-100">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {currentCompany.locations && currentCompany.locations.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{currentCompany.locations.join(" • ")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Readiness Meter Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-purple-600" />
                <span>Readiness Score</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {evaluation.totalMet} / {evaluation.totalRequired} pts
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-heading text-4xl sm:text-5xl font-black text-slate-900">
                {evaluation.readinessScore}%
              </span>
              <span
                className={`text-xs font-bold ${
                  evaluation.readinessScore >= 80
                    ? "text-emerald-600"
                    : evaluation.readinessScore >= 65
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {evaluation.barStatus}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  evaluation.readinessScore >= 80
                    ? "bg-emerald-500"
                    : evaluation.readinessScore >= 65
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${evaluation.readinessScore}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Meets or exceeds bar in <strong className="text-emerald-700 font-bold">{evaluation.strengths.length} of 12</strong> competency areas.
          </div>
        </div>

        {/* Gaps List Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Identified Skill Gaps</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-rose-600">
                {evaluation.gaps.length} areas
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {evaluation.gaps.map((g) => (
                <div
                  key={g.category}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CategoryBadge code={g.category} size="sm" />
                    <span className="font-medium text-slate-700 truncate">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2 font-mono text-[11px]">
                    {g.rawLevel && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {g.rawLevel}
                      </span>
                    )}
                    <span className="font-bold text-rose-600">
                      L{g.cand} (Bar: {g.req})
                    </span>
                  </div>
                </div>
              ))}

              {evaluation.gaps.length === 0 && (
                <div className="p-3 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl font-medium">
                  Candidate meets or exceeds all 12 competency thresholds!
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            {evaluation.gaps.length > 0
              ? `Largest gap: ${evaluation.gaps[0].name} (-${evaluation.gaps[0].gap} pts)`
              : "Technical bar satisfied for all in-scope positions"}
          </p>
        </div>
      </div>

      {/* Role-Specific Fit Analysis Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs mb-6">
        <h3 className="font-heading text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-600" />
          <span>Role-Specific Fit Analysis for {currentCompany.name}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluation.fitSummaryByRole.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                item.isPrimaryFit
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-slate-50/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900">{item.role}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isPrimaryFit
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.isPrimaryFit ? "High Fit Alignment" : "Bridge Gaps"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {item.fitNote}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full 12-Skillset Benchmark Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h3 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            <span>Full 12-Skillset Competency Breakdown</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Click any skill to view remediation recommendations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evaluation.comparison.map((row) => {
            const isGap = row.status === "gap";
            const isExpanded = expandedCategory === row.category;

            return (
              <div
                key={row.category}
                onClick={() => setExpandedCategory(isExpanded ? null : row.category)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isGap
                    ? "border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/40"
                    : "border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge code={row.category} size="sm" />
                    <span className="font-semibold text-slate-800">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-500">Bar: {row.req}/10</span>
                    {row.rawLevel && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {row.rawLevel}
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span
                      className={`font-bold ${
                        isGap ? "text-rose-600" : row.status === "exceeds" ? "text-emerald-700" : "text-emerald-600"
                      }`}
                    >
                      Yours: {row.cand}/10 {isGap ? `(-${row.gap})` : "✓"}
                    </span>
                  </div>
                </div>

                {/* Progress bar with threshold marker */}
                <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isGap ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(row.cand / 10) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10"
                    style={{ left: `${(row.req / 10) * 100}%` }}
                    title={`Required bar: ${row.req}/10 (${row.rawLevel || ""})`}
                  />
                </div>

                {/* Expanded recommendation */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-snug">
                    <span className="font-bold text-slate-800">Recommendation: </span>
                    <span>{row.recommendation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
