import React, { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { SkillMatrix } from "../components/SkillMatrix";
import { BasicInfoSection } from "../components/BasicInfoSection";
import {
  HackathonsSection,
  InternshipsSection,
  CertificationsSection
} from "../components/BeyondResumeSections";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  GraduationCap,
  Award,
  Briefcase,
  BadgeCheck,
  User
} from "lucide-react";

interface Page3ProfileBuilderProps {
  onNext: () => void;
  onBack: () => void;
  onOpenContractModal: () => void;
}

export const Page3ProfileBuilder: React.FC<Page3ProfileBuilderProps> = ({
  onNext,
  onBack,
  onOpenContractModal,
}) => {
  const { profile, saveProfile, isSaving, validation } = useProfile();
  const [subTab, setSubTab] = useState<"skills" | "hackathons" | "internships" | "certifications" | "overview">("skills");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/60 mb-2">
            Step 3 of 5 · Role 3: Profile Builder
          </span>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Enrich Profile Beyond Resume
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Augment pre-filled extraction data with hackathon standings, certifications, preferred target roles, and evidence fine-tuning.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? "Saving..." : "Save Progress"}</span>
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
          >
            <span>Proceed to Step 4: Talent Check</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 mb-6 scrollbar-none">
        {[
          { id: "skills" as const, label: "12-Skillset Matrix", icon: GraduationCap, count: profile.skills.length },
          { id: "hackathons" as const, label: "Hackathons", icon: Award, count: profile.hackathons.length },
          { id: "internships" as const, label: "Internships & Exp", icon: Briefcase, count: profile.internships.length },
          { id: "certifications" as const, label: "Certifications", icon: BadgeCheck, count: profile.certifications.length },
          { id: "overview" as const, label: "Biographical & Roles", icon: User, count: undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {subTab === "skills" && <SkillMatrix />}
        {subTab === "hackathons" && <HackathonsSection />}
        {subTab === "internships" && <InternshipsSection />}
        {subTab === "certifications" && <CertificationsSection />}
        {subTab === "overview" && <BasicInfoSection />}
      </div>

      {/* Bottom Stepper Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Extraction</span>
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>Continue to Step 4: Talent Check</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
