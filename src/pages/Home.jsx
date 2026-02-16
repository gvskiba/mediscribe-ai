import React from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Shield,
  Zap,
  Clock,
  BarChart3,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69876015478a19e360c5e3ea/2b9f784ba_ChatGPTImageFeb16202605_16_02PM.png" 
              alt="Notrya AI" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold text-slate-900">Notrya AI</h1>
          </div>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold gap-2"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Logo and Text */}
          <div className="space-y-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69876015478a19e360c5e3ea/2b9f784ba_ChatGPTImageFeb16202605_16_02PM.png" 
              alt="Notrya AI Logo" 
              className="w-80 h-80 drop-shadow-2xl"
            />
            <div>
              <h1 className="text-6xl sm:text-7xl font-bold text-slate-900 mb-4 leading-tight">
                Notrya AI
              </h1>
              <p className="text-2xl text-cyan-600 font-semibold">Clinical Intelligence Reimagined</p>
            </div>
          </div>

          {/* Right: CTA and Description */}
          <div className="space-y-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-10 border border-cyan-200 backdrop-blur">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">
                Transform Your Clinical Documentation
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed">
                Your intelligent assistant for streamlined medical notes, evidence-based recommendations, and enhanced patient care through advanced AI.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "AI-powered clinical analysis & structuring",
                "Evidence-based guidance & recommendations",
                "60% faster documentation time",
                "HIPAA-compliant & secure"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-1" />
                  <p className="text-slate-700">{feature}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => base44.auth.redirectToLogin()}
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white gap-2 shadow-lg px-8 py-6 text-lg font-semibold"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-slate-900 mb-4">
            Powerful Features
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "AI Analysis",
              description: "Intelligent extraction and structuring with advanced NLP"
            },
            {
              icon: Shield,
              title: "Evidence-Based",
              description: "Current clinical guidelines and best practices"
            },
            {
              icon: Zap,
              title: "Real-Time Insights",
              description: "Smart recommendations for diagnoses and treatments"
            },
            {
              icon: Clock,
              title: "Time Saving",
              description: "Reduce documentation by 60% with AI assistance"
            },
            {
              icon: BarChart3,
              title: "Clinical Intelligence",
              description: "ICD-10 coding and clinical decision support"
            },
            {
              icon: CheckCircle2,
              title: "Quality Assurance",
              description: "Validation and gap identification for completeness"
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 border border-cyan-200 hover:border-cyan-400 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-200"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h4>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-3xl p-12 border border-cyan-500/30 backdrop-blur">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-4xl font-bold text-white">
                Why Healthcare Professionals Choose Notrya AI
              </h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                Built specifically for clinicians, combining cutting-edge AI with clinical expertise to deliver intelligent documentation assistance.
              </p>
              <ul className="space-y-3">
                {[
                  "HIPAA-compliant data handling",
                  "Seamless EHR integration",
                  "Always updated guidelines",
                  "Reduces cognitive burden",
                  "Improves documentation quality"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-200">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-10 blur-2xl"></div>
              <div className="relative bg-slate-800/50 rounded-2xl p-8 border border-cyan-500/30 backdrop-blur">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">60% Faster</p>
                      <p className="text-sm text-slate-400">Clinical documentation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Secure & Compliant</p>
                      <p className="text-sm text-slate-400">Enterprise-grade security</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">AI-Powered</p>
                      <p className="text-sm text-slate-400">Latest AI technology</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69876015478a19e360c5e3ea/2b9f784ba_ChatGPTImageFeb16202605_16_02PM.png" 
                alt="Notrya AI" 
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-white">Notrya AI</span>
            </div>
            <p className="text-sm text-slate-400">&copy; 2024 Notrya AI. All rights reserved. HIPAA Compliant • SOC 2 Certified</p>
          </div>
        </div>
      </footer>
    </div>
  );
}