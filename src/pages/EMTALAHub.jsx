import { useState, useRef, useCallback, useEffect } from "react"

// ─── Theme ────────────────────────────────────────────────────────────────────
const mk = (C = {}) => ({
  bg:     C.bg     || "#09111f",
  surf:   C.surf   || "rgba(255,255,255,0.045)",
  surf2:  C.surf2  || "rgba(255,255,255,0.07)",
  border: C.border || "rgba(255,255,255,0.09)",
  teal:   C.teal   || "#00d4b8",
  gold:   C.gold   || "#f0b429",
  red:    C.red    || "#ff4d6d",
  green:  C.green  || "#00e596",
  yellow: C.yellow || "#ffd166",
  text:   C.text   || "#e2e8f4",
  muted:  C.muted  || "#7a8699",
})

// ─── Constants ────────────────────────────────────────────────────────────────
const COMPLAINTS = [
  "Chest Pain","Dyspnea","Abdominal Pain","Headache","Altered Mental Status",
  "Syncope","Stroke Symptoms","Seizure","Back Pain","Fever – Adult",
  "Fever – Pediatric","Palpitations","GI Bleed","Flank Pain",
  "Extremity Injury","Suicidal Ideation","Overdose / Ingestion",
  "Allergic Reaction","Pregnancy-Related","Agitation / Behavioral",
]
const SPECIALTIES = [
  "Cardiology","Neurology","Orthopedics","General Surgery","OB/GYN",
  "Psychiatry","Urology","Pulmonology","Gastroenterology","Vascular Surgery",
  "Ophthalmology","ENT","Pediatrics","Interventional Radiology",
]
const TRANSPORT_MODES = ["Ground BLS","Ground ALS","Air – Helicopter","Air – Fixed Wing","Critical Care Transport"]
const RECORDS_LIST   = ["Triage Note","Nursing Notes","Physician Note","Labs","Imaging CD","EKG","Medication List","Consent Forms","ID / Insurance"]
const TRANSFER_REASONS = [
  "Specialist unavailable at this facility",
  "ICU / higher-level monitoring required",
  "Surgical capability unavailable",
  "Interventional radiology unavailable",
  "Cardiac catheterization lab unavailable",
  "Neurosurgery unavailable",
  "Trauma center level of care required",
  "Burn center required",
  "NICU / maternal-fetal medicine required",
  "Pediatric emergency care required",
  "Psychiatric inpatient facility required",
  "Hyperbaric oxygen therapy required",
  "Facility capacity — no inpatient beds available",
  "Patient / family request — appropriate transfer",
]
const TRANSFER_BENEFITS = [
  "Access to required subspecialty care",
  "Higher-level ICU monitoring available",
  "Surgical intervention available at receiving facility",
  "Interventional / endovascular capability available",
  "Cardiac surgery capability available",
  "Neurosurgical capability available",
  "Definitive treatment available at receiving facility",
  "Improved clinical outcomes expected",
  "NICU / neonatal care available",
  "Burn unit specialized care available",
  "Trauma surgery team available",
  "Pediatric subspecialty expertise available",
  "Inpatient psychiatric treatment available",
  "Comprehensive stroke center capability",
]
const TRANSFER_RISKS = [
  "Hemodynamic instability during transport",
  "Potential for clinical deterioration in transit",
  "Airway compromise risk during transport",
  "Cardiac arrhythmia risk during transport",
  "Neurological deterioration risk",
  "Respiratory compromise during transport",
  "Obstetric complication risk in transit",
  "Increased pain / discomfort during transport",
  "Delay in definitive treatment",
  "Adverse weather / environmental conditions",
  "Equipment / monitoring limitations during transport",
  "Risk of thromboembolic event during prolonged transport",
]
const HARD_RULES = {
  "Chest Pain":          ["12-lead EKG within 10 min of arrival — no exceptions","Serial troponin (minimum ×2)","Vital signs with SpO2"],
  "Stroke Symptoms":     ["CT head without contrast required","Last known well time documented","Point-of-care glucose mandatory","NIHSS documented"],
  "Syncope":             ["12-lead EKG","Orthostatic vital signs","Point-of-care glucose"],
  "GI Bleed":            ["Orthostatic vital signs","IV access documented","Type and screen"],
  "Pregnancy-Related":   ["Fetal heart tones documented in MSE","Gestational age documented","Obstetric history"],
  "Fever – Pediatric":   ["Age <28 days → full sepsis workup is EMTALA floor","Blood cultures before antibiotics if sepsis concern"],
  "Altered Mental Status":["Point-of-care glucose is absolute floor","Vital signs with temperature","Medication reconciliation"],
  "Overdose / Ingestion":["Substance identified or attempted","Acetaminophen level if unknown ingestion","12-lead EKG for cardiac toxicity"],
  "Suicidal Ideation":   ["Medical clearance labs before psychiatric disposition","Capacity assessment documented","Safety assessment completed"],
  "Allergic Reaction":   ["Serial vital signs documented","Epinephrine availability confirmed"],
  "Back Pain":           ["Age >50 or vascular risk factors: AAA must be addressed in MSE","Vital signs including bilateral BP if dissection concern"],
}

// State → default involuntary hold type mapping
const STATE_HOLD_MAP = {
  FL:"Baker Act", CA:"5150 WIC", PA:"302", NJ:"302",
  MN:"M-1", ND:"M-1", SD:"M-1", MT:"M-1",
  TX:"Emergency Detention", MO:"Emergency Detention", AR:"Emergency Detention",
  KY:"Emergency Detention", WV:"Emergency Detention", OK:"Emergency Detention",
  TN:"Emergency Detention", IN:"Emergency Detention", OH:"Emergency Detention",
}
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"]

// ─── Style Helpers ────────────────────────────────────────────────────────────
const glass  = (t, x={}) => ({ background: t.surf, border: `1px solid ${t.border}`, borderRadius: 12, backdropFilter: "blur(12px)", ...x })
const glass2 = (t, x={}) => ({ background: t.surf2, border: `1px solid ${t.border}`, borderRadius: 10, ...x })
const inp    = (t, x={}) => ({ background: "rgba(255,255,255,0.04)", border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: "8px 12px", fontSize: 13, fontFamily: "DM Sans, sans-serif", width: "100%", outline: "none", boxSizing: "border-box", ...x })
const btn    = (t, c, x={}) => ({ background: `${c}22`, border: `1px solid ${c}55`, color: c, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontFamily: "DM Sans, sans-serif", fontWeight: 600, transition: "opacity 0.15s", outline: "none", ...x })
const lbl    = (t) => ({ color: t.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 })
const row    = (x={}) => ({ display: "flex", gap: 10, alignItems: "center", ...x })
const col    = (x={}) => ({ display: "flex", flexDirection: "column", gap: 8, ...x })
const grid2  = (cols, x={}) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, ...x })
const pill   = (t, c, active) => ({ background: active ? `${c}28` : "rgba(255,255,255,0.03)", border: `1px solid ${active ? c : t.border}`, borderRadius: 20, color: active ? c : t.muted, padding: "5px 13px", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 400, outline: "none" })

// ─── Global Focus Styles (injected once) ──────────────────────────────────────
const FOCUS_CSS = `
*:focus-visible { outline: 2px solid #00d4b8 !important; outline-offset: 2px !important; }
input:focus, textarea:focus, select:focus { border-color: #00d4b8 !important; box-shadow: 0 0 0 3px rgba(0,212,184,0.15) !important; outline: none !important; }
button:focus-visible { box-shadow: 0 0 0 3px rgba(0,212,184,0.3) !important; }
`
function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style")
    el.textContent = FOCUS_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])
  return null
}

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 660)
  useEffect(() => {
    const h = () => setM(window.innerWidth < 660)
    window.addEventListener("resize", h)
    return () => window.removeEventListener("resize", h)
  }, [])
  return m
}

// ─── VitalsHub URL param reader ───────────────────────────────────────────────
function readVitalsFromUrl() {
  try {
    const p = new URLSearchParams(window.location.search)
    const v = {}
    ;["hr","bp","rr","spo2","temp","weight","name","age","sex","complaint","esi"].forEach(k => { if (p.get(k)) v[k] = p.get(k) })
    return Object.keys(v).length ? v : null
  } catch { return null }
}

// ─── QuickNote export formatter ───────────────────────────────────────────────
function formatQuickNoteExport({ ctx, emc, disposition, mseDoc, score, attestation }) {
  const lines = [
    `EMTALA DOCUMENTATION — ${new Date().toLocaleString()}`,
    `Patient: ${ctx.name||"Unknown"} | Age: ${ctx.age||"—"} | CC: ${ctx.complaint||"—"} | ESI: ${ctx.esi||"—"}`,
    ``,
    `MSE PERFORMED: Yes`,
    `EMC: ${emc||"Not documented"}`,
    `Disposition: ${disposition||"Pending"}`,
    `MSE Adequacy: ${score||0}%`,
    ``,
  ]
  if (mseDoc) lines.push(`MSE DOCUMENTATION:`, mseDoc, ``)
  if (attestation) lines.push(`ATTESTATION:`, attestation, ``)
  lines.push(`[Generated by Notrya EMTALA Hub — 42 CFR §489.24]`)
  return lines.join("\n")
}

// ─── Shared Components ────────────────────────────────────────────────────────
function PanicBanner({ banners, dismiss, t }) {
  if (!banners.length) return null
  return (
    <div style={col({ gap: 6, marginBottom: 12 })}>
      {banners.map((b, i) => (
        <div key={i} style={{ ...glass(t), background: `${t.red}14`, borderColor: `${t.red}55`, padding: "10px 16px", ...row({ justifyContent: "space-between" }) }}>
          <div style={row({ gap: 8 })}>
            <span style={{ fontSize: 16 }}>🚨</span>
            <strong style={{ color: t.red, fontSize: 13 }}>{b.title}</strong>
            <span style={{ color: t.text, fontSize: 12 }}>{b.msg}</span>
          </div>
          <button onClick={() => dismiss(i)} style={btn(t, t.red, { padding: "3px 10px", fontSize: 11 })}>Dismiss</button>
        </div>
      ))}
    </div>
  )
}

function ConfFlag({ level, t }) {
  const M = { green: [t.green, "✓ Compliant"], yellow: [t.yellow, "⚠ Gap Identified"], red: [t.red, "✕ Violation Risk"], gray: [t.muted, "○ In Progress"] }
  const [c, label] = M[level] || M.gray
  return <span style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 20, padding: "3px 12px", color: c, fontSize: 12, fontWeight: 700, fontFamily: "DM Sans, sans-serif" }}>{label}</span>
}

