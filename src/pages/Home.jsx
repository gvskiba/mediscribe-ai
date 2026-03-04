import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";

const T = {
  navy: "#050f1e",
  slate: "#0b1d35",
  panel: "#0e2340",
  edge: "#162d4f",
  border: "#1e3a5f",
  muted: "#2a4d72",
  dim: "#4a7299",
  text: "#c8ddf0",
  bright: "#e8f4ff",
  teal: "#00d4bc",
  teal2: "#00a896",
  amber: "#f5a623",
  red: "#ff5c6c",
  green: "#2ecc71",
  purple: "#9b6dff",
};

const FEATURES = [
  { icon: "🎙️", title: "AI Clinical Scribe", desc: "Real-time ambient documentation. Notrya AI listens, structures, and drafts complete SOAP notes, H&Ps, and discharge summaries — hands-free.", badge: "Most Used", badgeColor: T.teal, accent: T.teal },
  { icon: "🧠", title: "Clinical Decision Support", desc: "Evidence-based recommendations at the point of care. Drug interactions, differential diagnoses, and guideline alerts — delivered in context.", accent: T.purple },
  { icon: "🔬", title: "Clinical Calculators", desc: "15+ validated scoring tools — HEART, Wells, GCS, NIHSS, CURB-65, qSOFA, and more. Integrated with patient context, results saved to the encounter.", accent: T.amber },
  { icon: "📰", title: "Medical Intelligence Feed", desc: "Curated, AI-summarized medical news from NEJM, JAMA, AHA, Medscape, WHO, and more — surfaced at the right moment in your workflow.", badge: "Powered by AI", badgeColor: T.purple, accent: "#f472b6" },
  { icon: "💊", title: "Pediatric Dosing Calculator", desc: "Weight-based dosing for 25+ ED medications. Real-time dose, volume, and concentration calculations — with built-in safety caps and clinical pearls.", accent: T.green },
  { icon: "📋", title: "Clinical Guidelines", desc: "AI-powered search across AHA, ACC, IDSA, ACEP, and 40+ specialty societies. Guideline summaries with direct source links — always current.", accent: "#4a90d9" },
];

const STATS = [
  { value: "68%",    label: "Reduction in documentation time",   icon: "⏱", color: T.teal   },
  { value: "2,400+", label: "Active clinician users",            icon: "👩‍⚕️", color: T.purple },
  { value: "4.9/5",  label: "Average provider satisfaction",     icon: "⭐", color: T.amber  },
  { value: "99.97%", label: "Platform uptime SLA",               icon: "🛡️", color: T.green  },
];

const STEPS = [
  { num: "01", icon: "🎙️", title: "Ambient Listening",   desc: "Notrya AI activates when the encounter begins. It listens in the background — capturing the full clinical conversation without interruption.", color: T.teal   },
  { num: "02", icon: "🧠", title: "AI Structuring",       desc: "Speech is converted, clinically structured, and mapped to the correct SOAP fields, ICD-10 codes, and CPT codes — automatically.", color: T.purple },
  { num: "03", icon: "📋", title: "Draft Note Generated", desc: "A complete, formatted clinical note appears in your EMR within seconds. Review, edit, or approve with a single click.", color: T.amber  },
  { num: "04", icon: "✅", title: "Sign & Close",          desc: "Attestation, billing codes, and follow-up orders are pre-populated. Sign the note and move to your next patient — fully documented.", color: T.green  },
];

const TESTIMONIALS = [
  { quote: "Notrya AI has completely changed how I end my shift. I used to spend 90 minutes on notes after hours. Now it's 10.", author: "Dr. J. Rivera", title: "Emergency Medicine Physician", institution: "Regional Medical Center" },
  { quote: "The clinical decision support is unlike anything I've used. It flagged a drug interaction I'd almost missed — for a complex poly-pharmacy patient.", author: "Dr. A. Chen", title: "Internal Medicine Hospitalist", institution: "University Health System" },
  { quote: "The pediatric dosing calculator alone is worth it. Having it integrated with the patient weight in the chart eliminates so many calculation errors.", author: "Dr. M. Okonkwo", title: "Pediatric Emergency Physician", institution: "Children's Hospital Network" },
  { quote: "Notrya AI understands clinical context. The notes it drafts actually read like I wrote them — not like a transcription bot.", author: "NP Sarah K.", title: "Nurse Practitioner, Urgent Care", institution: "FastCare Clinics" },
];

