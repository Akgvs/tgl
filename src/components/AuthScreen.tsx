import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Sparkles, ShieldCheck, Lock } from "lucide-react";

export const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Top Identity */}
      <div className="text-center mb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-md ring-1 ring-blue-500/20 mb-3">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          RADIX Talent Match
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
          Live Clerk Authentication · Sign in to analyze your resume, infer skill prerequisites, and evaluate target company fit.
        </p>
      </div>

      {/* Main Clerk Authentication Card */}
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full flex justify-center">
          {authMode === "signin" ? (
            <div className="w-full flex flex-col items-center">
              <SignIn routing="hash" />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAuthMode("signup")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  Don't have an account? <span className="underline">Sign up with Clerk</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <SignUp routing="hash" />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAuthMode("signin")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  Already have an account? <span className="underline">Sign in with Clerk</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Clerk Secured Authentication</span>
          </span>
          <span>•</span>
          <span>Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};
