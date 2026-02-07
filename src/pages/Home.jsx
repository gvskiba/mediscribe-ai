import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Stethoscope, ArrowRight, Shield } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        navigate(createPageUrl("Dashboard"));
      } else {
        setChecking(false);
      }
    } catch (error) {
      // User not authenticated, show login screen
      setChecking(false);
    }
  };

  const handleDevLogin = async () => {
    // Redirect to platform login
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">MedScribe</h1>
          <p className="text-slate-600 mb-8">Clinical AI Documentation Assistant</p>

          {/* Dev Login Button */}
          <Button
            onClick={handleDevLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl h-12 text-base gap-2 mb-4"
          >
            <Shield className="w-5 h-5" />
            Login with Dev Account
            <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Info Text */}
          <p className="text-xs text-slate-500 mt-6">
            Development mode • Quick access for testing
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid gap-4 text-sm">
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-slate-100">
            <p className="font-medium text-slate-900 mb-1">🎤 AI Note Transcription</p>
            <p className="text-slate-600 text-xs">Voice-to-structured clinical notes with custom templates</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-slate-100">
            <p className="font-medium text-slate-900 mb-1">📚 Clinical Guidelines</p>
            <p className="text-slate-600 text-xs">Evidence-based answers with OpenEvidence integration</p>
          </div>
        </div>
      </div>
    </div>
  );
}