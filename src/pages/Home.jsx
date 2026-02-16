import React from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import {
  Stethoscope,
  Sparkles,
  Shield,
  Zap,
  Clock,
  BarChart3,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MedScribe</h1>
          </div>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">AI-Powered Clinical Documentation</span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
            Clinical Documentation
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              Made Intelligent
            </span>
          </h2>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            MedScribe is your AI-powered clinical assistant designed to streamline medical documentation, provide evidence-based recommendations, and enhance patient care through intelligent analysis.
          </p>

          <Button
            onClick={() => base44.auth.redirectToLogin()}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2 shadow-lg px-8 py-6 text-lg"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-slate-900 text-center mb-16">
          Powerful Features for Modern Medicine
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: "AI-Powered Analysis",
              description: "Intelligent extraction and structuring of clinical data with advanced NLP"
            },
            {
              icon: Shield,
              title: "Evidence-Based Guidance",
              description: "Access to current clinical guidelines and best practice recommendations"
            },
            {
              icon: Zap,
              title: "Real-Time Suggestions",
              description: "Smart recommendations for diagnoses, medications, and treatment plans"
            },
            {
              icon: Clock,
              title: "Time Saving",
              description: "Reduce documentation time by 60% with AI assistance and templates"
            },
            {
              icon: BarChart3,
              title: "Clinical Insights",
              description: "Comprehensive analysis including ICD-10 coding and clinical decision support"
            },
            {
              icon: CheckCircle2,
              title: "Quality Assurance",
              description: "Built-in validation and gap identification for complete documentation"
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-slate-900">
              Why Choose MedScribe?
            </h3>
            <p className="text-lg text-slate-600">
              Built specifically for healthcare professionals, MedScribe combines cutting-edge AI with clinical expertise to deliver the most intelligent documentation assistant on the market.
            </p>
            <div className="space-y-4">
              {[
                "HIPAA-compliant and secure patient data handling",
                "Works with existing EHR systems and workflows",
                "Continuously updated with latest clinical guidelines",
                "24/7 availability for your documentation needs",
                "Reduces cognitive burden on healthcare providers",
                "Improves documentation accuracy and completeness"
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 border border-blue-200">
            <div className="bg-white rounded-xl p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Fast Documentation</p>
                  <p className="text-sm text-slate-500">60% faster note creation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Secure & Compliant</p>
                  <p className="text-sm text-slate-500">Enterprise-grade security</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">AI-Powered</p>
                  <p className="text-sm text-slate-500">Latest AI technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
          <h3 className="text-4xl font-bold">
            Ready to Transform Your Documentation?
          </h3>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join healthcare professionals already using MedScribe to revolutionize their clinical documentation process.
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            size="lg"
            className="bg-white hover:bg-slate-100 text-blue-600 hover:text-blue-700 gap-2 shadow-lg px-8 py-6 text-lg font-semibold"
          >
            Sign In Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">MedScribe</span>
              </div>
              <p className="text-sm text-slate-400">
                Clinical AI Assistant for modern healthcare professionals
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex items-center justify-between text-sm text-slate-400">
            <p>&copy; 2024 MedScribe. All rights reserved.</p>
            <p>HIPAA Compliant • SOC 2 Certified</p>
          </div>
        </div>
      </footer>
    </div>
  );
}