const SECURITY_BADGES = [
  { label: "HIPAA Compliant",   icon: "🛡️", color: T.teal   },
  { label: "SOC 2 Type II",     icon: "🔐", color: T.purple },
  { label: "HL7 FHIR R4",      icon: "🔗", color: T.amber  },
  { label: "HITRUST CSF",       icon: "✅", color: T.green  },
  { label: "256-bit Encrypted", icon: "🔒", color: "#4a90d9"},
  { label: "Pen Tested",        icon: "🧪", color: T.red    },
];

const INTEGRATIONS = ["Epic", "Cerner", "Athenahealth", "DrChrono", "HL7 FHIR R4", "ICD-10", "CPT", "Doximity"];

function NavBar({ user, onLogin, onDashboard, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      background: scrolled ? "rgba(5,15,30,0.97)" : "rgba(5,15,30,0.88)",
      backdropFilter: "blur(18px)",
      borderBottom: `1px solid rgba(30,58,95,0.7)`,
      boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
      transition: "all 0.3s",
      display: "flex", alignItems: "center",
    }}>
      <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="#" style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: T.bright, letterSpacing: "-0.01em" }}>
            Notrya<span style={{ color: T.teal }}> AI</span>
          </span>
          <span style={{ fontSize: 9.5, color: T.dim, fontFamily: "DM Sans, sans-serif", marginTop: -3 }}>by MedNu</span>
        </a>

        {/* Center nav — hidden on mobile */}
        <div className="hidden md:flex" style={{ gap: 28, alignItems: "center" }}>
          {["#features", "#clinical-intelligence", "#workflow", "#security"].map((href, i) => (
            <a key={i} href={href} style={{ fontSize: 13.5, fontWeight: 500, color: T.dim, textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => e.target.style.color = T.text}
              onMouseLeave={e => e.target.style.color = T.dim}
            >{["Features","Clinical AI","Workflow","Security"][i]}</a>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <button onClick={onDashboard} style={{ padding: "8px 18px", borderRadius: 8, background: "transparent", border: `1px solid ${T.border}`, color: T.text, fontSize: 13.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
              >Dashboard</button>
              <button onClick={onLogout} style={{ padding: "8px 18px", borderRadius: 8, background: "transparent", border: `1px solid ${T.border}`, color: T.dim, fontSize: 13.5, cursor: "pointer" }}>Logout</button>
            </>
          ) : (
            <button onClick={onLogin} style={{ padding: "9px 22px", borderRadius: 8, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 700, fontSize: 13.5, cursor: "pointer", border: "none", transition: "all 0.2s", boxShadow: "0 2px 14px rgba(0,212,188,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 22px rgba(0,212,188,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 14px rgba(0,212,188,0.25)"; }}
            >Log In →</button>
          )}
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ user, onLogin, onDashboard }) {
  return (
    <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: "center", position: "relative" }}>
      {/* Badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 20, background: "rgba(0,212,188,0.07)", border: "1px solid rgba(0,212,188,0.25)", color: T.teal, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 32 }}>
        ✦ Introducing Notrya AI by MedNu
      </div>

      {/* Headline */}
      <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(42px, 6.5vw, 76px)", fontWeight: 700, lineHeight: 1.1, color: T.bright, margin: "0 auto 16px", maxWidth: 900 }}>
        Clinical Intelligence<br />
        <span style={{ background: "linear-gradient(135deg, #00d4bc, #9b6dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Reimagined.
        </span>
      </h1>

      {/* Sub */}
      <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#7aa8cc", lineHeight: 1.75, maxWidth: 640, margin: "0 auto 42px", fontWeight: 400 }}>
        Notrya AI is the clinical intelligence platform built for modern providers — combining AI-powered documentation, real-time decision support, and predictive insights to let you focus on what matters most: your patients.
      </p>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
        {user ? (
          <button onClick={onDashboard} style={{ padding: "14px 34px", borderRadius: 11, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 4px 28px rgba(0,212,188,0.3)", transition: "all 0.22s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 36px rgba(0,212,188,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 28px rgba(0,212,188,0.3)"; }}
          >Go to Dashboard →</button>
        ) : (
          <button onClick={onLogin} style={{ padding: "14px 34px", borderRadius: 11, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 4px 28px rgba(0,212,188,0.3)", transition: "all 0.22s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 36px rgba(0,212,188,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 28px rgba(0,212,188,0.3)"; }}
          >Log In to Notrya AI →</button>
        )}
        <button style={{ padding: "13px 28px", borderRadius: 11, background: "transparent", color: T.text, fontWeight: 600, fontSize: 15, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
        >▷ Request a Demo</button>
      </div>

      {/* Social proof */}
      <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", fontSize: 11.5, color: T.dim, fontWeight: 600 }}>
        {[["🛡️","HIPAA Compliant"],["🔐","SOC 2 Type II"],["👥","Trusted by 2,400+ Clinicians"],["⭐","4.9 / 5 Provider Rating"]].map(([icon,txt],i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>{icon} {txt}</span>
        ))}
      </div>

      {/* Dashboard mockup placeholder */}
      <div style={{ marginTop: 72, maxWidth: 960, margin: "72px auto 0", borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: "0 32px 80px rgba(0,0,0,0.55)", overflow: "hidden", background: T.panel }}>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, background: T.slate }}>
          {["#ff5c6c","#f5a623","#2ecc71"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
          <span style={{ fontSize: 11, color: T.dim, marginLeft: 8, fontFamily: "JetBrains Mono, monospace" }}>notryaai.com/dashboard</span>
        </div>
        <div style={{ padding: "40px 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {["🫀 Vital Signs","📋 Clinical Note","🧠 AI Analysis","💊 Medications","🔬 Labs & Imaging","📊 Decision Support"].map((label,i) => (
            <div key={i} style={{ background: T.edge, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", fontSize: 12, color: T.text, fontWeight: 500 }}>{label}</div>
          ))}
        </div>
        <div style={{ padding: "14px 32px 28px", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, height: 4, background: T.edge, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: "72%", height: "100%", background: `linear-gradient(90deg, ${T.teal}, ${T.purple})`, borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>AI Note: 72% complete</span>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <div style={{ padding: "28px 24px", borderTop: `1px solid rgba(30,58,95,0.6)`, borderBottom: `1px solid rgba(30,58,95,0.6)`, background: "rgba(11,29,53,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Trusted by leading health systems</span>
      {["Health System A","Health System B","Health System C","Health System D","Health System E"].map((name,i) => (
        <div key={i} style={{ padding: "6px 18px", borderRadius: 7, background: T.edge, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 600 }}>{name}</div>
      ))}
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Built for Clinicians</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(30px, 4vw, 44px)", color: T.bright, lineHeight: 1.2, marginBottom: 16 }}>Everything your clinical team needs,<br />powered by AI.</h2>
          <p style={{ fontSize: 15, color: "#7aa8cc", maxWidth: 560, margin: "0 auto" }}>Notrya AI integrates seamlessly into your existing workflow — from the first patient contact to final documentation.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, transition: "all 0.22s", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = f.accent; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${f.accent}18`, border: `1px solid ${f.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{f.icon}</div>
                {f.badge && <span style={{ fontSize: 9.5, padding: "2px 8px", borderRadius: 4, background: `${f.badgeColor}15`, color: f.badgeColor, fontWeight: 700, border: `1px solid ${f.badgeColor}25` }}>{f.badge}</span>}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.bright, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: T.dim, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClinicalIntelligenceSection() {
  return (
    <section id="clinical-intelligence" style={{ padding: "100px 24px", background: "rgba(11,29,53,0.4)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        {/* Visual */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, position: "relative" }}>
          <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>AI Clinical Panel</div>
          {["chief_complaint","history_of_present_illness","assessment","plan"].map((field, i) => (
            <div key={i} style={{ background: T.edge, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: T.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{field.replace(/_/g," ")}</div>
              <div style={{ height: 8, background: T.muted, borderRadius: 4, opacity: 0.4, width: ["85%","92%","70%","88%"][i] }} />
            </div>
          ))}
          {/* Floating cards */}
          <div style={{ position: "absolute", bottom: -16, right: -16, background: T.slate, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: T.teal, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
            ✦ AI Summary Generated <strong style={{ color: T.bright }}>0.8s</strong>
          </div>
          <div style={{ position: "absolute", top: -16, left: -16, background: T.slate, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: T.purple, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
            🧠 DDx Confidence <strong style={{ color: T.bright }}>94%</strong>
          </div>
        </div>

        {/* Text */}
        <div>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Clinical Intelligence Reimagined</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(30px, 4vw, 46px)", color: T.bright, lineHeight: 1.15, marginBottom: 18 }}>AI that thinks<br />like a clinician.</h2>
          <p style={{ fontSize: 15, color: "#7aa8cc", lineHeight: 1.8, marginBottom: 28 }}>Notrya AI is trained on millions of clinical encounters, peer-reviewed literature, and evidence-based guidelines. It doesn't just transcribe — it reasons, flags risks, surfaces differentials, and proactively suggests next steps based on your specific patient context.</p>
          {[
            "Real-time ambient AI documentation — no clicking, no dictating",
            "Contextual alerts — drug interactions, allergy conflicts, guideline deviations",
            "Differential diagnosis engine trained on 50M+ clinical cases",
            "Predictive risk scoring — early warning for sepsis, deterioration, readmission",
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, fontSize: 14, color: T.text, lineHeight: 1.65 }}>
              <span style={{ color: T.teal, flexShrink: 0, marginTop: 2 }}>✦</span>{b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>How Notrya AI Works</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 4vw, 42px)", color: T.bright, lineHeight: 1.2, marginBottom: 14 }}>From first contact to signed note<br />in minutes — not hours.</h2>
          <p style={{ fontSize: 15, color: "#7aa8cc", maxWidth: 520, margin: "0 auto" }}>Notrya AI fits into your existing EMR and workflow. No new hardware. No learning curve.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, position: "relative" }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: "28px 24px", position: "relative" }}>
              <div style={{ fontSize: 10, color: s.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.bright, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.7 }}>{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 1, background: `rgba(0,212,188,0.2)`, zIndex: 1 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section id="stats" style={{ padding: "80px 24px", background: "rgba(0,212,188,0.03)", borderTop: `1px solid rgba(30,58,95,0.6)`, borderBottom: `1px solid rgba(30,58,95,0.6)` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 32, color: T.bright, textAlign: "center", marginBottom: 56 }}>Measurable impact for every practice.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "32px 24px", borderRadius: 14, background: T.panel, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 48, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 10 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="testimonials" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Clinician Stories</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 4vw, 42px)", color: T.bright, lineHeight: 1.2 }}>What providers are saying<br />about Notrya AI.</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: T.panel, border: `1px solid ${i === active ? "rgba(0,212,188,0.3)" : T.border}`, borderRadius: 14, padding: 28, transition: "border-color 0.4s" }}>
              <div style={{ fontSize: 18, marginBottom: 12 }}>{"★".repeat(5)}<span style={{ color: T.amber }}/></div>
              <p style={{ fontSize: 14, color: T.text, lineHeight: 1.75, fontStyle: "italic", marginBottom: 20 }}>"{t.quote}"</p>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <div style={{ fontSize: 13, color: T.bright, fontWeight: 600 }}>{t.author}</div>
                <div style={{ fontSize: 11.5, color: T.dim }}>{t.title}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{t.institution}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  return (
    <section id="integrations" style={{ padding: "80px 24px", background: "rgba(11,29,53,0.4)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Plug-and-play integrations</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(26px, 3.5vw, 38px)", color: T.bright, lineHeight: 1.2, marginBottom: 12 }}>Works with your existing stack.</h2>
          <p style={{ fontSize: 15, color: "#7aa8cc", maxWidth: 500, margin: "0 auto" }}>Notrya AI connects to the EMRs, PACS, and health systems your team already uses.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {INTEGRATIONS.map((name, i) => (
            <div key={i} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 11, padding: "14px 22px", fontSize: 13, fontWeight: 600, color: T.text, transition: "border-color 0.15s", cursor: "default" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.teal}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >{name}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Enterprise-Grade Security</div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(28px, 4vw, 44px)", color: T.bright, lineHeight: 1.15, marginBottom: 18 }}>Built for healthcare.<br />Secured from the ground up.</h2>
          <p style={{ fontSize: 15, color: "#7aa8cc", lineHeight: 1.8, marginBottom: 28 }}>Notrya AI is designed with HIPAA compliance at its core. Every piece of patient data is encrypted, access-controlled, and audited. MedNu undergoes annual third-party security assessments and maintains SOC 2 Type II certification.</p>
          {["AES-256 encryption at rest and in transit","HIPAA BAA provided to all customers","SOC 2 Type II certified — full audit report available","Complete audit trail for every clinical action","HITRUST CSF framework alignment","HL7 FHIR R4 compliant data exchange"].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13.5, color: T.text }}>
              <span>{["🔐","🛡️","📋","🔍","🌐","🏥"][i]}</span>{b}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SECURITY_BADGES.map((b, i) => (
            <div key={i} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 18px", textAlign: "center", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = b.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ user, onLogin, onDashboard }) {
  return (
    <section id="cta" style={{ padding: "100px 24px", background: "linear-gradient(135deg, rgba(0,212,188,0.06), rgba(155,109,255,0.06))", borderTop: "1px solid rgba(0,212,188,0.15)", borderBottom: "1px solid rgba(0,212,188,0.1)", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 16px", borderRadius: 20, background: "rgba(0,212,188,0.07)", border: "1px solid rgba(0,212,188,0.25)", color: T.teal, fontSize: 12, fontWeight: 600, marginBottom: 28 }}>
        ✦ Join 2,400+ Clinicians on Notrya AI
      </div>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(32px, 5vw, 56px)", color: T.bright, lineHeight: 1.15, marginBottom: 16 }}>Ready to reimagine your<br />clinical intelligence?</h2>
      <p style={{ fontSize: 16, color: "#7aa8cc", marginBottom: 42 }}>Start with a free demo. No credit card required. Full HIPAA compliance from day one.</p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        {user ? (
          <button onClick={onDashboard} style={{ padding: "14px 36px", borderRadius: 11, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 6px 30px rgba(0,212,188,0.35)", transition: "all 0.2s" }}>Go to Dashboard →</button>
        ) : (
          <button onClick={onLogin} style={{ padding: "14px 36px", borderRadius: 11, background: `linear-gradient(135deg, ${T.teal}, ${T.teal2})`, color: T.navy, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", boxShadow: "0 6px 30px rgba(0,212,188,0.35)", transition: "all 0.2s" }}>Log In →</button>
        )}
        <button style={{ padding: "13px 30px", borderRadius: 11, background: "transparent", color: T.text, fontWeight: 600, fontSize: 15, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
        >Book a Demo</button>
      </div>
      <p style={{ fontSize: 11, color: T.muted, marginTop: 20 }}>By logging in you agree to MedNu's Terms of Service and Privacy Policy.</p>
    </section>
  );
}

function Footer() {
  const cols = [
    { heading: "Product", links: ["Features","Clinical AI","Integrations","Security","Pricing","Changelog"] },
    { heading: "MedNu", links: ["About MedNu","Careers","Press","Contact","Blog"] },
    { heading: "Legal & Support", links: ["Privacy Policy","Terms of Service","HIPAA Policy","BAA Request","Support Center","System Status"] },
  ];

  return (
    <footer style={{ background: "rgba(5,15,30,0.97)", borderTop: `1px solid ${T.border}`, padding: "60px 24px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          {/* Brand col */}
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: T.bright, marginBottom: 4 }}>Notrya<span style={{ color: T.teal }}> AI</span></div>
            <div style={{ fontSize: 10, color: T.dim, marginBottom: 12 }}>by MedNu</div>
            <p style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.65, marginBottom: 16 }}>Clinical Intelligence Reimagined.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["HIPAA", T.teal], ["SOC 2", T.purple]].map(([label, color], i) => (
                <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: `1px solid ${color}30`, color, fontWeight: 700, background: `${color}08` }}>{label}</span>
              ))}
            </div>
          </div>
          {cols.map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.text, marginBottom: 16 }}>{col.heading}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((link, j) => (
                  <a key={j} href="#" style={{ fontSize: 13, color: T.dim, textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => e.target.style.color = T.text}
                    onMouseLeave={e => e.target.style.color = T.dim}
                  >{link}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 11.5, color: T.muted }}>© 2025 MedNu Health Technologies. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy","Terms","HIPAA"].map((l,i) => (
              <a key={i} href="#" style={{ fontSize: 11.5, color: T.muted, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleLogin  = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const handleDash   = () => window.location.href = createPageUrl("Dashboard");
  const handleLogout = () => base44.auth.logout();

  return (
    <div style={{ background: T.navy, color: T.text, fontFamily: "DM Sans, -apple-system, sans-serif", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />

      {/* Background grid + gradients */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(30,58,95,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.18) 1px, transparent 1px)", backgroundSize: "44px 44px", opacity: 0.28 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 10% 0%, rgba(0,168,150,0.09), transparent 55%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 90% 100%, rgba(155,109,255,0.07), transparent 55%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <NavBar user={user} onLogin={handleLogin} onDashboard={handleDash} onLogout={handleLogout} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <HeroSection user={user} onLogin={handleLogin} onDashboard={handleDash} />
        </div>
        <TrustStrip />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <FeaturesSection />
        </div>
        <ClinicalIntelligenceSection />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <WorkflowSection />
        </div>
        <StatsSection />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <TestimonialsSection />
        </div>
        <IntegrationsSection />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <SecuritySection />
        </div>
        <CTASection user={user} onLogin={handleLogin} onDashboard={handleDash} />
        <Footer />
      </div>
    </div>
  );
}