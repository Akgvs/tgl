import React, { useState, useEffect } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { Toaster } from "sonner";
import { AppSidebar, FlowRolePage } from "./components/AppSidebar";
import { AuthScreen } from "./components/AuthScreen";
import { PageJdExtraction } from "./pages/PageJdExtraction";
import { Page2Extraction } from "./pages/Page2Extraction";
import { Page3ProfileBuilder } from "./pages/Page3ProfileBuilder";
import { Page4TalentCheck } from "./pages/Page4TalentCheck";
import { Page5SkillMatching } from "./pages/Page5SkillMatching";
import { ContractPreviewModal } from "./components/ContractPreviewModal";
import {
  ChevronRight,
  Download,
  Briefcase,
  ShieldCheck
} from "lucide-react";

const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZGVjaWRpbmctZ3JhY2tsZS00Mi5jbGVyay5hY2NvdW50cy5kZXYk";

function CandidatePortalContent() {
  const {
    setUser,
    profile,
    updateProfile,
    activeJdResult,
    downloadProfileJSON,
  } = useProfile();

  // Get real authenticated Clerk user
  const { user: clerkUser } = useUser();

  // Sync real Clerk credentials with Profile
  useEffect(() => {
    if (clerkUser) {
      const name =
        clerkUser.fullName ||
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        "User";
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      const avatarUrl = clerkUser.imageUrl;

      setUser({
        id: clerkUser.id,
        name,
        email,
        avatarUrl,
      });

      updateProfile({
        name,
        email,
      });
    }
  }, [clerkUser]);

  // Keep 5 pages one per role, with JD Extraction (Role 1) at first
  const [activePage, setActivePage] = useState<FlowRolePage>("role1_jd");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const ROLE_TITLES: Record<FlowRolePage, { role: string; title: string }> = {
    role1_jd: { role: "Role 1", title: "Job Description Analytics & Prerequisite Engine" },
    role2_resume: { role: "Role 2", title: "Resume Parsing & Skills Signal" },
    role3_profile: { role: "Role 3", title: "Profile Builder (Enrich Beyond Resume)" },
    role4_talent_check: { role: "Role 4", title: "Talent Check Hiring Bars" },
    role5_matching: { role: "Role 5", title: "Job Skill Matching & Gap Report" },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body flex selection:bg-blue-600 selection:text-white">
      {/* Fixed Left-Side Column Navigation (5 Roles, JD First) */}
      <AppSidebar
        activePage={activePage}
        onSelectPage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenContractModal={() => setIsContractModalOpen(true)}
      />

      {/* Main Content Area (Spacious & Clean Layout, offset by sidebar width) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Minimal Clean Top Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">RADIX Portal</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-mono font-bold text-blue-600">
              {ROLE_TITLES[activePage].role}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-bold text-slate-800 truncate">
              {ROLE_TITLES[activePage].title}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {activeJdResult && (
              <button
                onClick={() => setActivePage("role1_jd")}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                title="View parsed JD"
              >
                <Briefcase className="h-3 w-3 text-amber-700" />
                <span className="truncate max-w-[130px]">{activeJdResult.company}: {activeJdResult.title}</span>
              </button>
            )}

            <button
              onClick={() => setIsContractModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Contract JSON</span>
            </button>

            <button
              onClick={downloadProfileJSON}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-300" />
              <span className="hidden md:inline">Download</span>
            </button>

            {/* Live Clerk User Avatar & Menu */}
            <div className="flex items-center pl-2 border-l border-slate-200">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Clean 5-Role Main Canvas (1 page per role, JD at first) */}
        <main className="flex-1 pb-16">
          {activePage === "role1_jd" && (
            <PageJdExtraction
              onNext={() => setActivePage("role2_resume")}
              onNavigateToJobMatching={() => setActivePage("role5_matching")}
            />
          )}

          {activePage === "role2_resume" && (
            <Page2Extraction
              onNext={() => setActivePage("role3_profile")}
              onBack={() => setActivePage("role1_jd")}
            />
          )}

          {activePage === "role3_profile" && (
            <Page3ProfileBuilder
              onNext={() => setActivePage("role4_talent_check")}
              onBack={() => setActivePage("role2_resume")}
              onOpenContractModal={() => setIsContractModalOpen(true)}
            />
          )}

          {activePage === "role4_talent_check" && (
            <Page4TalentCheck
              onNext={() => setActivePage("role5_matching")}
              onBack={() => setActivePage("role3_profile")}
            />
          )}

          {activePage === "role5_matching" && (
            <Page5SkillMatching
              onBack={() => setActivePage("role4_talent_check")}
              onRestart={() => setActivePage("role1_jd")}
              onOpenContractModal={() => setIsContractModalOpen(true)}
              onNavigateToJdExtractor={() => setActivePage("role1_jd")}
            />
          )}
        </main>
      </div>

      <ContractPreviewModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ProfileProvider>
        <Toaster richColors position="top-right" />
        <SignedIn>
          <CandidatePortalContent />
        </SignedIn>
        <SignedOut>
          <AuthScreen />
        </SignedOut>
      </ProfileProvider>
    </ClerkProvider>
  );
}

export default App;