function Checkbox({ checked, onChange, label, t, danger }) {
  const c = danger ? t.red : t.teal
  const id = useRef(`cb_${Math.random().toString(36).slice(2)}`)
  return (
    <div style={row({ gap: 8 })}>
      <div style={{ position: "relative", width: 17, height: 17, flexShrink: 0 }}>
        <input
          id={id.current} type="checkbox" checked={checked} onChange={onChange}
          style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", margin: 0, cursor: "pointer", zIndex: 1 }}
        />
        <div style={{ width: 17, height: 17, borderRadius: 4, background: checked ? c : "transparent", border: `2px solid ${checked ? c : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {checked && <span style={{ color: "#09111f", fontSize: 10, fontWeight: 900 }}>✓</span>}
        </div>
      </div>
      <label htmlFor={id.current} style={{ color: danger ? t.red : t.text, fontSize: 13, fontFamily: "DM Sans, sans-serif", cursor: "pointer", lineHeight: 1.4 }}>{label}</label>
    </div>
  )
}

function SectionH({ title, t }) {
  return <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 6, marginBottom: 12, color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 14, fontWeight: 700 }}>{title}</div>
}

// Keyboard-navigable chip group — arrow keys cycle within group, Space/Enter selects
function ChipGroup({ options, value, onChange, color, t, multi = false }) {
  const refs = useRef([])
  const isActive = (o) => multi ? (Array.isArray(value) && value.includes(o)) : value === o
  const handleKey = (e, i) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); refs.current[(i + 1) % options.length]?.focus() }
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); refs.current[(i - 1 + options.length) % options.length]?.focus() }
    if (e.key === " " || e.key === "Enter")               { e.preventDefault(); onChange(options[i]) }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group">
      {options.map((o, i) => (
        <button
          key={o} ref={el => refs.current[i] = el}
          role={multi ? "checkbox" : "radio"}
          aria-checked={isActive(o)}
          onClick={() => onChange(o)}
          onKeyDown={e => handleKey(e, i)}
          style={pill(t, color, isActive(o))}
        >{o}</button>
      ))}
    </div>
  )
}

function Meter({ score, t }) {
  const c = score >= 90 ? t.green : score >= 70 ? t.yellow : t.red
  const level = score >= 90 ? "green" : score >= 70 ? "yellow" : "red"
  return (
    <div>
      <div style={row({ justifyContent: "space-between", marginBottom: 6 })}>
        <span style={{ color: t.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>MSE Adequacy</span>
        <span style={{ color: c, fontSize: 18, fontWeight: 900, fontFamily: "Playfair Display, serif" }}>{score}%</span>
      </div>
      <div style={{ background: t.border, borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ background: c, width: `${score}%`, height: "100%", borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ marginTop: 8 }}><ConfFlag level={level} t={t} /></div>
    </div>
  )
}

// "Now" button for time inputs
function NowBtn({ onNow, t }) {
  const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` }
  return (
    <button
      type="button"
      onClick={() => onNow(now())}
      title="Insert current time (N)"
      style={{ ...btn(t, t.teal, { padding: "4px 8px", fontSize: 11, flexShrink: 0 }) }}
    >Now</button>
  )
}

// Time field row = input + Now button
function TimeField({ label: lbl2, value, onChange, t }) {
  const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` }
  return (
    <div>
      <span style={lbl(t)}>{lbl2}</span>
      <div style={row({ gap: 6, marginTop: 4 })}>
        <input style={{ ...inp(t, { flex: 1 }), width: "auto" }} type="time" value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "n" || e.key === "N") { e.preventDefault(); onChange(now()) } }} />
        <NowBtn onNow={onChange} t={t} />
      </div>
    </div>
  )
}

// ─── Claude API Helper ────────────────────────────────────────────────────────
async function callClaude(system, userMsg) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: userMsg }] }),
  })
  const d = await r.json()
  return d.content?.map(c => c.text || "").join("") || ""
}

// ─── Triage-to-MSE Timer ─────────────────────────────────────────────────────
function MseTimer({ arrivalTime, mseComplete, mseTime, addBanner, t }) {
  const [elapsed, setElapsed]   = useState(null)
  const [frozen,  setFrozen]    = useState(null)
  const banneredRef             = useRef(false)

  const parseMinutes = (timeStr) => {
    if (!timeStr) return null
    const [h, m] = timeStr.split(":").map(Number)
    if (isNaN(h) || isNaN(m)) return null
    const now = new Date()
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
    return Math.floor((now - base) / 60000)
  }

  useEffect(() => {
    if (mseComplete && frozen === null) {
      const mins = mseTime ? parseMinutes(arrivalTime) : elapsed
      setFrozen(mins ?? elapsed ?? 0)
      banneredRef.current = false
    }
    if (!mseComplete) { setFrozen(null); banneredRef.current = false }
  }, [mseComplete])

  useEffect(() => {
    if (mseComplete) return
    const tick = () => {
      const mins = parseMinutes(arrivalTime)
      setElapsed(mins)
      if (mins !== null && mins >= 30 && !banneredRef.current) {
        banneredRef.current = true
        addBanner({ title: "MSE Delay — 30+ Minutes", msg: `Patient arrived ${mins} min ago. MSE not yet documented. CMS scrutinizes triage-to-MSE delays.` })
      }
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [arrivalTime, mseComplete])

  const display = mseComplete ? frozen : elapsed
  if (!arrivalTime) return (
    <div style={{ ...glass(t, { padding: 14 }), background: `${t.muted}0a`, borderColor: `${t.muted}33` }}>
      <div style={row({ gap: 10 })}>
        <span style={{ fontSize: 22 }}>⏱</span>
        <div>
          <div style={{ color: t.muted, fontSize: 13, fontWeight: 700 }}>Triage-to-MSE Timer</div>
          <div style={{ color: t.muted, fontSize: 11 }}>Enter arrival time in the Patient bar to start the timer</div>
        </div>
      </div>
    </div>
  )
  if (display === null) return null

  const color  = mseComplete ? t.green : display < 15 ? t.green : display < 30 ? t.yellow : t.red
  const status = mseComplete
    ? `MSE Documented — ${display} min from arrival`
    : display < 15 ? "On Track"
    : display < 30 ? "Approaching Threshold — document MSE soon"
    : "⚠ 30-Minute Threshold Exceeded — CMS scrutiny zone"

  const pct = Math.min((display / 45) * 100, 100)

  return (
    <div style={{ ...glass(t, { padding: 14 }), background: `${color}0e`, borderColor: `${color}44` }}>
      <div style={row({ justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 })}>
        <div style={row({ gap: 10 })}>
          <span style={{ fontSize: 22 }}>⏱</span>
          <div>
            <div style={{ color: t.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Triage-to-MSE</div>
            <div style={{ color, fontSize: 11, fontWeight: 600 }}>{status}</div>
          </div>
        </div>
        <div style={{ color, fontSize: 38, fontWeight: 900, fontFamily: "Playfair Display, serif", lineHeight: 1 }}>
          {display}<span style={{ fontSize: 16, fontWeight: 600 }}> min</span>
        </div>
      </div>
      <div style={{ background: `${t.border}`, borderRadius: 999, height: 6, overflow: "hidden" }}>
        <div style={{ background: color, width: `${pct}%`, height: "100%", borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <div style={row({ gap: 16, marginTop: 6 })}>
        {[{ label: "Green Zone", range: "< 15 min", c: t.green }, { label: "Yellow Zone", range: "15–30 min", c: t.yellow }, { label: "CMS Zone", range: "> 30 min", c: t.red }].map(z => (
          <div key={z.label} style={row({ gap: 4 })}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: z.c, flexShrink: 0 }} />
            <span style={{ color: t.muted, fontSize: 10 }}>{z.label} {z.range}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 1: Visit Checklist ───────────────────────────────────────────────────
function VisitChecklist({ ctx, t, addBanner, addToAudit, hosp = {}, training = false }) {
  const mobile = useIsMobile()
  const [v, setV] = useState({
    arrived: false, mse: false, qmp: "", mseTime: "", emc: "", emcDesc: "", stabilized: false, disposition: "",
    pregnant: false, psych: false, peds: false, lwbsOffer: false, amaRisks: false, amaConsent: false,
    obFht: false, obFhtTime: "", obGa: "", obEdd: "", obRom: false, obContracting: "", obContractionFreq: "",
    obCervical: "", obCrowning: false, obObMd: "", obObMdTime: "", obDeliveryImm: "",
    psychClearanceLabs: false, psychCapacity: "", psychVoluntary: "", psychSafetyAssess: false,
    psychHold: "", psychMedClearMd: "",
  })
  const [override, setOverride] = useState("")
  const [saved, setSaved] = useState(false)
  const set = (k, val) => setV(p => ({ ...p, [k]: val }))
  const tog = k => setV(p => ({ ...p, [k]: !p[k] }))

  const score = () => {
    const pts = [v.arrived, v.mse, !!v.qmp, !!v.mseTime, !!v.emc, (v.stabilized || v.emc === "No"), !!v.disposition]
    return Math.round(pts.filter(Boolean).length / pts.length * 100)
  }
  const s = score()
  const level = s === 100 ? "green" : s >= 70 ? "yellow" : "red"

  const handleDisposit = () => {
    if (s < 90) addBanner({ title: "EMTALA Checklist Incomplete", msg: `Adequacy ${s}% — complete checklist or document clinical override before disposition.` })
  }
  const handleSave = () => {
    addToAudit({ time: new Date().toLocaleTimeString(), patient: ctx.name || "Unknown", complaint: ctx.complaint || "—", disposition: v.disposition || "Pending", score: s, level })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={col({ gap: 14 })}>
      <div style={row({ justifyContent: "space-between" })}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: t.text }}>EMTALA Visit Checklist</div>
        <ConfFlag level={level} t={t} />
      </div>

      <MseTimer arrivalTime={ctx.arrivalTime} mseComplete={v.mse} mseTime={v.mseTime} addBanner={addBanner} t={t} />

      <div style={grid2(mobile ? 1 : 2)}>
        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="Arrival & MSE" t={t} />
            <div style={col({ gap: 10 })}>
              <Checkbox checked={v.arrived} onChange={() => tog("arrived")} label="Patient arrived via dedicated Emergency Department" t={t} />
              <Checkbox checked={v.mse} onChange={() => tog("mse")} label="Medical Screening Examination (MSE) performed" t={t} />
              <div style={grid2(2)}>
                <div><span style={lbl(t)}>QMP Performing MSE</span><input style={inp(t)} placeholder="Physician name" value={v.qmp} onChange={e => set("qmp", e.target.value)} /></div>
                <TimeField label="MSE Timestamp" value={v.mseTime} onChange={val => set("mseTime", val)} t={t} />
              </div>
              <div>
                <span style={lbl(t)}>Emergency Medical Condition (EMC)?</span>
                <div style={{ marginTop: 4 }}>
                  <ChipGroup options={["Yes","No","Undetermined"]} value={v.emc} onChange={o => set("emc", o)} color={v.emc === "Yes" ? t.red : v.emc === "No" ? t.green : t.yellow} t={t} />
                </div>
              </div>
              {v.emc === "Yes" && <>
                <div><span style={lbl(t)}>EMC Description</span><input style={inp(t)} placeholder="Describe the emergency medical condition" value={v.emcDesc} onChange={e => set("emcDesc", e.target.value)} /></div>
                <Checkbox checked={v.stabilized} onChange={() => tog("stabilized")} label="Stabilization documented prior to disposition" t={t} />
              </>}
            </div>
          </div>

          <div style={glass(t, { padding: 16 })}>
            <SectionH title="Special Populations" t={t} />
            <div style={col({ gap: 8 })}>
              <Checkbox checked={v.pregnant || !!ctx.Pregnant} onChange={() => tog("pregnant")} label="Pregnant patient" t={t} />
              <Checkbox checked={v.psych} onChange={() => tog("psych")} label="Psychiatric patient" t={t} />
              <Checkbox checked={v.peds} onChange={() => tog("peds")} label="Pediatric patient — age-appropriate MSE performed" t={t} />
            </div>
          </div>

          {(v.pregnant || ctx.Pregnant) && (
            <div style={{ ...glass(t, { padding: 16 }), borderColor: `${t.gold}44`, background: `${t.gold}08` }}>
              <SectionH title="⚕ OB / Labor EMTALA Module" t={t} />
              <div style={col({ gap: 10 })}>
                <div style={grid2(2)}>
                  <div><span style={lbl(t)}>Gestational Age (weeks)</span><input style={inp(t)} placeholder="e.g. 32" value={v.obGa} onChange={e => set("obGa", e.target.value)} /></div>
                  <div><span style={lbl(t)}>Estimated Due Date</span><input style={inp(t)} type="date" value={v.obEdd} onChange={e => set("obEdd", e.target.value)} /></div>
                </div>
                <div style={grid2(2)}>
                  <Checkbox checked={v.obFht} onChange={() => tog("obFht")} label="Fetal heart tones documented in MSE" t={t} />
                  <TimeField label="FHT Timestamp" value={v.obFhtTime} onChange={val => set("obFhtTime", val)} t={t} />
                </div>
                <Checkbox checked={v.obRom} onChange={() => tog("obRom")} label="Rupture of membranes documented" t={t} />
                <div>
                  <span style={lbl(t)}>Contracting?</span>
                  <div style={{ marginTop: 4 }}><ChipGroup options={["Yes","No","Irregular"]} value={v.obContracting} onChange={o => set("obContracting", o)} color={t.gold} t={t} /></div>
                </div>
                {v.obContracting === "Yes" && (
                  <div><span style={lbl(t)}>Contraction Frequency</span><input style={inp(t)} placeholder="e.g. every 3 min" value={v.obContractionFreq} onChange={e => set("obContractionFreq", e.target.value)} /></div>
                )}
                <div><span style={lbl(t)}>Cervical Exam (if performed)</span><input style={inp(t)} placeholder="Dilation / effacement / station" value={v.obCervical} onChange={e => set("obCervical", e.target.value)} /></div>
                <Checkbox checked={v.obCrowning} onChange={() => tog("obCrowning")} label="Crowning / delivery imminent — transfer contraindicated" t={t} danger />
                {v.obCrowning && (
                  <div style={{ ...glass2(t, { padding: 10 }), background: `${t.red}14`, borderColor: `${t.red}55` }}>
                    <span style={{ color: t.red, fontSize: 12, fontWeight: 700 }}>⚠ EMTALA prohibits transfer of a patient with imminent delivery. Deliver on site and stabilize before any transfer consideration.</span>
                  </div>
                )}
                <div>
                  <span style={lbl(t)}>Delivery Imminent Assessment</span>
                  <div style={{ marginTop: 4 }}><ChipGroup options={["Not imminent","Possibly imminent","Imminent — delivering on site"]} value={v.obDeliveryImm} onChange={o => set("obDeliveryImm", o)} color={t.gold} t={t} /></div>
                </div>
                <div style={grid2(2)}>
                  <div><span style={lbl(t)}>OB Physician Notified</span><input style={inp(t)} placeholder="Physician name" value={v.obObMd} onChange={e => set("obObMd", e.target.value)} /></div>
                  <TimeField label="Notification Time" value={v.obObMdTime} onChange={val => set("obObMdTime", val)} t={t} />
                </div>
              </div>
            </div>
          )}

          {v.psych && (
            <div style={{ ...glass(t, { padding: 16 }), borderColor: `${t.teal}44`, background: `${t.teal}08` }}>
              <SectionH title="⚕ Psychiatric EMTALA Module" t={t} />
              <div style={col({ gap: 10 })}>
                {hosp.state && STATE_HOLD_MAP[hosp.state] && !v.psychHold && (
                  <div style={{ ...glass2(t, { padding: "8px 12px" }), borderColor: `${t.gold}44`, background: `${t.gold}08` }}>
                    <span style={{ color: t.gold, fontSize: 11 }}>💡 {hosp.state} detected — suggested hold type: </span>
                    <button onClick={() => set("psychHold", STATE_HOLD_MAP[hosp.state])} style={btn(t, t.gold, { padding: "2px 10px", fontSize: 11, marginLeft: 6 })}>
                      Use {STATE_HOLD_MAP[hosp.state]}
                    </button>
                  </div>
                )}
                <Checkbox checked={v.psychClearanceLabs} onChange={() => tog("psychClearanceLabs")} label="Medical clearance labs completed before psychiatric disposition" t={t} />
                <Checkbox checked={v.psychSafetyAssess} onChange={() => tog("psychSafetyAssess")} label="Safety assessment documented (SI/HI/self-harm risk)" t={t} />
                <div>
                  <span style={lbl(t)}>Decision-Making Capacity</span>
                  <div style={{ marginTop: 4 }}><ChipGroup options={["Intact","Impaired","Unable to assess"]} value={v.psychCapacity} onChange={o => set("psychCapacity", o)} color={t.teal} t={t} /></div>
                </div>
                <div>
                  <span style={lbl(t)}>Voluntary vs. Involuntary Status</span>
                  <div style={{ marginTop: 4 }}><ChipGroup options={["Voluntary","Involuntary — hold placed","Pending evaluation"]} value={v.psychVoluntary} onChange={o => set("psychVoluntary", o)} color={t.teal} t={t} /></div>
                </div>
                {v.psychVoluntary?.includes("Involuntary") && (
                  <div>
                    <span style={lbl(t)}>Involuntary Hold Type</span>
                    <div style={{ marginTop: 4 }}><ChipGroup options={["Baker Act","5150 WIC","302","M-1","Emergency Detention","State Equivalent"]} value={v.psychHold} onChange={o => set("psychHold", o)} color={t.yellow} t={t} /></div>
                  </div>
                )}
                <div><span style={lbl(t)}>Medical Clearance Attestation By</span><input style={inp(t)} placeholder="Physician name" value={v.psychMedClearMd} onChange={e => set("psychMedClearMd", e.target.value)} /></div>
                <div style={{ ...glass2(t, { padding: 10 }), borderColor: `${t.teal}33` }}>
                  <span style={{ color: t.teal, fontSize: 11 }}>Note: EMTALA applies to psychiatric emergency departments. Medical clearance labs are mandatory before psychiatric facility transfer under most CMS interpretive guidelines.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="Disposition" t={t} />
            <div style={col({ gap: 10 })}>
              <div>
                <span style={lbl(t)}>Select Disposition</span>
                <div style={{ marginTop: 4 }}>
                  <ChipGroup options={["Discharge","Admit","Transfer","AMA","LWBS","Observation"]} value={v.disposition} onChange={d => set("disposition", d)} color={t.teal} t={t} />
                </div>
              </div>
              {v.disposition === "AMA" && <div style={{ ...glass2(t, { padding: 12 }), borderColor: `${t.yellow}44`, background: `${t.yellow}08` }}>
                <Checkbox checked={v.amaRisks} onChange={() => tog("amaRisks")} label="Risks of leaving explained and documented" t={t} />
                <div style={{ marginTop: 8 }}><Checkbox checked={v.amaConsent} onChange={() => tog("amaConsent")} label="AMA form signed or refusal of signature documented" t={t} /></div>
              </div>}
              {v.disposition === "LWBS" && <div style={{ ...glass2(t, { padding: 12 }), borderColor: `${t.yellow}44`, background: `${t.yellow}08` }}>
                <Checkbox checked={v.lwbsOffer} onChange={() => tog("lwbsOffer")} label="MSE offered prior to patient leaving — offer documented" t={t} />
              </div>}
              {v.disposition === "Transfer" && <div style={{ ...glass2(t, { padding: 12 }), borderColor: `${t.teal}44`, background: `${t.teal}08` }}>
                <span style={{ color: t.teal, fontSize: 12 }}>→ Complete the Transfer Form tab for full EMTALA transfer documentation.</span>
              </div>}
            </div>
          </div>

          <div style={glass(t, { padding: 16 })}>
            <SectionH title="MSE Adequacy Score" t={t} />
            <Meter score={s} t={t} />
            {s < 90 && <div style={{ marginTop: 12 }}>
              <span style={lbl(t)}>Override Rationale (required if proceeding with gaps)</span>
              <textarea style={{ ...inp(t), minHeight: 64, resize: "vertical", marginTop: 4 }} placeholder="Document clinical rationale for incomplete checklist..." value={override} onChange={e => setOverride(e.target.value)} />
            </div>}
          </div>

          <div style={col({ gap: 8 })}>
            <div style={row({ gap: 8 })}>
              <button onClick={handleDisposit} style={btn(t, s >= 90 ? t.green : t.yellow, { flex: 1 })}>
                {s >= 90 ? "✓ Clear for Disposition" : "⚠ Flag & Proceed"}
              </button>
              <button onClick={handleSave} style={btn(t, training ? t.yellow : t.teal, { flex: 1 })} title="Save (Ctrl+Enter)">
                {saved ? "✓ Saved" : training ? "🎓 Save to Training Log  ⌃↵" : "Save to Audit Log  ⌃↵"}
              </button>
            </div>
            <button onClick={() => navigator.clipboard.writeText(formatQuickNoteExport({ ctx, emc: v.emc, disposition: v.disposition, score: s }))} style={btn(t, t.muted, { fontSize: 12, width: "100%" })}>
              📋 Copy EMTALA Summary for QuickNote
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: SmartMSE ──────────────────────────────────────────────────────────
function SmartMSE({ ctx, t, markTab, setMseCtx }) {
  const mobile = useIsMobile()
  const [complaint, setComplaint] = useState(ctx.complaint || "")
  const [mods, setMods] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState({})
  const MODS = ["Age >65","Immunocompromised","Anticoagulated","Diabetic","Prior similar visit","Nursing home","Altered baseline"]
  const hard = HARD_RULES[complaint] || []

  const togMod = m => setMods(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])
  const togDone = k => setDone(p => ({ ...p, [k]: !p[k] }))

  const floorItems = result ? [...(result.floor?.history||[]),...(result.floor?.exam||[]),...(result.floor?.labs||[]),...(result.floor?.imaging||[]),...(result.floor?.ancillary||[])] : []
  const score = floorItems.length ? Math.round(floorItems.filter((_,i) => done[`f${i}`]).length / floorItems.length * 100) : 0

  const generate = async () => {
    if (!complaint) return
    setLoading(true); setDone({})
    try {
      const sys = `You are an expert emergency physician and EMTALA compliance specialist. Return ONLY valid JSON — no markdown, no backticks.
Ground all recommendations in: ACEP Clinical Policies, CMS EMTALA Interpretive Guidelines (42 CFR 489.24), "routinely available ancillary services" standard.
Schema:
{"floor":{"history":[],"exam":[],"labs":[],"imaging":[],"ancillary":[]},"standard":{"labs":[],"imaging":[],"ancillary":[]},"cantMiss":[],"emcTriggers":[],"docLanguage":""}`
      const raw = await callClaude(sys, `Chief complaint: ${complaint}\nModifiers: ${mods.join(", ")||"None"}\nAge: ${ctx.age||"unknown"}, Sex: ${ctx.sex||"unknown"}, ESI: ${ctx.esi||"unknown"}`)
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
      setResult(parsed)
      markTab(1, "green")
      setMseCtx({ complaint, docLanguage: parsed.docLanguage || "", cantMiss: parsed.cantMiss || [] })
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const ItemList = ({ items, prefix, color }) => (
    <div style={col({ gap: 6 })}>
      {items?.map((item, i) => {
        const k = `${prefix}${i}`
        return (
          <label key={i} style={row({ cursor: "pointer", gap: 8 })}>
            <div onClick={() => togDone(k)} style={{ width: 15, height: 15, borderRadius: 3, flexShrink: 0, background: done[k] ? color : "transparent", border: `2px solid ${done[k] ? color : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {done[k] && <span style={{ color: "#09111f", fontSize: 9, fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ color: done[k] ? t.muted : t.text, fontSize: 12, fontFamily: "DM Sans, sans-serif", textDecoration: done[k] ? "line-through" : "none" }}>{item}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div style={col({ gap: 14 })}>
      <div style={row({ justifyContent: "space-between", flexWrap: "wrap", gap: 8 })}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: t.text }}>SmartMSE — Workup Recommender</div>
        {result && <Meter score={score} t={t} />}
      </div>

      <div style={glass(t, { padding: 16 })}>
        <SectionH title="Chief Complaint" t={t} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {COMPLAINTS.map(c => <button key={c} onClick={() => setComplaint(c)} style={pill(t, t.teal, complaint === c)}>{c}</button>)}
        </div>
        <input style={inp(t)} placeholder="Or type a custom complaint..." value={complaint} onChange={e => setComplaint(e.target.value)} />
      </div>

      <div style={glass(t, { padding: 16 })}>
        <SectionH title="Risk Modifiers" t={t} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MODS.map(m => <button key={m} onClick={() => togMod(m)} style={pill(t, t.gold, mods.includes(m))}>{m}</button>)}
        </div>
      </div>

      {hard.length > 0 && (
        <div style={{ ...glass(t, { padding: 14 }), background: `${t.red}10`, borderColor: `${t.red}44` }}>
          <SectionH title="⚠ EMTALA Hard Rules — This Complaint" t={t} />
          {hard.map((r, i) => <div key={i} style={row({ gap: 8, marginBottom: 4 })}><span style={{ color: t.red }}>◆</span><span style={{ color: t.text, fontSize: 12 }}>{r}</span></div>)}
        </div>
      )}

      <button onClick={generate} disabled={!complaint || loading} style={btn(t, t.teal, { opacity: (!complaint||loading) ? 0.5 : 1, padding: "10px 20px" })} title="Generate (Ctrl+Enter)">
        {loading ? "Generating EMTALA-grounded workup..." : "⚕ Generate Workup Recommendations  ⌃↵"}
      </button>

      {result && (
        <div style={grid2(mobile ? 1 : 2, { gap: 12 })}>
          <div style={glass(t, { padding: 14 })}>
            <SectionH title="🟢 EMTALA Floor — Minimum MSE" t={t} />
            {[["History", result.floor?.history, "f_h"], ["Physical Exam", result.floor?.exam, "f_e"], ["Labs", result.floor?.labs, "f_l"], ["Imaging", result.floor?.imaging, "f_i"], ["Ancillary", result.floor?.ancillary, "f_a"]].filter(x => x[1]?.length).map(([lbl2, items, pfx]) => (
              <div key={pfx} style={{ marginBottom: 12 }}>
                <span style={lbl(t)}>{lbl2}</span>
                <ItemList items={items} prefix={pfx} color={t.green} />
              </div>
            ))}
          </div>
          <div style={col({ gap: 12 })}>
            <div style={glass(t, { padding: 14 })}>
              <SectionH title="🟡 Standard of Care" t={t} />
              {[["Labs", result.standard?.labs, "s_l"], ["Imaging", result.standard?.imaging, "s_i"], ["Ancillary", result.standard?.ancillary, "s_a"]].filter(x => x[1]?.length).map(([lbl2, items, pfx]) => (
                <div key={pfx} style={{ marginBottom: 12 }}>
                  <span style={lbl(t)}>{lbl2}</span>
                  <ItemList items={items} prefix={pfx} color={t.yellow} />
                </div>
              ))}
            </div>
            {result.cantMiss?.length > 0 && (
              <div style={{ ...glass(t, { padding: 14 }), background: `${t.red}10`, borderColor: `${t.red}44` }}>
                <SectionH title="🔴 Can't-Miss Diagnoses" t={t} />
                {result.cantMiss.map((item, i) => <div key={i} style={row({ gap: 8, marginBottom: 4 })}><span style={{ color: t.red }}>◆</span><span style={{ color: t.text, fontSize: 12 }}>{item}</span></div>)}
              </div>
            )}
            {result.docLanguage && (
              <div style={glass(t, { padding: 14 })}>
                <div style={row({ justifyContent: "space-between", marginBottom: 8 })}>
                  <span style={{ color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 13, fontWeight: 700 }}>Chart Documentation</span>
                  <div style={row({ gap: 6 })}>
                    <button onClick={() => navigator.clipboard.writeText(result.docLanguage)} style={btn(t, t.teal, { padding: "3px 10px", fontSize: 11 })}>Copy</button>
                    <button onClick={() => navigator.clipboard.writeText(formatQuickNoteExport({ ctx, mseDoc: result.docLanguage }))} style={btn(t, t.muted, { padding: "3px 10px", fontSize: 11 })}>📋 QuickNote</button>
                  </div>
                </div>
                <p style={{ color: t.text, fontSize: 12, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7, margin: 0 }}>{result.docLanguage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Transfer Form ─────────────────────────────────────────────────────
function TransferForm({ ctx, t, markTab, mseCtx, hosp = {}, urlVitals }) {
  const mobile = useIsMobile()
  const [f, setF] = useState({
    ptName: ctx.name||"", ptDob: "", ptMrn: "", ptArrival: ctx.arrivalTime||"",
    emcDesc: "", vitals: "", treatments: "",
    reason: [], reasonNote: "", benefits: [], benefitsNote: "", risks: [], risksNote: "",
    unstabilized: false, unstabReason: "",
    acceptFacility: "", acceptMd: "", acceptPhone: "", acceptDatetime: "",
    consent: "", consentReason: "",
    transport: "", personnel: "",
    records: [],
    certName: "", certTime: new Date().toLocaleTimeString(),
  })
  const [printing, setPrinting] = useState(false)
  const set = (k, v) => setF(p => {
    const next = { ...p, [k]: v }
    const complete = !!next.acceptMd && !!next.certName && !!next.acceptFacility
    const started  = !!next.acceptMd || !!next.acceptFacility
    markTab(2, complete ? "green" : started ? "yellow" : null)
    return next
  })
  const togRec = r => setF(p => ({ ...p, records: p.records.includes(r) ? p.records.filter(x => x !== r) : [...p.records, r] }))
  const togArr = (k, v) => setF(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }))

  const handlePrint = () => { setPrinting(true); setTimeout(() => { window.print(); setPrinting(false) }, 150) }
  const summary = `EMTALA Transfer — Patient: ${f.ptName||"(unnamed)"} → ${f.acceptFacility||"(facility)"} — Accepting MD: ${f.acceptMd||"(unknown)"} — Reason: ${f.reason.join(", ")||"not selected"} — ${new Date().toLocaleDateString()}`

  const Inp = ({ lbl2, k, type="text", ph="" }) => <div><span style={lbl(t)}>{lbl2}</span><input style={{ ...inp(t), marginTop: 4 }} type={type} placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)} /></div>
  const Area = ({ lbl2, k, ph="", rows=3 }) => <div><span style={lbl(t)}>{lbl2}</span><textarea style={{ ...inp(t), minHeight: rows*24, resize: "vertical", marginTop: 4 }} placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)} /></div>

  if (printing) return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 32, color: "#000", background: "#fff", fontSize: 12 }}>
      <h2 style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 8, margin: "0 0 4px 0" }}>EMTALA TRANSFER CERTIFICATE</h2>
      <p style={{ textAlign: "center", fontSize: 10, color: "#555", marginBottom: 8 }}>Emergency Medical Treatment and Labor Act — 42 CFR §489.24(e)</p>
      {hosp.name && (
        <div style={{ textAlign: "center", marginBottom: 14, padding: "6px 0", borderBottom: "1px solid #ccc" }}>
          <strong style={{ fontSize: 13 }}>{hosp.name}</strong>
          {hosp.dept && <span style={{ fontSize: 11, color: "#555" }}> — {hosp.dept}</span>}
          <br />
          {[hosp.street, hosp.city, hosp.state, hosp.zip].filter(Boolean).join(", ")}
          {hosp.phone && <span style={{ fontSize: 11, color: "#555" }}> · {hosp.phone}</span>}
          {hosp.ccn && <span style={{ fontSize: 11, color: "#555" }}> · CCN: {hosp.ccn}</span>}
        </div>
      )}
      {[
        ["A — Patient Information", [["Patient Name", f.ptName],["Date of Birth", f.ptDob],["MRN", f.ptMrn],["Arrival Time", f.ptArrival]]],
        ["B — Medical Condition", [["Emergency Medical Condition", f.emcDesc],["Current Vital Signs", f.vitals],["Treatment Rendered", f.treatments]]],
        ["C — Transfer Justification", [["Reason for Transfer", [...f.reason, f.reasonNote].filter(Boolean).join("; ")||"—"],["Medical Benefits", [...f.benefits, f.benefitsNote].filter(Boolean).join("; ")||"—"],["Risks of Transfer", [...f.risks, f.risksNote].filter(Boolean).join("; ")||"—"],f.unstabilized && ["Unstabilized Transfer Justification", f.unstabReason]]],
        ["D — Accepting Facility & Physician", [["Accepting Facility", f.acceptFacility],["Accepting Physician", f.acceptMd],["Direct Phone", f.acceptPhone],["Date/Time of Acceptance", f.acceptDatetime]]],
        ["E — Patient Consent", [["Consent Status", f.consent],["If Not Obtained", f.consentReason]]],
        ["F — Transport", [["Mode", f.transport],["Personnel", f.personnel]]],
        ["G — Records Sent", [["Documents Included", f.records.join(", ")||"None checked"]]],
      ].map(([heading, fields]) => (
        <div key={heading} style={{ marginBottom: 12 }}>
          <div style={{ background: "#ddd", padding: "3px 8px", fontWeight: 700, fontSize: 11 }}>{heading}</div>
          <div style={{ border: "1px solid #ccc", borderTop: "none", padding: "6px 8px" }}>
            {fields.filter(Boolean).map(([lbl2, val]) => <div key={lbl2} style={{ marginBottom: 3 }}><strong>{lbl2}:</strong> {val || "___________"}</div>)}
          </div>
        </div>
      ))}
      <div style={{ border: "2px solid #000", padding: 12, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>H — Physician Certification (42 CFR §489.24(e)(1))</div>
        <p style={{ fontSize: 11, margin: "0 0 10px 0" }}>I certify that based upon information available at the time of transfer, the medical benefits reasonably expected from appropriate medical treatment at another facility outweigh the increased risks of the transfer to the individual and, in the case of labor, to the unborn child.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><strong>Physician Name:</strong> {f.certName||"_______________________"}</div>
          <div><strong>Time:</strong> {f.certTime||"_______________________"}</div>
          <div style={{ borderTop: "1px solid #000", paddingTop: 4, marginTop: 20 }}><strong>Signature</strong></div>
          <div style={{ borderTop: "1px solid #000", paddingTop: 4, marginTop: 20 }}><strong>License #</strong></div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={col({ gap: 14 })}>
      <div style={row({ justifyContent: "space-between", flexWrap: "wrap", gap: 8 })}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: t.text }}>EMTALA Transfer Certificate</div>
        <div style={row({ gap: 8 })}>
          <button onClick={() => navigator.clipboard.writeText(summary)} style={btn(t, t.teal, { fontSize: 12 })}>Copy Summary</button>
          <button onClick={handlePrint} style={btn(t, t.gold, { fontSize: 12 })}>⎙ Print Form</button>
        </div>
      </div>

      {hosp.name && (
        <div style={{ ...glass2(t, { padding: "8px 14px" }), borderColor: `${t.teal}33`, ...row({ gap: 10, flexWrap: "wrap" }) }}>
          <span style={{ color: t.teal, fontWeight: 700, fontSize: 12 }}>⚙ {hosp.name}</span>
          {hosp.city && <span style={{ color: t.muted, fontSize: 11 }}>{hosp.city}, {hosp.state}</span>}
          {hosp.ccn && <span style={{ color: t.muted, fontSize: 11 }}>CCN: {hosp.ccn}</span>}
          <span style={{ color: t.muted, fontSize: 11, marginLeft: "auto" }}>Sending facility pre-set — will appear on printed certificate</span>
        </div>
      )}

      <div style={grid2(mobile ? 1 : 2, { gap: 12 })}>
        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="A — Patient Information" t={t} />
            <div style={grid2(mobile ? 1 : 2)}><Inp lbl2="Patient Name" k="ptName" /><Inp lbl2="Date of Birth" k="ptDob" type="date" /><Inp lbl2="MRN" k="ptMrn" /><Inp lbl2="Arrival Time" k="ptArrival" /></div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="B — Medical Condition" t={t} />
            {mseCtx && (
              <button onClick={() => set("emcDesc", mseCtx.docLanguage)} style={{ ...btn(t, t.teal, { fontSize: 11, padding: "4px 12px", marginBottom: 10 }) }}>
                ⚕ Pre-fill from SmartMSE — {mseCtx.complaint}
              </button>
            )}
            <div style={col({ gap: 10 })}>
              <Area lbl2="Emergency Medical Condition Description" k="emcDesc" ph="Describe the EMC..." />
              <div>
                <span style={lbl(t)}>Current Vital Signs</span>
                {urlVitals && (urlVitals.hr || urlVitals.bp) && (
                  <button onClick={() => {
                    const vs = [urlVitals.hr&&`HR: ${urlVitals.hr}`, urlVitals.bp&&`BP: ${urlVitals.bp}`, urlVitals.rr&&`RR: ${urlVitals.rr}`, urlVitals.spo2&&`SpO₂: ${urlVitals.spo2}%`, urlVitals.temp&&`Temp: ${urlVitals.temp}`, urlVitals.weight&&`Wt: ${urlVitals.weight}`].filter(Boolean).join(" | ")
                    set("vitals", vs)
                  }} style={btn(t, t.teal, { fontSize: 11, padding: "3px 12px", marginBottom: 6, display: "block" })}>
                    ⚡ Pull from VitalsHub
                  </button>
                )}
                <textarea style={{ ...inp(t), minHeight: 48, resize: "vertical", marginTop: 4 }} placeholder="HR, BP, RR, SpO2, Temp..." value={f.vitals} onChange={e => set("vitals", e.target.value)} />
              </div>
              <Area lbl2="Treatment Rendered Prior to Transfer" k="treatments" ph="Interventions performed..." />
            </div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="C — Transfer Justification" t={t} />
            <div style={col({ gap: 14 })}>
              <div>
                <span style={lbl(t)}>Reason for Transfer <span style={{ color: t.teal, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 8px" }}>
                  {TRANSFER_REASONS.map(opt => (
                    <button key={opt} onClick={() => togArr("reason", opt)} style={pill(t, t.teal, f.reason.includes(opt))}>{opt}</button>
                  ))}
                </div>
                {f.reason.length > 0 && (
                  <div style={{ ...glass2(t, { padding: "8px 12px" }), marginBottom: 8 }}>
                    <span style={{ color: t.muted, fontSize: 11 }}>Selected: </span>
                    <span style={{ color: t.teal, fontSize: 12 }}>{f.reason.join(" · ")}</span>
                  </div>
                )}
                <input style={inp(t)} placeholder="Additional reason (optional free text)..." value={f.reasonNote} onChange={e => set("reasonNote", e.target.value)} />
              </div>
              <div>
                <span style={lbl(t)}>Medical Benefits of Transfer <span style={{ color: t.green, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 8px" }}>
                  {TRANSFER_BENEFITS.map(opt => (
                    <button key={opt} onClick={() => togArr("benefits", opt)} style={pill(t, t.green, f.benefits.includes(opt))}>{opt}</button>
                  ))}
                </div>
                {f.benefits.length > 0 && (
                  <div style={{ ...glass2(t, { padding: "8px 12px" }), marginBottom: 8, borderColor: `${t.green}33` }}>
                    <span style={{ color: t.muted, fontSize: 11 }}>Selected: </span>
                    <span style={{ color: t.green, fontSize: 12 }}>{f.benefits.join(" · ")}</span>
                  </div>
                )}
                <input style={inp(t)} placeholder="Additional benefit (optional free text)..." value={f.benefitsNote} onChange={e => set("benefitsNote", e.target.value)} />
              </div>
              <div>
                <span style={lbl(t)}>Risks of Transfer <span style={{ color: t.yellow, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select all that apply)</span></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 8px" }}>
                  {TRANSFER_RISKS.map(opt => (
                    <button key={opt} onClick={() => togArr("risks", opt)} style={pill(t, t.yellow, f.risks.includes(opt))}>{opt}</button>
                  ))}
                </div>
                {f.risks.length > 0 && (
                  <div style={{ ...glass2(t, { padding: "8px 12px" }), marginBottom: 8, borderColor: `${t.yellow}33` }}>
                    <span style={{ color: t.muted, fontSize: 11 }}>Selected: </span>
                    <span style={{ color: t.yellow, fontSize: 12 }}>{f.risks.join(" · ")}</span>
                  </div>
                )}
                <input style={inp(t)} placeholder="Additional risk (optional free text)..." value={f.risksNote} onChange={e => set("risksNote", e.target.value)} />
              </div>
              <Checkbox checked={f.unstabilized} onChange={() => set("unstabilized", !f.unstabilized)} label="Patient is being transferred in UNSTABILIZED condition" t={t} danger />
              {f.unstabilized && <Area lbl2="Justification for Unstabilized Transfer (required by 42 CFR §489.24(e)(1))" k="unstabReason" ph="Medical necessity requires transfer prior to stabilization because..." rows={2} />}
            </div>
          </div>
        </div>

        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="D — Accepting Facility & Physician" t={t} />
            <div style={col({ gap: 10 })}>
              <Inp lbl2="Accepting Facility" k="acceptFacility" ph="Receiving hospital name" />
              <Inp lbl2="Accepting Physician" k="acceptMd" ph="Name and specialty" />
              <Inp lbl2="Direct Phone Number" k="acceptPhone" />
              <Inp lbl2="Date & Time of Acceptance" k="acceptDatetime" type="datetime-local" />
            </div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="E — Patient Consent" t={t} />
            <div style={col({ gap: 8 })}>
              {["Consent obtained and signed","Patient unable to consent — surrogate consented","Consent not obtainable — reason documented below"].map(opt => (
                <label key={opt} style={row({ gap: 8, cursor: "pointer" })}>
                  <div onClick={() => set("consent", opt)} style={{ width: 15, height: 15, borderRadius: "50%", background: f.consent === opt ? t.teal : "transparent", border: `2px solid ${f.consent === opt ? t.teal : t.border}`, cursor: "pointer" }} />
                  <span style={{ color: t.text, fontSize: 13 }}>{opt}</span>
                </label>
              ))}
              {f.consent?.includes("not obtainable") && <Area lbl2="Reason Consent Not Obtained" k="consentReason" rows={2} />}
            </div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="F — Transport" t={t} />
            <div style={col({ gap: 10 })}>
              <div><span style={lbl(t)}>Mode of Transport</span><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>{TRANSPORT_MODES.map(m => <button key={m} onClick={() => set("transport", m)} style={pill(t, t.teal, f.transport === m)}>{m}</button>)}</div></div>
              <Inp lbl2="Accompanying Personnel" k="personnel" ph="Paramedic, RN, physician..." />
            </div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="G — Records Sent with Patient" t={t} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {RECORDS_LIST.map(r => <button key={r} onClick={() => togRec(r)} style={pill(t, t.teal, f.records.includes(r))}>{r}</button>)}
            </div>
          </div>
          <div style={{ ...glass(t, { padding: 16 }), background: `${t.gold}0e`, borderColor: `${t.gold}44` }}>
            <SectionH title="H — Physician Certification" t={t} />
            <p style={{ color: t.muted, fontSize: 11, lineHeight: 1.6, margin: "0 0 12px 0" }}>Per 42 CFR §489.24(e)(1): Medical benefits at receiving facility outweigh increased risks of transfer.</p>
            <div style={grid2(2)}>
              <Inp lbl2="Certifying Physician (printed)" k="certName" ph="Full name" />
              <Inp lbl2="Certification Time" k="certTime" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 4: On-Call Log ───────────────────────────────────────────────────────
function OnCallLog({ t, addBanner, markTab }) {
  const [entries, setEntries] = useState([])
  const [f, setF] = useState({ specialty: "", provider: "", phone: "", called: "", responded: "", outcome: "", refused: false })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const OUTCOMES = ["Responded to bedside","Phone consultation","Transfer arranged","Referred to alternate provider"]

  const add = () => {
    if (!f.specialty || !f.provider) return
    if (f.refused) addBanner({ title: "On-Call Refusal — EMTALA Reportable Event", msg: `${f.provider} (${f.specialty}) refused response. Notify administration and document per 42 CFR §489.24(j).` })
    const newEntries = [...entries, { ...f, id: Date.now() }]
    setEntries(newEntries)
    markTab(3, newEntries.some(e => e.refused) ? "red" : "green")
    setF({ specialty: "", provider: "", phone: "", called: "", responded: "", outcome: "", refused: false })
  }

  const refusalCount = entries.filter(e => e.refused).length

  return (
    <div style={col({ gap: 14 })}>
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: t.text }}>On-Call Specialist Log</div>
      <p style={{ color: t.muted, fontSize: 12, margin: 0 }}>EMTALA requires hospitals to maintain and honor an on-call list. On-call refusals are reportable events under 42 CFR §489.24(j).</p>
      <div style={glass(t, { padding: 16 })}>
        <SectionH title="Log On-Call Contact" t={t} />
        <div style={grid2(3, { marginBottom: 12 })}>
          <div>
            <span style={lbl(t)}>Specialty</span>
            <select style={{ ...inp(t), marginTop: 4 }} value={f.specialty} onChange={e => set("specialty", e.target.value)}>
              <option value="">Select specialty...</option>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><span style={lbl(t)}>Provider Name</span><input style={{ ...inp(t), marginTop: 4 }} placeholder="Dr. Name" value={f.provider} onChange={e => set("provider", e.target.value)} /></div>
          <div><span style={lbl(t)}>Phone</span><input style={{ ...inp(t), marginTop: 4 }} placeholder="Contact number" value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
          <TimeField label="Time Called" value={f.called} onChange={val => set("called", val)} t={t} />
          <TimeField label="Time Responded" value={f.responded} onChange={val => set("responded", val)} t={t} />
          <div>
            <span style={lbl(t)}>Outcome</span>
            <select style={{ ...inp(t), marginTop: 4 }} value={f.outcome} onChange={e => set("outcome", e.target.value)}>
              <option value="">Select...</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={row({ justifyContent: "space-between" })}>
          <Checkbox checked={f.refused} onChange={() => set("refused", !f.refused)} label="Specialist REFUSED to respond (EMTALA reportable event)" t={t} danger />
          <button onClick={add} style={btn(t, t.teal)}>Add Entry</button>
        </div>
      </div>
      {entries.length > 0 && (
        <div style={glass(t, { padding: 16 })}>
          <SectionH title={`Shift Log — ${entries.length} Consult${entries.length !== 1 ? "s" : ""}`} t={t} />
          <div style={col({ gap: 8 })}>
            {entries.map(e => {
              const respMin = (() => { try { const [ch,cm]=e.called.split(":").map(Number); const [rh,rm]=e.responded.split(":").map(Number); return (rh*60+rm)-(ch*60+cm) } catch { return null } })()
              return (
                <div key={e.id} style={{ ...glass2(t, { padding: 12 }), background: e.refused ? `${t.red}10` : t.surf2, borderColor: e.refused ? `${t.red}55` : t.border }}>
                  <div style={row({ justifyContent: "space-between", flexWrap: "wrap", gap: 6 })}>
                    <div style={row({ gap: 12 })}>
                      <span style={{ color: t.teal, fontWeight: 700, fontSize: 13 }}>{e.specialty}</span>
                      <span style={{ color: t.text, fontSize: 13 }}>{e.provider}</span>
                      <span style={{ color: t.muted, fontSize: 12 }}>{e.phone}</span>
                    </div>
                    {e.refused && <span style={{ color: t.red, fontWeight: 700, fontSize: 11, background: `${t.red}22`, border: `1px solid ${t.red}44`, padding: "2px 10px", borderRadius: 20 }}>REFUSED — EMTALA EVENT</span>}
                  </div>
                  <div style={row({ gap: 14, marginTop: 6 })}>
                    <span style={{ color: t.muted, fontSize: 11 }}>Called: {e.called||"—"}</span>
                    <span style={{ color: t.muted, fontSize: 11 }}>Responded: {e.responded||"—"}</span>
                    {respMin !== null && <span style={{ color: respMin > 30 ? t.yellow : t.green, fontSize: 11, fontWeight: 700 }}>{respMin} min response</span>}
                    <span style={{ color: t.muted, fontSize: 11 }}>Outcome: {e.outcome||"—"}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {refusalCount > 0 && (
            <div style={{ marginTop: 12, padding: 12, background: `${t.red}14`, borderRadius: 8, border: `1px solid ${t.red}44` }}>
              <span style={{ color: t.red, fontSize: 12, fontWeight: 700 }}>⚠ {refusalCount} on-call refusal{refusalCount > 1 ? "s" : ""} this session require administrative notification and CMS documentation under EMTALA.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab 5: Violation Risk Scanner ───────────────────────────────────────────
function RiskScanner({ ctx, t, markTab }) {
  const [scenario, setScenario] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const preScreen = txt => {
    const flags = []; const s = txt.toLowerCase()
    if (s.includes("transfer") && !s.includes("accept")) flags.push({ sev: "red", msg: "Transfer documented without confirmed accepting physician" })
    if ((s.includes("discharge")||s.includes("lwbs")) && !s.includes("mse")&&!s.includes("screen")) flags.push({ sev: "yellow", msg: "Disposition without confirmed MSE documentation" })
    if (s.includes("insurance")||s.includes("uninsured")||s.includes("no insurance")) flags.push({ sev: "red", msg: "Payer status in clinical context — confirm treatment was not conditioned on insurance" })
    if (s.includes("refused")&&(s.includes("call")||s.includes("consult")||s.includes("specialist"))) flags.push({ sev: "red", msg: "On-call refusal — EMTALA reportable event under 42 CFR §489.24(j)" })
    if (s.includes("unstable")&&s.includes("transfer")) flags.push({ sev: "red", msg: "Unstabilized transfer — physician certification required under 42 CFR §489.24(e)(1)" })
    if (s.includes("labor")||s.includes("contracting")||s.includes("crowning")) flags.push({ sev: "red", msg: "Active labor — EMTALA obligations heightened; FHTs required in MSE" })
    if (s.includes("psych")&&(s.includes("discharge")||s.includes("cleared"))) flags.push({ sev: "yellow", msg: "Psychiatric disposition — confirm medical clearance labs completed" })
    return flags
  }

  const scan = async () => {
    if (!scenario) return
    setLoading(true)
    const flags = preScreen(scenario)
    try {
      const sys = `You are a senior EMTALA compliance attorney and emergency medicine specialist. Analyze the clinical scenario for EMTALA violation risk. Return ONLY valid JSON.
{"overallRisk":"low|moderate|high|critical","violations":[{"type":string,"severity":"yellow|red","description":string,"citation":string}],"defensibilityScore":0-100,"recommendations":[],"chartingLanguage":string}
Ground in: 42 CFR §489.24, CMS EMTALA Interpretive Guidelines, OIG enforcement history. Be specific on citations.`
      const raw = await callClaude(sys, `Scenario: ${scenario}\nPatient context: ${JSON.stringify(ctx)}\nPre-screen flags: ${JSON.stringify(flags)}`)
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
      setResult({ ...parsed, preFlags: flags })
      markTab(4, parsed.overallRisk === "low" ? "green" : parsed.overallRisk === "moderate" ? "yellow" : "red")
    } catch(e) { setResult({ overallRisk: "unknown", violations: [], preFlags: flags, recommendations: ["AI analysis unavailable — review pre-screen flags above manually."], defensibilityScore: 50, chartingLanguage: "" }) }
    setLoading(false)
  }

  const rC = r => ({ low: t.green, moderate: t.yellow, high: t.gold, critical: t.red })[r] || t.muted

  return (
    <div style={col({ gap: 14 })}>
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: t.text }}>EMTALA Violation Risk Scanner</div>
      <div style={glass(t, { padding: 16 })}>
        <SectionH title="Describe the Clinical Scenario" t={t} />
        <textarea style={{ ...inp(t), minHeight: 110, resize: "vertical", marginBottom: 12 }}
          placeholder="Describe what occurred: presentation, MSE performed, disposition decision, transfers, on-call interactions, payer discussions..."
          value={scenario} onChange={e => setScenario(e.target.value)}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); if (!loading && scenario) scan() } }} />
        <button onClick={scan} disabled={!scenario||loading} style={btn(t, t.teal, { opacity: (!scenario||loading)?0.5:1 })} title="Scan (Ctrl+Enter)">
          {loading ? "Scanning for EMTALA risk..." : "⚠ Scan for Violation Risk  ⌃↵"}
        </button>
      </div>
      {result && (
        <div style={col({ gap: 12 })}>
          {result.preFlags?.length > 0 && (
            <div style={{ ...glass(t, { padding: 14 }), background: `${t.red}10`, borderColor: `${t.red}44` }}>
              <SectionH title="⚡ Instant Rule-Based Flags" t={t} />
              {result.preFlags.map((f, i) => (
                <div key={i} style={row({ gap: 8, marginBottom: 6 })}>
                  <span style={{ color: f.sev === "red" ? t.red : t.yellow, fontSize: 14 }}>◆</span>
                  <span style={{ color: t.text, fontSize: 12 }}>{f.msg}</span>
                </div>
              ))}
            </div>
          )}
          <div style={grid2(2)}>
            <div style={glass(t, { padding: 16 })}>
              <SectionH title="AI Risk Assessment" t={t} />
              <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: `1px solid ${t.border}`, marginBottom: 14 }}>
                <div style={{ color: rC(result.overallRisk), fontSize: 32, fontWeight: 900, fontFamily: "Playfair Display, serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{result.overallRisk}</div>
                <div style={{ color: t.muted, fontSize: 11, marginBottom: 10 }}>EMTALA Risk Level</div>
                <div style={{ color: rC(result.overallRisk), fontSize: 28, fontWeight: 900, fontFamily: "Playfair Display, serif" }}>{result.defensibilityScore}%</div>
                <div style={{ color: t.muted, fontSize: 11 }}>Defensibility Score</div>
              </div>
              {result.violations?.map((v, i) => (
                <div key={i} style={{ background: v.severity === "red" ? `${t.red}14` : `${t.yellow}14`, border: `1px solid ${v.severity === "red" ? t.red : t.yellow}44`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ color: v.severity === "red" ? t.red : t.yellow, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{v.type}</div>
                  <div style={{ color: t.text, fontSize: 11 }}>{v.description}</div>
                  {v.citation && <div style={{ color: t.muted, fontSize: 10, marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>{v.citation}</div>}
                </div>
              ))}
            </div>
            <div style={col({ gap: 12 })}>
              {result.recommendations?.length > 0 && (
                <div style={glass(t, { padding: 14 })}>
                  <SectionH title="Recommendations" t={t} />
                  {result.recommendations.map((r, i) => (
                    <div key={i} style={row({ gap: 8, alignItems: "flex-start", marginBottom: 8 })}>
                      <span style={{ color: t.teal, fontWeight: 700, flexShrink: 0, fontSize: 13 }}>{i + 1}.</span>
                      <span style={{ color: t.text, fontSize: 12 }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.chartingLanguage && (
                <div style={glass(t, { padding: 14 })}>
                  <div style={row({ justifyContent: "space-between", marginBottom: 8 })}>
                    <span style={{ color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 13, fontWeight: 700 }}>Protective Charting Language</span>
                    <button onClick={() => navigator.clipboard.writeText(result.chartingLanguage)} style={btn(t, t.teal, { padding: "3px 10px", fontSize: 11 })}>Copy</button>
                  </div>
                  <p style={{ color: t.text, fontSize: 12, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7, margin: 0 }}>{result.chartingLanguage}</p>
                </div>
              )}
            </div>
          </div>
          {(result.overallRisk === "high" || result.overallRisk === "critical") && (
            <div style={{ ...glass(t, { padding: 16 }), background: `${t.red}10`, borderColor: `${t.red}55` }}>
              <SectionH title="🚨 Violation Response Protocol — Immediate Action Required" t={t} />
              <div style={col({ gap: 8 })}>
                {[
                  ["1", "Notify attending physician and department chair immediately — do not delay"],
                  ["2", "Notify risk management and compliance officer — document time of notification"],
                  ["3", "Preserve all documentation in its current state — no amendments, no addenda without legal guidance"],
                  ["4", "Do not discuss the case with non-essential personnel or family without risk management guidance"],
                  ["5", "Evaluate CMS self-disclosure — voluntary reports within 72 hours are viewed more favorably by CMS"],
                  ["6", "Document all response actions taken with timestamps — this log becomes part of the compliance record"],
                ].map(([num, step]) => (
                  <div key={num} style={row({ gap: 12, alignItems: "flex-start", padding: "8px 10px", background: `${t.red}08`, borderRadius: 8 })}>
                    <span style={{ color: t.red, fontWeight: 900, fontSize: 15, fontFamily: "Playfair Display, serif", flexShrink: 0, minWidth: 18 }}>{num}</span>
                    <span style={{ color: t.text, fontSize: 12, lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => navigator.clipboard.writeText("EMTALA Violation Response Protocol\n\n1. Notify attending and department chair immediately\n2. Notify risk management and compliance officer — document time\n3. Preserve all documentation — no amendments without legal guidance\n4. Restrict case discussion to essential personnel only\n5. Evaluate CMS self-disclosure within 72 hours\n6. Document all response actions with timestamps")} style={btn(t, t.red, { fontSize: 12 })}>Copy Protocol</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ComplianceAudit({ log, trainingLog = [], t }) {
  const total = log.length
  const compliant = log.filter(e => e.level === "green").length
  const gaps = log.filter(e => e.level === "yellow").length
  const risks = log.filter(e => e.level === "red").length
  const avg = total ? Math.round(log.reduce((a, e) => a + e.score, 0) / total) : 0
  const disps = {}; log.forEach(e => { disps[e.disposition] = (disps[e.disposition]||0) + 1 })

  const copyReport = () => {
    const lines = [`EMTALA Shift Compliance Report — ${new Date().toLocaleString()}`, ``, `Total Visits: ${total}`, `Compliant: ${compliant}  Gaps: ${gaps}  Risks: ${risks}`, `Average MSE Adequacy: ${avg}%`, ``, ...log.map(e => `${e.time} | ${e.patient} | ${e.complaint} | ${e.disposition} | ${e.score}% (${e.level})`)]
    navigator.clipboard.writeText(lines.join("\n"))
  }

  return (
    <div style={col({ gap: 14 })}>
      <div style={row({ justifyContent: "space-between" })}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700, color: t.text }}>Shift Compliance Audit</div>
        <button onClick={copyReport} style={btn(t, t.teal, { fontSize: 12 })}>Copy Report</button>
      </div>
      <div style={grid2(4)}>
        {[["Total Visits", total, t.text],["Compliant", compliant, t.green],["Gaps", gaps, t.yellow],["Risk Flags", risks, t.red]].map(([lbl2, val, c]) => (
          <div key={lbl2} style={{ ...glass(t, { padding: 16 }), textAlign: "center" }}>
            <div style={{ color: c, fontSize: 30, fontWeight: 900, fontFamily: "Playfair Display, serif" }}>{val}</div>
            <div style={{ color: t.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{lbl2}</div>
          </div>
        ))}
      </div>
      {total > 0 && <div style={glass(t, { padding: 16 })}><SectionH title="Average MSE Adequacy — This Session" t={t} /><Meter score={avg} t={t} /></div>}
      <div style={glass(t, { padding: 16 })}>
        <SectionH title={`Visit Log ${total ? `— ${total} visit${total !== 1 ? "s" : ""} this session` : ""}`} t={t} />
        {!total ? (
          <p style={{ color: t.muted, fontSize: 13, textAlign: "center", padding: 32 }}>No visits logged yet. Complete Visit Checklists and save to audit log.</p>
        ) : (
          <div style={col({ gap: 6 })}>
            <div style={{ ...grid2(5), padding: "6px 10px" }}>
              {["Time","Patient","Chief Complaint","Disposition","MSE Score"].map(h => <span key={h} style={{ color: t.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>)}
            </div>
            {log.map((e, i) => {
              const c = e.level === "green" ? t.green : e.level === "yellow" ? t.yellow : t.red
              return (
                <div key={i} style={{ ...glass2(t, { padding: "10px" }), ...grid2(5) }}>
                  <span style={{ color: t.muted, fontSize: 12 }}>{e.time}</span>
                  <span style={{ color: t.text, fontSize: 12 }}>{e.patient}</span>
                  <span style={{ color: t.text, fontSize: 12 }}>{e.complaint}</span>
                  <span style={{ color: t.teal, fontSize: 12 }}>{e.disposition}</span>
                  <span style={{ color: c, fontSize: 12, fontWeight: 700 }}>{e.score}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {Object.keys(disps).length > 0 && (
        <div style={glass(t, { padding: 16 })}>
          <SectionH title="Disposition Breakdown" t={t} />
          <div style={row({ gap: 10, flexWrap: "wrap" })}>
            {Object.entries(disps).map(([k, v]) => (
              <div key={k} style={{ ...glass2(t, { padding: "10px 16px" }), textAlign: "center" }}>
                <div style={{ color: t.teal, fontSize: 22, fontWeight: 900, fontFamily: "Playfair Display, serif" }}>{v}</div>
                <div style={{ color: t.muted, fontSize: 11 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {total > 0 && (() => {
        const flagged = log.filter(e => e.level !== "green")
        const handoff = [
          `EMTALA SHIFT HANDOFF — Generated ${new Date().toLocaleString()}`,``,
          `SHIFT SUMMARY`,
          `Total Visits: ${total} | Compliant: ${compliant} | Gaps: ${gaps} | Risk Flags: ${risks} | Avg MSE: ${avg}%`,``,
          flagged.length ? `FLAGGED VISITS REQUIRING FOLLOW-UP (${flagged.length}):` : `NO FLAGGED VISITS — shift compliant`,
          ...flagged.map(e => `  • ${e.time} | ${e.patient} | ${e.complaint} | ${e.disposition} | MSE ${e.score}% — ${e.level.toUpperCase()}`),``,
          `ACTION ITEMS FOR ONCOMING TEAM:`,
          risks > 0 ? `  ⚠ ${risks} visit(s) flagged as violation risk — review with risk management` : `  ✓ No violation risk flags`,
          gaps > 0 ? `  ⚠ ${gaps} visit(s) with documentation gaps — confirm completion` : `  ✓ All documented visits compliant`,``,
          `Outgoing physician attestation: All EMTALA obligations reviewed for visits logged above.`,
        ].join("\n")
        return (
          <div style={{ ...glass(t, { padding: 16 }), background: `${t.teal}08`, borderColor: `${t.teal}44` }}>
            <div style={row({ justifyContent: "space-between", marginBottom: 12 })}>
              <SectionH title="Shift Handoff Report" t={t} />
              <button onClick={() => navigator.clipboard.writeText(handoff)} style={btn(t, t.teal, { fontSize: 12 })}>Copy Handoff</button>
            </div>
            {flagged.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: t.yellow, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Flagged Visits — Needs Oncoming Review</span>
                <div style={col({ gap: 6, marginTop: 6 })}>
                  {flagged.map((e, i) => (
                    <div key={i} style={row({ gap: 10, padding: "8px 12px", background: `${e.level === "red" ? t.red : t.yellow}10`, borderRadius: 8, border: `1px solid ${e.level === "red" ? t.red : t.yellow}33` })}>
                      <span style={{ color: t.muted, fontSize: 11, flexShrink: 0 }}>{e.time}</span>
                      <span style={{ color: t.text, fontSize: 12 }}>{e.patient}</span>
                      <span style={{ color: t.muted, fontSize: 11 }}>{e.complaint}</span>
                      <span style={{ color: t.teal, fontSize: 11 }}>{e.disposition}</span>
                      <span style={{ color: e.level === "red" ? t.red : t.yellow, fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>{e.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {flagged.length === 0 && <p style={{ color: t.green, fontSize: 13, fontWeight: 700 }}>✓ All logged visits compliant — clean handoff</p>}
            <p style={{ color: t.muted, fontSize: 11, margin: 0, marginTop: 8 }}>Outgoing physician attestation: All EMTALA obligations reviewed for visits logged this session.</p>
          </div>
        )
      })()}

      {trainingLog.length > 0 && (
        <div style={{ ...glass(t, { padding: 14 }), background: `${t.yellow}08`, borderColor: `${t.yellow}44` }}>
          <SectionH title="🎓 Training Log — This Session" t={t} />
          <div style={col({ gap: 6 })}>
            {trainingLog.map((e, i) => {
              const c = e.level === "green" ? t.green : e.level === "yellow" ? t.yellow : t.red
              return (
                <div key={i} style={{ ...glass2(t, { padding: "8px 10px" }), display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, opacity: 0.7 }}>
                  <span style={{ color: t.muted, fontSize: 11 }}>{e.time}</span>
                  <span style={{ color: t.text, fontSize: 11 }}>{e.patient}</span>
                  <span style={{ color: t.text, fontSize: 11 }}>{e.complaint}</span>
                  <span style={{ color: t.teal, fontSize: 11 }}>{e.disposition}</span>
                  <span style={{ color: c, fontSize: 11, fontWeight: 700 }}>{e.score}%</span>
                </div>
              )
            })}
          </div>
          <p style={{ color: t.yellow, fontSize: 11, margin: "8px 0 0" }}>Training entries are not included in shift compliance metrics.</p>
        </div>
      )}

      <div style={{ ...glass(t, { padding: 16 }), background: `${t.gold}06`, borderColor: `${t.gold}33` }}>
        <PenaltiesCalc t={t} />
      </div>
    </div>
  )
}

// ─── Tab 6: Coverage Gap Log ──────────────────────────────────────────────────
const GAP_REASONS = ["Specialist on vacation / leave","No specialist in geographic area","Specialty not currently credentialed","Weather or natural emergency","Contract / coverage dispute","Locum not available","Administrative scheduling gap","Other — see notes"]

function CoverageGapLog({ t, addBanner, markTab }) {
  const [gaps, setGaps] = useState([])
  const [f, setF] = useState({ specialty:"", start:"", end:"", reason:"", altCoverage:"", adminName:"", adminTime:"", cmsNotified:"", notes:"" })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const gapMinutes = (g) => {
    try { const [sh,sm]=g.start.split(":").map(Number); const [eh,em]=g.end.split(":").map(Number); return (eh*60+em)-(sh*60+sm) } catch { return 0 }
  }

  const add = () => {
    if (!f.specialty || !f.start) return
    const mins = gapMinutes(f)
    if (mins >= 240 && !f.adminName) addBanner({ title: "On-Call Gap > 4 Hours — Admin Notification Required", msg: `${f.specialty} gap of ${Math.round(mins/60*10)/10}h has no documented administrative notification.` })
    const entry = { ...f, id: Date.now() }
    const newGaps = [...gaps, entry]
    setGaps(newGaps)
    markTab(5, newGaps.some(g => gapMinutes(g) >= 240 && !g.adminName) ? "red" : "green")
    setF({ specialty:"", start:"", end:"", reason:"", altCoverage:"", adminName:"", adminTime:"", cmsNotified:"", notes:"" })
  }

  return (
    <div style={col({ gap: 14 })}>
      <div style={{ fontFamily:"Playfair Display, serif", fontSize:19, fontWeight:700, color:t.text }}>On-Call Coverage Gap Log</div>
      <p style={{ color:t.muted, fontSize:12, margin:0 }}>Separate from per-consult refusals — tracks scheduled periods with NO specialty coverage. Gaps may require CMS notification under 42 CFR §489.20(r)(2).</p>
      <div style={glass(t, { padding:16 })}>
        <SectionH title="Log a Coverage Gap" t={t} />
        <div style={grid2(3, { marginBottom:12 })}>
          <div><span style={lbl(t)}>Specialty</span>
            <select style={{ ...inp(t), marginTop:4 }} value={f.specialty} onChange={e => set("specialty", e.target.value)}>
              <option value="">Select...</option>{SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <TimeField label="Gap Start" value={f.start} onChange={val => set("start", val)} t={t} />
          <TimeField label="Gap End" value={f.end} onChange={val => set("end", val)} t={t} />
        </div>
        <div style={{ marginBottom:10 }}>
          <span style={lbl(t)}>Reason for Gap</span>
          <div style={{ marginTop:4 }}>
            <ChipGroup options={GAP_REASONS} value={f.reason} onChange={o => set("reason", o)} color={t.yellow} t={t} />
          </div>
        </div>
        <div style={grid2(2, { marginBottom:10 })}>
          <div><span style={lbl(t)}>Alternative Coverage Arranged?</span>
            <div style={{ marginTop:4 }}><ChipGroup options={["Yes — covered","No — gap unfilled","Partial coverage"]} value={f.altCoverage} onChange={o => set("altCoverage", o)} color={t.teal} t={t} /></div>
          </div>
          <div><span style={lbl(t)}>CMS Notification Status</span>
            <div style={{ marginTop:4 }}><ChipGroup options={["Not required","Notified","Pending"]} value={f.cmsNotified} onChange={o => set("cmsNotified", o)} color={t.gold} t={t} /></div>
          </div>
        </div>
        <div style={grid2(2, { marginBottom:12 })}>
          <div><span style={lbl(t)}>Admin Notified (Name)</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Administrator name" value={f.adminName} onChange={e => set("adminName", e.target.value)} /></div>
          <TimeField label="Notification Time" value={f.adminTime} onChange={val => set("adminTime", val)} t={t} />
        </div>
        <div style={{ marginBottom:12 }}><span style={lbl(t)}>Notes</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Additional context..." value={f.notes} onChange={e => set("notes", e.target.value)} /></div>
        <button onClick={add} style={btn(t, t.teal)}>Add Gap Entry</button>
      </div>
      {gaps.length > 0 && <div style={glass(t, { padding:16 })}>
        <SectionH title={`Gap Log — ${gaps.length} gap${gaps.length!==1?"s":""} this shift`} t={t} />
        <div style={col({ gap:8 })}>
          {gaps.map(g => {
            const mins = gapMinutes(g)
            const alert = mins >= 240 && !g.adminName
            return (
              <div key={g.id} style={{ ...glass2(t, { padding:12 }), borderColor: alert ? `${t.red}55` : t.border, background: alert ? `${t.red}0a` : t.surf2 }}>
                <div style={row({ justifyContent:"space-between", flexWrap:"wrap", gap:6 })}>
                  <div style={row({ gap:10 })}>
                    <span style={{ color:t.teal, fontWeight:700, fontSize:13 }}>{g.specialty}</span>
                    <span style={{ color:t.muted, fontSize:12 }}>{g.start} – {g.end||"ongoing"}</span>
                    {mins > 0 && <span style={{ color: mins>=240?t.red:mins>=120?t.yellow:t.green, fontWeight:700, fontSize:12 }}>{Math.round(mins/60*10)/10}h gap</span>}
                  </div>
                  {alert && <span style={{ color:t.red, fontSize:11, fontWeight:700, background:`${t.red}22`, padding:"2px 10px", borderRadius:20 }}>⚠ ADMIN NOTIFICATION MISSING</span>}
                </div>
                <div style={row({ gap:12, marginTop:4, flexWrap:"wrap" })}>
                  <span style={{ color:t.muted, fontSize:11 }}>Reason: {g.reason||"—"}</span>
                  <span style={{ color:t.muted, fontSize:11 }}>Alt coverage: {g.altCoverage||"—"}</span>
                  <span style={{ color:t.muted, fontSize:11 }}>Admin: {g.adminName||"—"} {g.adminTime}</span>
                  <span style={{ color:t.muted, fontSize:11 }}>CMS: {g.cmsNotified||"—"}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>}
    </div>
  )
}

// ─── Tab 7: Receiving Transfer ────────────────────────────────────────────────
function ReceivingTransfer({ t, markTab }) {
  const [f, setF] = useState({ sendFacility:"", sendMd:"", sendPhone:"", emcDesc:"", capability:"", capabilityNote:"", capacity:"", bedType:"", patientArrivalCondition:"", transferCondition:"", deterioration:"", recordsReceived:[], acceptingMd:"", acceptingSpec:"", acceptTime:"", rejecting:false, rejectReason:"" })
  const set = (k, v) => setF(p => {
    const next = { ...p, [k]:v }
    const done = !!next.acceptingMd && !!next.capability && !!next.capacity
    if (done) markTab(6, "green")
    else if (next.acceptingMd || next.sendFacility) markTab(6, "yellow")
    return next
  })
  const togRec = r => setF(p => ({ ...p, recordsReceived: p.recordsReceived.includes(r) ? p.recordsReceived.filter(x=>x!==r) : [...p.recordsReceived, r] }))

  return (
    <div style={col({ gap:14 })}>
      <div style={{ fontFamily:"Playfair Display, serif", fontSize:19, fontWeight:700, color:t.text }}>Receiving Transfer Checklist</div>
      <p style={{ color:t.muted, fontSize:12, margin:0 }}>Accepting an EMTALA transfer creates obligations. Hospitals cannot refuse transfers if they have the capability and capacity. Document inability to refuse under 42 CFR §489.24(f).</p>
      <div style={grid2(2, { gap:12 })}>
        <div style={col({ gap:12 })}>
          <div style={glass(t, { padding:16 })}>
            <SectionH title="Sending Facility" t={t} />
            <div style={col({ gap:10 })}>
              <div><span style={lbl(t)}>Sending Facility</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Hospital name" value={f.sendFacility} onChange={e => set("sendFacility", e.target.value)} /></div>
              <div style={grid2(2)}>
                <div><span style={lbl(t)}>Sending Physician</span><input style={{ ...inp(t), marginTop:4 }} placeholder="MD name" value={f.sendMd} onChange={e => set("sendMd", e.target.value)} /></div>
                <div><span style={lbl(t)}>Phone</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Contact" value={f.sendPhone} onChange={e => set("sendPhone", e.target.value)} /></div>
              </div>
              <div><span style={lbl(t)}>EMC Description (as reported)</span><textarea style={{ ...inp(t), minHeight:56, resize:"vertical", marginTop:4 }} placeholder="Patient's emergency medical condition as communicated by sending facility..." value={f.emcDesc} onChange={e => set("emcDesc", e.target.value)} /></div>
            </div>
          </div>
          <div style={glass(t, { padding:16 })}>
            <SectionH title="Capability & Capacity" t={t} />
            <div style={col({ gap:10 })}>
              <div><span style={lbl(t)}>Capability for this EMC?</span>
                <div style={{ marginTop:4 }}>
                  <ChipGroup options={["Yes — confirmed","No — cannot provide needed care","Partial capability"]} value={f.capability} onChange={o => set("capability", o)} color={f.capability?.startsWith("No") ? t.red : t.green} t={t} />
                </div>
              </div>
              {f.capability && !f.capability.startsWith("Yes") && <div><span style={lbl(t)}>Explain Limitation</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Specific capability gap..." value={f.capabilityNote} onChange={e => set("capabilityNote", e.target.value)} /></div>}
              <div><span style={lbl(t)}>Bed Capacity Available?</span>
                <div style={{ marginTop:4 }}>
                  <ChipGroup options={["Yes","No — diversion","ICU only","Step-down only"]} value={f.capacity} onChange={o => set("capacity", o)} color={f.capacity === "No — diversion" ? t.red : t.teal} t={t} />
                </div>
              </div>
              <div><span style={lbl(t)}>Bed / Unit Type</span><input style={{ ...inp(t), marginTop:4 }} placeholder="e.g. ICU Bed 4, Trauma Bay 2" value={f.bedType} onChange={e => set("bedType", e.target.value)} /></div>
            </div>
          </div>
          <div style={{ ...glass(t, { padding:12 }), background:`${t.red}0a`, borderColor:`${t.red}44` }}>
            <Checkbox checked={f.rejecting} onChange={() => set("rejecting", !f.rejecting)} label="Hospital is DECLINING this transfer request" t={t} danger />
            {f.rejecting && <div style={{ marginTop:10 }}><span style={lbl(t)}>Documented Reason for Declination</span><textarea style={{ ...inp(t), minHeight:56, resize:"vertical", marginTop:4 }} placeholder="Hospitals may only decline if they lack capability or capacity. Document specific reason..." value={f.rejectReason} onChange={e => set("rejectReason", e.target.value)} /></div>}
          </div>
        </div>
        <div style={col({ gap:12 })}>
          <div style={glass(t, { padding:16 })}>
            <SectionH title="Accepting Physician" t={t} />
            <div style={col({ gap:10 })}>
              <div><span style={lbl(t)}>Accepting Physician</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Physician name" value={f.acceptingMd} onChange={e => set("acceptingMd", e.target.value)} /></div>
              <div style={grid2(2)}>
                <div><span style={lbl(t)}>Specialty</span><input style={{ ...inp(t), marginTop:4 }} placeholder="Specialty" value={f.acceptingSpec} onChange={e => set("acceptingSpec", e.target.value)} /></div>
                <TimeField label="Acceptance Time" value={f.acceptTime} onChange={val => set("acceptTime", val)} t={t} />
              </div>
            </div>
          </div>
          <div style={glass(t, { padding:16 })}>
            <SectionH title="Patient Condition Comparison" t={t} />
            <div style={col({ gap:10 })}>
              <div><span style={lbl(t)}>Reported Condition at Time of Transfer</span><textarea style={{ ...inp(t), minHeight:56, resize:"vertical", marginTop:4 }} placeholder="Vitals and status as reported by sending facility..." value={f.transferCondition} onChange={e => set("transferCondition", e.target.value)} /></div>
              <div><span style={lbl(t)}>Condition on Arrival at This Facility</span><textarea style={{ ...inp(t), minHeight:56, resize:"vertical", marginTop:4 }} placeholder="Vitals and clinical status on arrival..." value={f.patientArrivalCondition} onChange={e => set("patientArrivalCondition", e.target.value)} /></div>
              <div><span style={lbl(t)}>Deterioration During Transfer?</span>
                <div style={{ marginTop:4 }}>
                  <ChipGroup options={["No change","Minor change","Significant deterioration","Critical deterioration"]} value={f.deterioration} onChange={o => set("deterioration", o)} color={f.deterioration?.includes("deterioration") ? t.red : t.green} t={t} />
                </div>
              </div>
              {f.deterioration?.includes("deterioration") && <div style={{ ...glass2(t, { padding:10 }), background:`${t.red}0a`, borderColor:`${t.red}44` }}><span style={{ color:t.red, fontSize:12 }}>Document deterioration in chart and notify risk management. Significant deterioration during transfer may indicate the original transfer was not appropriate under EMTALA.</span></div>}
            </div>
          </div>
          <div style={glass(t, { padding:16 })}>
            <SectionH title="Records Received" t={t} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {RECORDS_LIST.map(r => <button key={r} onClick={() => togRec(r)} style={pill(t, t.teal, f.recordsReceived.includes(r))}>{r}</button>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 8: Attestation Builder ───────────────────────────────────────────────
const ATTEST_SCENARIOS = [
  { id:"mse_std",   label:"MSE — Standard",         icon:"⚕", fields:["presenting_complaint","qmp_name","emc_result"] },
  { id:"mse_psych", label:"MSE — Psychiatric",       icon:"🧠", fields:["presenting_complaint","qmp_name","clearance_labs","capacity"] },
  { id:"mse_ob",    label:"MSE — Labor / OB",        icon:"♀", fields:["gestational_age","fht_result","delivery_status"] },
  { id:"ama",       label:"AMA Attestation",         icon:"✗",  fields:["presenting_complaint","risks_discussed","patient_response"] },
  { id:"transfer",  label:"Transfer Certification",  icon:"⇄",  fields:["emc_desc","receiving_facility","accepting_md","reason"] },
  { id:"lwbs",      label:"LWBS Documentation",      icon:"→",  fields:["presenting_complaint","mse_offered","time_left"] },
]
const ATTEST_FIELD_LABELS = { presenting_complaint:"Chief Complaint / Presentation", qmp_name:"Performing QMP (Physician Name)", emc_result:"EMC Determination", clearance_labs:"Medical Clearance Labs Performed", capacity:"Decision-Making Capacity", gestational_age:"Gestational Age", fht_result:"Fetal Heart Tone Result", delivery_status:"Delivery Imminence Assessment", risks_discussed:"Risks Discussed with Patient", patient_response:"Patient's Response / Stated Reason", emc_desc:"Emergency Medical Condition", receiving_facility:"Receiving Facility", accepting_md:"Accepting Physician", reason:"Reason for Transfer", mse_offered:"MSE Offered? (Yes/No + How)", time_left:"Time Patient Left" }

function AttestationBuilder({ ctx, t, markTab }) {
  const [scenario, setScenario] = useState(null)
  const [fields, setFields]     = useState({})
  const [output, setOutput]     = useState("")
  const [loading, setLoading]   = useState(false)
  const setF = (k, v) => setFields(p => ({ ...p, [k]:v }))

  const generate = async () => {
    if (!scenario) return
    setLoading(true)
    try {
      const sys = `You are an EMTALA compliance attorney and emergency physician. Generate a concise, legally defensible attestation statement for the given scenario. Return ONLY the attestation text — no JSON, no markdown, no preamble. Write in first person, present tense. 2-4 sentences. Include the regulatory basis (42 CFR §489.24) where appropriate. Use the specific details provided.`
      const userMsg = `Scenario: ${scenario.label}\nPatient context: Age ${ctx.age||"unknown"}, Sex ${ctx.sex||"unknown"}, Chief complaint: ${ctx.complaint||"unknown"}\nFields: ${JSON.stringify(fields)}`
      const text = await callClaude(sys, userMsg)
      setOutput(text)
      markTab(7, "green")
    } catch(e) { setOutput("Unable to generate — please try again.") }
    setLoading(false)
  }

  return (
    <div style={col({ gap:14 })}>
      <div style={{ fontFamily:"Playfair Display, serif", fontSize:19, fontWeight:700, color:t.text }}>Attestation Language Builder</div>
      <p style={{ color:t.muted, fontSize:12, margin:0 }}>Generates concise, EMTALA-grounded attestation language for the most common documentation scenarios. Copy directly into the chart.</p>
      <div style={glass(t, { padding:16 })}>
        <SectionH title="Select Attestation Scenario" t={t} />
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {ATTEST_SCENARIOS.map(s => (
            <button key={s.id} onClick={() => { setScenario(s); setFields({}); setOutput("") }} style={{ ...pill(t, t.gold, scenario?.id===s.id), padding:"8px 16px", fontSize:13 }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
      {scenario && (
        <div style={glass(t, { padding:16 })}>
          <SectionH title={`${scenario.icon} ${scenario.label} — Details`} t={t} />
          <div style={col({ gap:10 })}>
            {scenario.fields.map(fk => (
              <div key={fk}>
                <span style={lbl(t)}>{ATTEST_FIELD_LABELS[fk]||fk}</span>
                <input style={{ ...inp(t), marginTop:4 }} placeholder={`Enter ${ATTEST_FIELD_LABELS[fk]||fk}...`} value={fields[fk]||""} onChange={e => setF(fk, e.target.value)} />
              </div>
            ))}
            <button onClick={generate} disabled={loading} style={btn(t, t.teal, { marginTop:4, opacity:loading?0.5:1 })} title="Generate (Ctrl+Enter)">
              {loading ? "Generating attestation..." : "✎ Generate Attestation Language  ⌃↵"}
            </button>
          </div>
        </div>
      )}
      {output && (
        <div style={{ ...glass(t, { padding:16 }), background:`${t.teal}08`, borderColor:`${t.teal}44` }}>
          <div style={row({ justifyContent:"space-between", marginBottom:12 })}>
            <span style={{ color:t.gold, fontFamily:"Playfair Display, serif", fontSize:14, fontWeight:700 }}>Generated Attestation</span>
            <div style={row({ gap:8 })}>
              <button onClick={() => navigator.clipboard.writeText(output)} style={btn(t, t.teal, { padding:"4px 12px", fontSize:12 })}>Copy to Chart</button>
              <button onClick={() => { setOutput(""); setFields({}) }} style={btn(t, t.muted, { padding:"4px 12px", fontSize:12 })}>Clear</button>
            </div>
          </div>
          <p style={{ color:t.text, fontSize:13, fontFamily:"JetBrains Mono, monospace", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>{output}</p>
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${t.border}` }}>
            <span style={{ color:t.muted, fontSize:11 }}>⚠ Review before use. AI-generated language should be verified against the actual clinical encounter. Do not use verbatim without physician review.</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Penalties Calculator ─────────────────────────────────────────────────────
const VIOLATION_TYPES = [
  { id:"mse",     label:"Failure to Provide MSE",           hospitalMax: 119942, physicianMax: 119942 },
  { id:"stab",    label:"Failure to Stabilize EMC",         hospitalMax: 119942, physicianMax: 119942 },
  { id:"xfer",    label:"Inappropriate Transfer",           hospitalMax: 119942, physicianMax: 119942 },
  { id:"oncall",  label:"On-Call Refusal",                  hospitalMax: 119942, physicianMax: 119942 },
  { id:"signage", label:"Failure to Post EMTALA Signage",   hospitalMax: 119942, physicianMax: 0 },
  { id:"records", label:"Failure to Maintain EMTALA Records",hospitalMax: 119942, physicianMax: 0 },
]

function PenaltiesCalc({ t }) {
  const [counts, setCounts] = useState({})
  const [bedSize, setBedSize] = useState("large")
  const [pattern, setPattern] = useState("isolated")
  const set = (k, v) => setCounts(p => ({ ...p, [k]: Math.max(0, parseInt(v)||0) }))

  const multiplier = pattern === "pattern" ? 0.85 : 1   // pattern = higher scrutiny but plea discount modeled
  const bedAdj = bedSize === "small" ? 0.5 : 1           // <150 beds = 50% cap per CMS guidance
  const totalViolations = VIOLATION_TYPES.reduce((a, vt) => a + (counts[vt.id]||0), 0)
  const hospExposure = VIOLATION_TYPES.reduce((a, vt) => a + (counts[vt.id]||0) * vt.hospitalMax * bedAdj * multiplier, 0)
  const physExposure = VIOLATION_TYPES.reduce((a, vt) => a + (counts[vt.id]||0) * vt.physicianMax * multiplier, 0)
  const terminationRisk = totalViolations >= 3 || hospExposure > 300000
  const exclusionRisk   = physExposure > 200000

  const fmt = n => `$${Math.round(n).toLocaleString()}`

  return (
    <div style={col({ gap: 14 })}>
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 700, color: t.gold }}>⚖ EMTALA Penalty Exposure Calculator</div>
      <p style={{ color: t.muted, fontSize: 11, margin: 0 }}>Estimates civil monetary penalty exposure under 42 CFR §1003.700. For enterprise risk assessment only — not legal advice.</p>

      <div style={grid2(2)}>
        <div>
          <span style={lbl(t)}>Hospital Bed Size</span>
          <div style={{ marginTop: 4 }}><ChipGroup options={["small","large"]} value={bedSize} onChange={setBedSize} color={t.teal} t={t} /></div>
          <div style={{ color: t.muted, fontSize: 10, marginTop: 4 }}>Small = &lt;150 beds (50% cap applies)</div>
        </div>
        <div>
          <span style={lbl(t)}>Violation Pattern</span>
          <div style={{ marginTop: 4 }}><ChipGroup options={["isolated","pattern"]} value={pattern} onChange={setPattern} color={t.yellow} t={t} /></div>
          <div style={{ color: t.muted, fontSize: 10, marginTop: 4 }}>Pattern = repeated violations = heightened CMS scrutiny</div>
        </div>
      </div>

      <div style={col({ gap: 6 })}>
        {VIOLATION_TYPES.map(vt => (
          <div key={vt.id} style={row({ gap: 10, ...glass2(t, { padding: "8px 12px" }) })}>
            <span style={{ color: t.text, fontSize: 12, flex: 1 }}>{vt.label}</span>
            <div style={row({ gap: 6 })}>
              <button onClick={() => set(vt.id, (counts[vt.id]||0) - 1)} style={btn(t, t.muted, { padding: "2px 8px", fontSize: 13 })}>−</button>
              <span style={{ color: counts[vt.id] ? t.red : t.muted, fontSize: 14, fontWeight: 900, minWidth: 20, textAlign: "center", fontFamily: "Playfair Display, serif" }}>{counts[vt.id]||0}</span>
              <button onClick={() => set(vt.id, (counts[vt.id]||0) + 1)} style={btn(t, t.teal, { padding: "2px 8px", fontSize: 13 })}>+</button>
            </div>
            <span style={{ color: t.muted, fontSize: 10, minWidth: 80, textAlign: "right" }}>Max {fmt(vt.hospitalMax * bedAdj)}/violation</span>
          </div>
        ))}
      </div>

      {totalViolations > 0 && (
        <div style={grid2(2, { gap: 10 })}>
          <div style={{ ...glass(t, { padding: 14 }), background: `${t.red}10`, borderColor: `${t.red}44`, textAlign: "center" }}>
            <div style={{ color: t.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Hospital Exposure</div>
            <div style={{ color: t.red, fontSize: 28, fontWeight: 900, fontFamily: "Playfair Display, serif", margin: "4px 0" }}>{fmt(hospExposure)}</div>
            {terminationRisk && <div style={{ color: t.red, fontSize: 11, fontWeight: 700 }}>⚠ Medicare termination risk threshold reached</div>}
          </div>
          <div style={{ ...glass(t, { padding: 14 }), background: `${t.yellow}10`, borderColor: `${t.yellow}44`, textAlign: "center" }}>
            <div style={{ color: t.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Physician Exposure</div>
            <div style={{ color: t.yellow, fontSize: 28, fontWeight: 900, fontFamily: "Playfair Display, serif", margin: "4px 0" }}>{fmt(physExposure)}</div>
            {exclusionRisk && <div style={{ color: t.yellow, fontSize: 11, fontWeight: 700 }}>⚠ Medicare/Medicaid exclusion risk</div>}
          </div>
        </div>
      )}
      {totalViolations === 0 && <p style={{ color: t.muted, fontSize: 12, textAlign: "center", padding: 16 }}>Enter violation counts above to calculate exposure.</p>}
    </div>
  )
}

// ─── Hospital Pre-Set ─────────────────────────────────────────────────────────
const HOSP_EMPTY = { name:"", dept:"Emergency Department", street:"", city:"", state:"", zip:"", phone:"", fax:"", ccn:"", npi:"", medDir:"" }

function HospitalSetup({ hosp, setHosp, t, onClose }) {
  const set = (k, v) => setHosp(p => ({ ...p, [k]: v }))
  const configured = !!hosp.name
  const addrLine = [hosp.street, hosp.city, hosp.state, hosp.zip].filter(Boolean).join(", ")

  return (
    <div style={{ ...glass(t, { padding: 16 }), marginBottom: 12, background: configured ? `${t.teal}08` : `${t.gold}08`, borderColor: configured ? `${t.teal}44` : `${t.gold}44` }}>
      <div style={row({ justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 })}>
        <div style={row({ gap: 10 })}>
          <span style={{ color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 700 }}>⚙ Hospital Settings</span>
          {configured
            ? <span style={{ color: t.green, fontSize: 11, background: `${t.green}18`, border: `1px solid ${t.green}44`, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>✓ Configured</span>
            : <span style={{ color: t.gold, fontSize: 11, background: `${t.gold}18`, border: `1px solid ${t.gold}44`, borderRadius: 20, padding: "2px 10px" }}>Not set — enter facility info to auto-populate forms</span>
          }
        </div>
        <div style={row({ gap: 8 })}>
          {configured && <button onClick={() => setHosp(HOSP_EMPTY)} style={btn(t, t.muted, { fontSize: 11, padding: "4px 10px" })}>Clear</button>}
          <button onClick={onClose} style={btn(t, t.muted, { padding: "3px 10px", fontSize: 11 })}>✕ Close</button>
        </div>
      </div>

      <div style={col({ gap: 12 })}>
        <div style={grid2(2)}>
          <div>
            <span style={lbl(t)}>Hospital / Facility Name <span style={{ color: t.red }}>*</span></span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="e.g. Avera McKennan Hospital" value={hosp.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <span style={lbl(t)}>Department Name</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="Emergency Department" value={hosp.dept} onChange={e => set("dept", e.target.value)} />
          </div>
        </div>

        <div style={grid2(3)}>
          <div style={{ gridColumn: "1 / 3" }}>
            <span style={lbl(t)}>Street Address</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="1234 Medical Center Drive" value={hosp.street} onChange={e => set("street", e.target.value)} />
          </div>
          <div>
            <span style={lbl(t)}>City</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="City" value={hosp.city} onChange={e => set("city", e.target.value)} />
          </div>
          <div>
            <span style={lbl(t)}>State</span>
            <select style={{ ...inp(t), marginTop: 4 }} value={hosp.state} onChange={e => set("state", e.target.value)}>
              <option value="">Select...</option>
              {US_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <span style={lbl(t)}>ZIP Code</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="57104" value={hosp.zip} onChange={e => set("zip", e.target.value)} />
          </div>
          <div>
            <span style={lbl(t)}>Main Phone</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="(605) 322-8000" value={hosp.phone} onChange={e => set("phone", e.target.value)} />
          </div>
        </div>

        <div style={grid2(3)}>
          <div>
            <span style={lbl(t)}>CMS Certification Number (CCN)</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="430090" value={hosp.ccn} onChange={e => set("ccn", e.target.value)} />
          </div>
          <div>
            <span style={lbl(t)}>NPI</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="1234567890" value={hosp.npi} onChange={e => set("npi", e.target.value)} />
          </div>
          <div>
            <span style={lbl(t)}>Medical / ED Director (optional)</span>
            <input style={{ ...inp(t), marginTop: 4 }} placeholder="Dr. Name, MD" value={hosp.medDir} onChange={e => set("medDir", e.target.value)} />
          </div>
        </div>

        {configured && (
          <div style={{ ...glass2(t, { padding: "10px 14px" }), borderColor: `${t.teal}33` }}>
            <div style={row({ gap: 16, flexWrap: "wrap" })}>
              <span style={{ color: t.teal, fontWeight: 700, fontSize: 12 }}>{hosp.name}</span>
              {addrLine && <span style={{ color: t.muted, fontSize: 11 }}>{addrLine}</span>}
              {hosp.phone && <span style={{ color: t.muted, fontSize: 11 }}>{hosp.phone}</span>}
              {hosp.ccn && <span style={{ color: t.muted, fontSize: 11 }}>CCN: {hosp.ccn}</span>}
              {hosp.state && STATE_HOLD_MAP[hosp.state] && (
                <span style={{ color: t.gold, fontSize: 11 }}>Auto-hold: {STATE_HOLD_MAP[hosp.state]}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Patient Context Bar ──────────────────────────────────────────────────────
function PCBar({ ctx, setCtx, t }) {
  const mobile = useIsMobile()
  const FLAGS = ["Pregnant","Peds","Psych","Immunocomp","Anticoag","Age>65"]
  return (
    <div style={{ ...glass(t, { padding: "10px 16px" }), marginBottom: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ color: t.teal, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>Patient</span>
      {[{ k:"name",ph:"Name / MRN",w:130 },{ k:"age",ph:"Age",w:50 },{ k:"sex",ph:"Sex",w:55 },{ k:"complaint",ph:"Chief Complaint",w:170 },{ k:"esi",ph:"ESI",w:46 },{ k:"arrivalTime",ph:"Arrival",w:88 }].map(({ k, ph, w }) => (
        <input key={k} value={ctx[k]||""} onChange={e => setCtx(p => ({ ...p, [k]: e.target.value }))} placeholder={ph}
          style={{ ...inp(t, { width: mobile ? "100%" : w, flexShrink: 0 }) }} />
      ))}
      <div style={{ marginLeft: mobile ? 0 : "auto", display: "flex", gap: 5, flexWrap: "wrap", width: mobile ? "100%" : "auto" }}>
        {FLAGS.map(fl => <button key={fl} onClick={() => setCtx(p => ({ ...p, [fl]: !p[fl] }))} style={{ ...pill(t, t.gold, ctx[fl]), padding: "4px 10px", fontSize: 11 }}>{fl}</button>)}
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────
const TAB_NAMES = ["✓ Visit Checklist","⚕ SmartMSE","⇄ Transfer Form","📋 On-Call Log","⚠ Risk Scanner","📵 Gap Log","⬇ Receiving","✎ Attestation","📊 Audit"]

export default function EMTALAHub({ C = {} }) {
  const t = mk(C)
  const [tab, setTab]               = useState(0)
  const [ctx, setCtx]               = useState({ name:"", age:"", sex:"", complaint:"", esi:"", arrivalTime:"" })
  const [banners, setBanners]       = useState([])
  const [auditLog, setAuditLog]     = useState([])
  const [tabDone, setTabDone]       = useState({})
  const [shiftStart]                = useState(Date.now())
  const [shiftElapsed, setShiftElapsed] = useState("00:00")
  const [mseCtx, setMseCtx]         = useState(null)
  const [hosp, setHosp]             = useState(HOSP_EMPTY)
  const [showSetup, setShowSetup]   = useState(false)
  const [showRef, setShowRef]       = useState(false)
  const [showKeys, setShowKeys]     = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [patientCount, setPatientCount] = useState(0)
  const [training, setTraining]     = useState(false)
  const [trainingLog, setTrainingLog] = useState([])
  const [urlVitals]                 = useState(() => readVitalsFromUrl())

  // Auto-populate PCBar from VitalsHub URL params on first load
  useEffect(() => {
    if (!urlVitals) return
    setCtx(p => ({
      ...p,
      name:      urlVitals.name      || p.name,
      age:       urlVitals.age       || p.age,
      sex:       urlVitals.sex       || p.sex,
      complaint: urlVitals.complaint || p.complaint,
      esi:       urlVitals.esi       || p.esi,
    }))
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
      if (!typing && e.key >= "1" && e.key <= "9") {
        const i = parseInt(e.key) - 1
        if (i < TAB_NAMES.length) { e.preventDefault(); setTab(i) }
      }
      if (e.key === "Escape") {
        setBanners(p => p.length ? p.slice(0, -1) : p)
        setShowRef(false); setShowKeys(false); setClearConfirm(false); setShowSetup(false)
      }
      if (!typing && e.key === "?") { e.preventDefault(); setShowKeys(p => !p) }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") { e.preventDefault(); setShowRef(p => !p) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Shift clock
  useEffect(() => {
    const id = setInterval(() => {
      const mins = Math.floor((Date.now() - shiftStart) / 60000)
      const h = Math.floor(mins / 60).toString().padStart(2, "0")
      const m = (mins % 60).toString().padStart(2, "0")
      setShiftElapsed(`${h}:${m}`)
    }, 30000)
    return () => clearInterval(id)
  }, [shiftStart])

  const addBanner  = useCallback(b => setBanners(p => [...p, { ...b, training }]), [training])
  const dismiss    = useCallback(i => setBanners(p => p.filter((_, idx) => idx !== i)), [])
  const addToAudit = useCallback(e => {
    const entry = { ...e, training }
    if (training) setTrainingLog(p => [...p, entry])
    else { setAuditLog(p => [...p, entry]); setTabDone(p => ({ ...p, 0: e.level, 8: "green" })) }
  }, [training])
  const markTab    = useCallback((i, status) => setTabDone(p => ({ ...p, [i]: status })), [])

  const handleClear = () => {
    if (!clearConfirm) { setClearConfirm(true); setTimeout(() => setClearConfirm(false), 4000); return }
    setCtx({ name:"", age:"", sex:"", complaint:"", esi:"", arrivalTime:"" })
    setBanners([]); setTabDone({}); setMseCtx(null)
    setPatientCount(p => p + 1); setClearConfirm(false); setTab(0)
  }

  const badgeColor = (i) => {
    const s = tabDone[i]
    if (!s) return null
    return s === "green" ? t.green : s === "yellow" ? t.yellow : t.red
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh", padding: 16, fontFamily: "DM Sans, sans-serif", boxSizing: "border-box" }}>
      <GlobalStyles />

      {/* Header */}
      <div style={{ marginBottom: 14, borderBottom: `1px solid ${t.border}`, paddingBottom: 12, ...row({ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }) }}>
        <div>
          <div style={row({ gap: 10, alignItems: "baseline" })}>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 900, color: t.teal }}>Notrya</span>
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: t.text }}>EMTALA Hub</span>
            <span style={{ color: t.gold, fontSize: 11, background: `${t.gold}18`, border: `1px solid ${t.gold}44`, borderRadius: 20, padding: "2px 10px" }}>42 CFR §489.24</span>
          </div>
          <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>Emergency Medical Treatment and Labor Act — Clinical Compliance Suite</div>
        </div>
        <div style={row({ gap: 10, flexWrap: "wrap" })}>
          <div style={{ ...glass2(t, { padding: "6px 14px" }), textAlign: "center" }}>
            <div style={{ color: t.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Shift Time</div>
            <div style={{ color: t.text, fontSize: 16, fontWeight: 900, fontFamily: "Playfair Display, serif" }}>{shiftElapsed}</div>
          </div>
          <div style={{ ...glass2(t, { padding: "6px 14px" }), textAlign: "center" }}>
            <div style={{ color: t.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Patients</div>
            <div style={{ color: t.teal, fontSize: 16, fontWeight: 900, fontFamily: "Playfair Display, serif" }}>{auditLog.length}</div>
          </div>
          <button onClick={handleClear} style={btn(t, clearConfirm ? t.red : t.gold, { fontSize: 12 })}>
            {clearConfirm ? "⚠ Confirm Clear Patient?" : "⟳ Next Patient"}
          </button>
          <button onClick={() => setShowSetup(p => !p)} style={{ ...btn(t, showSetup ? t.gold : t.muted, { fontSize: 12, padding: "7px 10px" }), position: "relative" }} title="Hospital Settings">
            ⚙{hosp.name ? <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: t.green, border: `2px solid #09111f`, display: "block" }} /> : null}
          </button>
          <button onClick={() => setShowRef(p => !p)} style={btn(t, showRef ? t.teal : t.muted, { fontSize: 12, padding: "7px 12px" })} title="Toggle EMTALA Reference (Ctrl+/)">
            {showRef ? "✕ Close Ref" : "? EMTALA Ref"}
          </button>
          <button onClick={() => setShowKeys(p => !p)} style={btn(t, showKeys ? t.gold : t.muted, { fontSize: 12, padding: "7px 10px" })} title="Keyboard shortcuts (?)">⌨</button>
          <button
            onClick={() => setTraining(p => !p)}
            style={btn(t, training ? t.yellow : t.muted, { fontSize: 12, padding: "7px 12px", border: training ? `1px solid ${t.yellow}` : undefined })}
            title="Toggle Training Mode"
          >{training ? "🎓 Training" : "Training"}</button>
        </div>
      </div>

      <PCBar ctx={ctx} setCtx={setCtx} t={t} />

      {showSetup && <HospitalSetup hosp={hosp} setHosp={setHosp} t={t} onClose={() => setShowSetup(false)} />}

      {showRef && (
        <div style={{ ...glass(t, { padding: 16 }), marginBottom: 12, background: `${t.teal}08`, borderColor: `${t.teal}44` }}>
          <div style={row({ justifyContent: "space-between", marginBottom: 12 })}>
            <span style={{ color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 15, fontWeight: 700 }}>EMTALA Quick Reference — 42 CFR §489.24</span>
            <button onClick={() => setShowRef(false)} style={btn(t, t.muted, { padding: "3px 10px", fontSize: 11 })}>Close</button>
          </div>
          <div style={grid2(3, { gap: 12 })}>
            {[
              { title: "Dedicated ED", body: "Any department operated 24/7 that provides emergency services, OR any clinic that treated 1/3 of its patients for emergencies in the prior year." },
              { title: "Emergency Medical Condition", body: "Acute symptoms of sufficient severity that absence of immediate medical attention could result in serious jeopardy to health, serious impairment of bodily functions, or serious dysfunction of any bodily organ." },
              { title: "Stabilized", body: "No material deterioration of the condition is likely within reasonable medical probability from or during transfer, or the EMC has been resolved." },
              { title: "Medical Screening Exam", body: "Must be performed by a Qualified Medical Person using ancillary services routinely available. Must be identical regardless of payer status. Cannot be delayed for registration or insurance inquiry." },
              { title: "Appropriate Transfer", body: "Receiving facility has space and qualified personnel, has accepted the patient, sending physician certifies benefits outweigh risks, and all medical records are sent with the patient." },
              { title: "EMTALA Penalties", body: "Civil monetary penalties up to $119,942 per violation. Hospitals may be terminated from Medicare. Physicians may be excluded from Medicare/Medicaid for gross negligence." },
            ].map(({ title, body }) => (
              <div key={title} style={glass2(t, { padding: 12 })}>
                <div style={{ color: t.teal, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{title}</div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, padding: "6px 12px", background: `${t.gold}10`, borderRadius: 8, border: `1px solid ${t.gold}33` }}>
            <span style={{ color: t.gold, fontSize: 11 }}>Key citations: 42 CFR §489.24 (EMTALA obligations) · 42 CFR §489.20 (signage & on-call) · 42 CFR §489.24(j) (on-call requirements) · 42 CFR §489.24(e) (transfer requirements)</span>
          </div>
        </div>
      )}

      {showKeys && (
        <div style={{ ...glass(t, { padding: 14 }), marginBottom: 12, background: `${t.gold}08`, borderColor: `${t.gold}44` }}>
          <div style={row({ justifyContent: "space-between", marginBottom: 10 })}>
            <span style={{ color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 13, fontWeight: 700 }}>⌨ Keyboard Shortcuts</span>
            <button onClick={() => setShowKeys(false)} style={btn(t, t.muted, { padding: "2px 8px", fontSize: 11 })}>✕</button>
          </div>
          <div style={grid2(3, { gap: 8 })}>
            {[
              ["1 – 9", "Switch to Tab 1–9"],
              ["Ctrl + Enter", "Generate / Save (active button)"],
              ["Ctrl + /", "Toggle EMTALA Reference"],
              ["?", "Toggle this shortcut panel"],
              ["Esc", "Dismiss banner / close panels"],
              ["N (in time field)", "Insert current time"],
              ["← → Arrow keys", "Navigate chip options"],
              ["Space / Enter", "Select focused chip"],
              ["Tab", "Move to next field"],
            ].map(([key, desc]) => (
              <div key={key} style={row({ gap: 8 })}>
                <code style={{ background: `${t.gold}18`, border: `1px solid ${t.gold}33`, borderRadius: 5, padding: "2px 7px", color: t.gold, fontSize: 11, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>{key}</code>
                <span style={{ color: t.muted, fontSize: 11 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <PanicBanner banners={banners} dismiss={dismiss} t={t} />

      {training && (
        <div style={{ ...glass(t, { padding: "10px 16px" }), marginBottom: 12, background: `${t.yellow}14`, borderColor: `${t.yellow}55`, ...row({ justifyContent: "space-between" }) }}>
          <div style={row({ gap: 8 })}>
            <span style={{ fontSize: 15 }}>🎓</span>
            <strong style={{ color: t.yellow, fontSize: 13 }}>Training Mode Active</strong>
            <span style={{ color: t.text, fontSize: 12 }}>Audit log entries go to the training log only — no real shift data is affected. PanicBanners fire normally for practice.</span>
          </div>
          <span style={{ color: t.yellow, fontSize: 11, background: `${t.yellow}18`, border: `1px solid ${t.yellow}44`, borderRadius: 20, padding: "2px 10px" }}>{trainingLog.length} training entries</span>
        </div>
      )}

      {urlVitals && (urlVitals.hr || urlVitals.bp) && (
        <div style={{ ...glass(t, { padding: "10px 16px" }), marginBottom: 12, background: `${t.teal}10`, borderColor: `${t.teal}44`, ...row({ gap: 10, flexWrap: "wrap" }) }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <strong style={{ color: t.teal, fontSize: 12 }}>VitalsHub data detected</strong>
          <span style={{ color: t.muted, fontSize: 11 }}>{[urlVitals.hr&&`HR ${urlVitals.hr}`, urlVitals.bp&&`BP ${urlVitals.bp}`, urlVitals.rr&&`RR ${urlVitals.rr}`, urlVitals.spo2&&`SpO₂ ${urlVitals.spo2}%`, urlVitals.temp&&`T ${urlVitals.temp}`].filter(Boolean).join(" · ")}</span>
          <span style={{ color: t.muted, fontSize: 11, marginLeft: "auto" }}>Open Transfer Form → Section B to import</span>
        </div>
      )}

      {/* Tab Bar with completion badges */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {TAB_NAMES.map((name, i) => {
          const bc = badgeColor(i)
          return (
            <button key={i} onClick={() => setTab(i)} style={{
              background: tab === i ? `${t.teal}22` : "rgba(255,255,255,0.02)",
              border: `1px solid ${tab === i ? t.teal : t.border}`,
              borderRadius: 8, color: tab === i ? t.teal : t.muted,
              padding: "6px 10px", cursor: "pointer", fontSize: 11,
              fontFamily: "DM Sans, sans-serif", fontWeight: tab === i ? 700 : 400,
              position: "relative",
            }}>
              {name}
              {bc && <span style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, borderRadius: "50%", background: bc, border: `2px solid ${t.bg}`, display: "block" }} />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={glass(t, { padding: 20, minHeight: 500 })}>
        {tab === 0 && <VisitChecklist ctx={ctx} t={t} addBanner={addBanner} addToAudit={addToAudit} hosp={hosp} training={training} />}
        {tab === 1 && <SmartMSE ctx={ctx} t={t} markTab={markTab} setMseCtx={setMseCtx} />}
        {tab === 2 && <TransferForm ctx={ctx} t={t} markTab={markTab} mseCtx={mseCtx} hosp={hosp} urlVitals={urlVitals} />}
        {tab === 3 && <OnCallLog t={t} addBanner={addBanner} markTab={markTab} />}
        {tab === 4 && <RiskScanner ctx={ctx} t={t} markTab={markTab} />}
        {tab === 5 && <CoverageGapLog t={t} addBanner={addBanner} markTab={markTab} />}
        {tab === 6 && <ReceivingTransfer t={t} markTab={markTab} />}
        {tab === 7 && <AttestationBuilder ctx={ctx} t={t} markTab={markTab} />}
        {tab === 8 && <ComplianceAudit log={auditLog} trainingLog={trainingLog} t={t} />}
      </div>
    </div>
  )
}