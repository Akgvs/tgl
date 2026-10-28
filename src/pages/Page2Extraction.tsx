import React, { useState, useMemo } from "react";
import { useProfile } from "../context/ProfileContext";
import { CategoryBadge } from "../components/CategoryBadge";
import { RADIX_SKILL_CATEGORIES, CategoryCode } from "../types/contract";
import {
  extractSkillsAndPrerequisitesFromResume,
  InferredSkillItem,
  ExtractedResumeResult
} from "../lib/skillInferenceEngine";
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Layers,
  Upload,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Page2ExtractionProps {
  onNext: () => void;
  onBack: () => void;
}

export const Page2Extraction: React.FC<Page2ExtractionProps> = ({ onNext, onBack }) => {
  const { user, profile, updateProfile, applyExtractedResumeToProfile, hasResume } = useProfile();
  const [filterType, setFilterType] = useState<"all" | "explicit" | "implied">("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryCode | "ALL">("ALL");
  const [viewJson, setViewJson] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(!hasResume && profile.skills.length === 0);
  const [resumePasteText, setResumePasteText] = useState<string>("");
  const [uploadTab, setUploadTab] = useState<"file" | "paste">("file");

  // Run prerequisite inference on resume skills
  const extractedResumeData = useMemo<ExtractedResumeResult>(() => {
    const resumeText = `
Name: ${profile.name || user?.name || "Candidate"}
Email: ${profile.email || user?.email || "candidate@example.com"}
Education: ${profile.education || "B.Tech in Computer Science"}
Skills: ${profile.skills.map((s) => s.skill_name).join(", ")}
    `;

    return extractSkillsAndPrerequisitesFromResume(resumeText, profile.skills);
  }, [profile, user]);

  // Track enabled/approved implied skills
  const [selectedImpliedSkills, setSelectedImpliedSkills] = useState<Set<string>>(() => {
    return new Set(extractedResumeData.impliedSkills.map((s) => s.skill_name));
  });

  const toggleImpliedSkill = (name: string) => {
    setSelectedImpliedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      let extracted: ExtractedResumeResult;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          updateProfile({
            education: parsed.education || profile.education,
            skills: parsed.skills || [],
            cv_file: file.name,
          });
          toast.success(`Loaded profile from ${file.name}`);
          setShowUploadModal(false);
          return;
        } catch {
          toast.error("Invalid JSON format.");
          return;
        }
      } else {
        extracted = extractSkillsAndPrerequisitesFromResume(
          text.length > 20 ? text : `Candidate: ${user?.name || "User"}\nSkills: React, Next.js, TypeScript, Python, SQL`
        );
      }

      applyExtractedResumeToProfile(extracted);
      updateProfile({ cv_file: file.name, cv_uploaded_at: new Date().toISOString() });
      setShowUploadModal(false);
      toast.success(`Extracted skills from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!resumePasteText.trim()) {
      toast.error("Please enter resume text.");
      return;
    }
    const extracted = extractSkillsAndPrerequisitesFromResume(resumePasteText);
    applyExtractedResumeToProfile(extracted);
    updateProfile({ cv_file: "pasted_resume.txt", cv_uploaded_at: new Date().toISOString() });
    setShowUploadModal(false);
    toast.success("Extracted skills from text!");
  };

  const displayedSkills = useMemo(() => {
    let list = extractedResumeData.allSkills;
    if (filterType === "explicit") list = extractedResumeData.explicitSkills;
    if (filterType === "implied") list = extractedResumeData.impliedSkills;

    if (selectedCategoryFilter !== "ALL") {
      list = list.filter((s) => s.category_code === selectedCategoryFilter);
    }
    return list;
  }, [extractedResumeData, filterType, selectedCategoryFilter]);

  // Group skills by Category
  const skillsByCategory = useMemo(() => {
    const groups: Partial<Record<CategoryCode, InferredSkillItem[]>> = {};

    displayedSkills.forEach((skill) => {
      const code = skill.category_code || "OTHER";
      if (!groups[code]) {
        groups[code] = [];
      }
      groups[code]!.push(skill);
    });

    return groups;
  }, [displayedSkills]);

  const activeCategories = useMemo(() => {
    const cats = new Set<CategoryCode>();
    extractedResumeData.allSkills.forEach((s) => cats.add(s.category_code));
    return Array.from(cats);
  }, [extractedResumeData]);

  const handlePushToProfileBuilder = () => {
    const finalSkills: InferredSkillItem[] = [
      ...extractedResumeData.explicitSkills,
      ...extractedResumeData.impliedSkills.filter((s) => selectedImpliedSkills.has(s.skill_name)),
    ];

    applyExtractedResumeToProfile({
      ...extractedResumeData,
      allSkills: finalSkills,
    });

    onNext();
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(extractedResumeData.rawJsonExport, null, 2)
      );
      toast.success("Copied extracted JSON to clipboard!");
    } catch {
      toast.error("Failed to copy JSON.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Resume Scanner
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Automatically extract core competencies and infer prerequisite foundational skills from your resume.
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
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{showUploadModal ? "Hide Upload" : "Upload Resume"}</span>
          </button>

          <button
            onClick={handlePushToProfileBuilder}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Upload/Paste Resume Area */}
      {showUploadModal && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
            <h3 className="text-xs font-bold text-slate-800">
              Attach or Paste Resume
            </h3>

            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setUploadTab("file")}
                className={`px-3 py-1 rounded-md transition-all ${
                  uploadTab === "file" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setUploadTab("paste")}
                className={`px-3 py-1 rounded-md transition-all ${
                  uploadTab === "paste" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {uploadTab === "file" ? (
            <div className="text-center p-6 bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="resume-file-inline"
                accept=".pdf,.docx,.doc,.json,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-3">
                Upload your resume (PDF, DOCX, TXT, or JSON)
              </p>
              <label
                htmlFor="resume-file-inline"
                className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
              >
                <span>Select Document</span>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={5}
                placeholder="Paste your resume content here (e.g. skills, experience, education)..."
                value={resumePasteText}
                onChange={(e) => setResumePasteText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono bg-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParsePastedText}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Extract Skills</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Pills Bar */}
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

      {/* Filter Tabs & JSON Toggle */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "all" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Skills
          </button>
          <button
            onClick={() => setFilterType("explicit")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "explicit" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Direct Mentions
          </button>
          <button
            onClick={() => setFilterType("implied")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === "implied" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inferred
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewJson(!viewJson)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{viewJson ? "Skill View" : "View JSON"}</span>
          </button>
          {viewJson && (
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </button>
          )}
        </div>
      </div>

      {/* Grouped Skills View by Category */}
      {!viewJson ? (
        Object.keys(skillsByCategory).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-xs text-slate-500 mb-3">No skills extracted yet. Upload or paste your resume above to extract skills.</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Attach Resume Document</span>
            </button>
          </div>
        ) : (
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

                  {/* Skills List in this Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skillsInCat.map((skill, i) => {
                      const isImplied = skill.isImplied;
                      const isApproved = !isImplied || selectedImpliedSkills.has(skill.skill_name);

                      return (
                        <div
                          key={skill.id || i}
                          className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                            isImplied
                              ? "border-indigo-200 bg-indigo-50/40"
                              : "border-slate-200 bg-slate-50/30"
                          } ${!isApproved ? "opacity-50" : ""}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h4 className="text-xs font-bold text-slate-900">
                                {skill.skill_name}
                              </h4>

                              {isImplied ? (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                                  Inferred via {skill.impliedBy}
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

                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="capitalize text-slate-400">
                              {skill.confidence} confidence
                            </span>
                            {isImplied && (
                              <button
                                type="button"
                                onClick={() => toggleImpliedSkill(skill.skill_name)}
                                className={`font-bold px-2 py-0.5 rounded transition-colors ${
                                  isApproved
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {isApproved ? "Approved ✓" : "Excluded"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-5 shadow-xs">
          <pre className="text-xs font-mono text-indigo-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(extractedResumeData.rawJsonExport, null, 2)}
          </pre>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handlePushToProfileBuilder}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
