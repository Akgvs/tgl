import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import {
  extractSkillsAndPrerequisitesFromJd,
  ExtractedJdResult,
  InferredSkillItem
} from "../lib/skillInferenceEngine";
import { COMPANY_JD_DATASET, CompanyJdItem } from "../data/companyJdDataset";
import { CategoryBadge } from "../components/CategoryBadge";
import { RADIX_SKILL_CATEGORIES, CategoryCode } from "../types/contract";
import {
  Building2,
  FileCode2,
  Sparkles,
  ArrowRight,
  Copy,
  Download,
  CheckCircle2,
  GitBranch,
  MapPin,
  Send,
  Eye,
  FileText,
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface PageJdExtractionProps {
  onNext?: () => void;
  onNavigateToJobMatching?: () => void;
  onNavigateToTalentCheck?: () => void;
}

export const PageJdExtraction: React.FC<PageJdExtractionProps> = ({
  onNext,
  onNavigateToJobMatching,
}) => {
  const { activeJdResult, setActiveJdResult } = useProfile();

  const [selectedPresetId, setSelectedPresetId] = useState<string>("meta-frontend");
  const [inputMode, setInputMode] = useState<"preset" | "custom">("preset");
  const [customText, setCustomText] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customCompany, setCustomCompany] = useState<string>("");
  const [viewMode, setViewMode] = useState<"visual" | "dependency" | "json">("visual");
  const [filterType, setFilterType] = useState<"all" | "explicit" | "implied">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryCode | "ALL">("ALL");

  const currentJd = activeJdResult || useMemo(() => {
    const item = COMPANY_JD_DATASET[0];
    return extractSkillsAndPrerequisitesFromJd(item.rawText, {
      title: item.role,
      company: item.company,
      location: item.location,
      workMode: item.workMode,
    });
  }, [activeJdResult]);

  const handleSelectPreset = (preset: CompanyJdItem) => {
    setSelectedPresetId(preset.id);
    const extracted = extractSkillsAndPrerequisitesFromJd(preset.rawText, {
      title: preset.role,
      company: preset.company,
      location: preset.location,
      workMode: preset.workMode,
    });
    setActiveJdResult(extracted);
    toast.success(`Loaded JD for ${preset.company}`);
  };

  const handleExtractCustomText = () => {
    if (!customText.trim()) {
      toast.error("Please enter Job Description text first.");
      return;
    }
    const extracted = extractSkillsAndPrerequisitesFromJd(customText, {
      title: customTitle.trim() || undefined,
      company: customCompany.trim() || undefined,
    });
    setActiveJdResult(extracted);
    toast.success(`Parsed JD for ${extracted.company}`);
  };

  const filteredSkills = useMemo(() => {
    let list = currentJd.allSkills;
    if (filterType === "explicit") list = currentJd.explicitSkills;
    if (filterType === "implied") list = currentJd.impliedSkills;

    if (selectedCategoryFilter !== "ALL") {
      list = list.filter((s) => s.category_code === selectedCategoryFilter);
    }
    return list;
  }, [currentJd, filterType, selectedCategoryFilter]);

  // Group JD skills by Category (SWE, SYSD, COD, SQL, CLOUD, OS, etc.)
  const skillsByCategory = useMemo(() => {
    const groups: Partial<Record<CategoryCode, InferredSkillItem[]>> = {};

    filteredSkills.forEach((skill) => {
      const code = skill.category_code || "OTHER";
      if (!groups[code]) {
        groups[code] = [];
      }
      groups[code]!.push(skill);
    });

    return groups;
  }, [filteredSkills]);

  // Categories present in this JD
  const activeCategories = useMemo(() => {
    const cats = new Set<CategoryCode>();
    currentJd.allSkills.forEach((s) => cats.add(s.category_code));
    return Array.from(cats);
  }, [currentJd]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentJd.rawJsonExport, null, 2));
      toast.success("Copied JD JSON to clipboard!");
    } catch {
      toast.error("Failed to copy JSON.");
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(currentJd.rawJsonExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jd_extract_${currentJd.company.toLowerCase().replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded JD JSON file!");
  };

  const handleSendToJobMatching = () => {
    setActiveJdResult(currentJd);
    toast.success(`Active Job Description set to ${currentJd.title} at ${currentJd.company}`);
    if (onNavigateToJobMatching) {
      onNavigateToJobMatching();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Job Analysis
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              if (onNext) onNext();
              else handleSendToJobMatching();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dataset Selector / Custom Input Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800">
            Select Company Job Description
          </span>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setInputMode("preset")}
              className={`px-3 py-1 rounded-md transition-all ${
                inputMode === "preset"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Company Presets
            </button>
            <button
              onClick={() => setInputMode("custom")}
              className={`px-3 py-1 rounded-md transition-all ${
                inputMode === "custom"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Paste Custom JD
            </button>
          </div>
        </div>

        {inputMode === "preset" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMPANY_JD_DATASET.map((item) => {
              const isSelected = selectedPresetId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPreset(item)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate">{item.company}</span>
                    <span className="text-[10px] text-slate-500">{item.workMode}</span>
                  </div>
                  <p className="text-slate-700 font-semibold line-clamp-1">{item.role}</p>
                  <div className="mt-1 text-[10px] text-slate-400 truncate">{item.location}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Job Role (e.g. React Frontend Engineer)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Company Name (e.g. Acme Corp)"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Paste Job Description text here... (e.g. Looking for a Senior React Engineer with Next.js and state management)"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end">
              <button
                onClick={handleExtractCustomText}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Extract with Skill Inference</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Pills Bar (SWE, SYSD, COD, SQL, etc.) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter("ALL")}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
            selectedCategoryFilter === "ALL"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          All Categories
        </button>

        {activeCategories.map((code) => {
          const meta = RADIX_SKILL_CATEGORIES[code];
          const isSelected = selectedCategoryFilter === code;
          return (
            <button
              key={code}
              onClick={() => setSelectedCategoryFilter(code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                isSelected
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {code} · {meta?.name || code}
            </button>
          );
        })}
      </div>

      {/* View Switcher: Grouped View vs Prerequisite Graph vs JSON */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "visual"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Skills
          </button>
          <button
            onClick={() => setViewMode("dependency")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "dependency"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dependencies
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "json"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            JSON
          </button>
        </div>

        {viewMode === "visual" && (
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                filterType === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("explicit")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                filterType === "explicit" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Explicit
            </button>
            <button
              onClick={() => setFilterType("implied")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                filterType === "implied" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Implied
            </button>
          </div>
        )}
      </div>

      {/* Main View: Grouped by Category (SWE, SYSD, COD, SQL, CLOUD, etc.) */}
      {viewMode === "visual" && (
        <div className="space-y-6">
          {(Object.keys(skillsByCategory) as CategoryCode[]).map((catCode) => {
            const skillsInCat = skillsByCategory[catCode] || [];
            const meta = RADIX_SKILL_CATEGORIES[catCode];

            return (
              <div
                key={catCode}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <CategoryBadge code={catCode} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {meta?.name || catCode} ({catCode})
                      </h3>
                      <p className="text-[11px] text-slate-500">{meta?.shortDesc}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {skillsInCat.length}
                  </span>
                </div>

                {/* Skills Grid in this Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skillsInCat.map((skill, idx) => (
                    <div
                      key={skill.id || idx}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                        skill.isImplied
                          ? "border-indigo-200 bg-indigo-50/40"
                          : "border-slate-200 bg-slate-50/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-slate-900">{skill.skill_name}</h4>
                          {skill.isImplied ? (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                              ⚡ via {skill.impliedBy}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Direct Mention
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-2">
                          {skill.evidence}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{skill.confidence} Confidence</span>
                        <span className="font-mono">{skill.category_code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prerequisite Flow View */}
      {viewMode === "dependency" && (
        <div className="space-y-4">
          {currentJd.skillDependencyGraph.map((item, i) => (
            <div key={i} className="rounded-xl border border-indigo-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-slate-900">{item.parent}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                  Framework in JD
                </span>
                <span className="text-[11px] text-slate-500">
                  ──implies foundational prerequisites:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {item.implied.map((child, cIdx) => (
                  <div key={cIdx} className="rounded-lg border border-indigo-200 bg-white p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{child.name}</span>
                      <CategoryBadge code={child.category} size="sm" />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {child.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JSON Contract View */}
      {viewMode === "json" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-emerald-400">
              extracted_jd.json
            </span>
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(currentJd.rawJsonExport, null, 2)}
          </pre>
        </div>
      )}

      {/* Bottom Action */}
      <div className="mt-8 flex items-center justify-end">
        <button
          onClick={() => {
            if (onNext) onNext();
            else handleSendToJobMatching();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
