import React from "react";
import { UserButton } from "@clerk/clerk-react";
import {
  Briefcase,
  FileSearch,
  UserCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Server
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";

export type FlowRolePage =
  | "role1_jd"
  | "role2_resume"
  | "role3_profile"
  | "role4_talent_check"
  | "role5_matching";

interface AppSidebarProps {
  activePage: FlowRolePage;
  onSelectPage: (page: FlowRolePage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenContractModal: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  onOpenContractModal,
}) => {
  const {
    user,
    profile,
    isBackendConnected,
    hasResume,
  } = useProfile();

  const navItems = [
    {
      id: "role1_jd" as FlowRolePage,
      roleNumber: "Role 1",
      label: "JD Extraction",
      description: "Company JD & Prerequisite Engine",
      icon: Briefcase,
    },
    {
      id: "role2_resume" as FlowRolePage,
      roleNumber: "Role 2",
      label: "Resume Parsing",
      description: "Upload & Inferred Skills",
      icon: FileSearch,
    },
    {
      id: "role3_profile" as FlowRolePage,
      roleNumber: "Role 3",
      label: "Profile Builder",
      description: "Enrich Beyond Resume",
      icon: UserCheck,
    },
    {
      id: "role4_talent_check" as FlowRolePage,
      roleNumber: "Role 4",
      label: "Talent Check",
      description: "Company Hiring Bars",
      icon: Building2,
    },
    {
      id: "role5_matching" as FlowRolePage,
      roleNumber: "Role 5",
      label: "Job Skill Matching",
      description: "Target Role Fit & Gaps",
      icon: CheckCircle2,
    },
  ];

  const displayName = profile.name || user?.name || "Candidate";
  const displayEmail = profile.email || user?.email || "";

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col justify-between border-r border-slate-200 bg-white text-slate-800 transition-all duration-300 ease-in-out select-none shadow-xs ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="truncate">
                <h1 className="font-heading text-sm font-bold text-slate-900 truncate">
                  RADIX Talent
                </h1>
                <p className="text-[11px] text-slate-500 truncate">
                  5-Role Workflow Portal
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white mx-auto">
              <Sparkles className="h-4 w-4" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors ${
              collapsed ? "mx-auto mt-2" : ""
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Authenticated User Card with Clerk UserButton */}
        {!collapsed ? (
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2.5 truncate">
              <UserButton afterSignOutUrl="/" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {displayEmail || (hasResume ? "Resume Active" : "Add Resume in Role 2")}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 flex justify-center border-b border-slate-100">
            <UserButton afterSignOutUrl="/" />
          </div>
        )}

        {/* 5-Role Vertical Navigation List (One per Role, JD first) */}
        <nav className="p-2.5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                }`}
                title={collapsed ? `${item.roleNumber}: ${item.label}` : undefined}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? "bg-blue-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">
                        {item.label}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isActive
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        {item.roleNumber}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Minimal Footer */}
      <div className="p-3 border-t border-slate-100">
        {!collapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`h-2 w-2 rounded-full ${
                  isBackendConnected ? "bg-emerald-500 animate-pulse" : "bg-blue-400"
                }`}
              />
              <span>{isBackendConnected ? "FastAPI Online" : "Local Engine"}</span>
            </span>

            <button
              onClick={onOpenContractModal}
              className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Contract</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={onOpenContractModal} title="View Shared Contract">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
