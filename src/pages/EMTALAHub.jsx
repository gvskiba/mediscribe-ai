import { useState, useRef, useCallback } from "react"

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
const HARD_RULES = {
  "Chest Pain":          ["12-lead EKG within 10 min of arrival — no exceptions","Serial troponin (minimum ×2)","Vital signs with SpO2"],
  "Stroke Symptoms":     ["CT head without contrast required","Last known well time documented","Point-of-care glucose mandatory","NIHSS documented"],
  "Syncope":             ["12-lead EKG","Orthostatic vital signs","Point-of-care glucose"],
  "GI Bleed":            ["Orthostatic vital signs","IV access documented","Type and screen"],
  "Pregnancy-Related":   ["Fetal heart tones documented in MSE","Gestational age documented","Obstetric history"],
  "Fever – Pediatric":   ["Age &lt;28 days → full sepsis workup is EMTALA floor","Blood cultures before antibiotics if sepsis concern"],
  "Altered Mental Status":["Point-of-care glucose is absolute floor","Vital signs with temperature","Medication reconciliation"],
  "Overdose / Ingestion":["Substance identified or attempted","Acetaminophen level if unknown ingestion","12-lead EKG for cardiac toxicity"],
  "Suicidal Ideation":   ["Medical clearance labs before psychiatric disposition","Capacity assessment documented","Safety assessment completed"],
  "Allergic Reaction":   ["Serial vital signs documented","Epinephrine availability confirmed"],
  "Back Pain":           ["Age &gt;50 or vascular risk factors: AAA must be addressed in MSE","Vital signs including bilateral BP if dissection concern"],
}

// ─── Style Helpers ────────────────────────────────────────────────────────────
const glass  = (t, x={}) => ({ background: t.surf, border: `1px solid ${t.border}`, borderRadius: 12, backdropFilter: "blur(12px)", ...x })
const glass2 = (t, x={}) => ({ background: t.surf2, border: `1px solid ${t.border}`, borderRadius: 10, ...x })
const inp    = (t, x={}) => ({ background: "rgba(255,255,255,0.04)", border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: "8px 12px", fontSize: 13, fontFamily: "DM Sans, sans-serif", width: "100%", outline: "none", boxSizing: "border-box", ...x })
const btn    = (t, c, x={}) => ({ background: `${c}22`, border: `1px solid ${c}55`, color: c, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontFamily: "DM Sans, sans-serif", fontWeight: 600, transition: "opacity 0.15s", ...x })
const lbl    = (t) => ({ color: t.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 })
const row    = (x={}) => ({ display: "flex", gap: 10, alignItems: "center", ...x })
const col    = (x={}) => ({ display: "flex", flexDirection: "column", gap: 8, ...x })
const grid2  = (cols, x={}) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, ...x })
const pill   = (t, c, active) => ({ background: active ? `${c}28` : "rgba(255,255,255,0.03)", border: `1px solid ${active ? c : t.border}`, borderRadius: 20, color: active ? c : t.muted, padding: "5px 13px", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: active ? 700 : 400 })

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
  return (
    <label style={row({ cursor: "pointer", gap: 8 })}>
      <div onClick={onChange} style={{ width: 17, height: 17, borderRadius: 4, flexShrink: 0, background: checked ? c : "transparent", border: `2px solid ${checked ? c : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {checked && <span style={{ color: "#09111f", fontSize: 10, fontWeight: 900 }}>✓</span>}
      </div>
      <span style={{ color: danger ? t.red : t.text, fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>{label}</span>
    </label>
  )
}

function SectionH({ title, t }) {
  return <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 6, marginBottom: 12, color: t.gold, fontFamily: "Playfair Display, serif", fontSize: 14, fontWeight: 700 }}>{title}</div>
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

async function callClaude(system, userMsg) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": "sk-ant-..." },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: userMsg }] }),
  })
  const d = await r.json()
  return d.content?.map(c => c.text || "").join("") || ""
}

// ─── Tab 1: Visit Checklist ───────────────────────────────────────────────────
function VisitChecklist({ ctx, t, addBanner, addToAudit }) {
  const [v, setV] = useState({ arrived: false, mse: false, qmp: "", mseTime: "", emc: "", emcDesc: "", stabilized: false, disposition: "", pregnant: false, psych: false, peds: false, lwbsOffer: false, amaRisks: false, amaConsent: false })
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

      <div style={grid2(2)}>
        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="Arrival &amp; MSE" t={t} />
            <div style={col({ gap: 10 })}>
              <Checkbox checked={v.arrived} onChange={() => tog("arrived")} label="Patient arrived via dedicated Emergency Department" t={t} />
              <Checkbox checked={v.mse} onChange={() => tog("mse")} label="Medical Screening Examination (MSE) performed" t={t} />
              <div style={grid2(2)}>
                <div><span style={lbl(t)}>QMP Performing MSE</span><input style={inp(t)} placeholder="Physician name" value={v.qmp} onChange={e => set("qmp", e.target.value)} /></div>
                <div><span style={lbl(t)}>MSE Timestamp</span><input style={inp(t)} type="time" value={v.mseTime} onChange={e => set("mseTime", e.target.value)} /></div>
              </div>
              <div>
                <span style={lbl(t)}>Emergency Medical Condition (EMC)?</span>
                <div style={row({ gap: 6, marginTop: 4 })}>
                  {["Yes","No","Undetermined"].map(opt => (
                    <button key={opt} onClick={() => set("emc", opt)} style={pill(t, opt === "Yes" ? t.red : opt === "No" ? t.green : t.yellow, v.emc === opt)}>{opt}</button>
                  ))}
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
              <Checkbox checked={v.pregnant || !!ctx.Pregnant} onChange={() => tog("pregnant")} label="Pregnant — fetal heart tones documented in MSE" t={t} />
              <Checkbox checked={v.psych} onChange={() => tog("psych")} label="Psychiatric — capacity and safety assessment documented" t={t} />
              <Checkbox checked={v.peds} onChange={() => tog("peds")} label="Pediatric — age-appropriate MSE performed" t={t} />
            </div>
          </div>
        </div>

        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="Disposition" t={t} />
            <div style={col({ gap: 10 })}>
              <div>
                <span style={lbl(t)}>Select Disposition</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {["Discharge","Admit","Transfer","AMA","LWBS","Observation"].map(d => (
                    <button key={d} onClick={() => set("disposition", d)} style={pill(t, t.teal, v.disposition === d)}>{d}</button>
                  ))}
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

          <div style={row({ gap: 8 })}>
            <button onClick={handleDisposit} style={btn(t, s >= 90 ? t.green : t.yellow, { flex: 1 })}>
              {s >= 90 ? "✓ Clear for Disposition" : "⚠ Flag &amp; Proceed"}
            </button>
            <button onClick={handleSave} style={btn(t, t.teal, { flex: 1 })}>
              {saved ? "✓ Saved" : "Save to Audit Log"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: SmartMSE ──────────────────────────────────────────────────────────
function SmartMSE({ ctx, t }) {
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
      setResult(JSON.parse(raw.replace(/```json|```/g, "").trim()))
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

      <button onClick={generate} disabled={!complaint || loading} style={btn(t, t.teal, { opacity: (!complaint||loading) ? 0.5 : 1, padding: "10px 20px" })}>
        {loading ? "Generating EMTALA-grounded workup..." : "⚕ Generate Workup Recommendations"}
      </button>

      {result && (
        <div style={grid2(2, { gap: 12 })}>
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
                  <button onClick={() => navigator.clipboard.writeText(result.docLanguage)} style={btn(t, t.teal, { padding: "3px 10px", fontSize: 11 })}>Copy</button>
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
function TransferForm({ ctx, t }) {
  const [f, setF] = useState({
    ptName: ctx.name||"", ptDob: "", ptMrn: "", ptArrival: ctx.arrivalTime||"",
    emcDesc: "", vitals: "", treatments: "",
    reason: "", benefits: "", risks: "", unstabilized: false, unstabReason: "",
    acceptFacility: "", acceptMd: "", acceptPhone: "", acceptDatetime: "",
    consent: "", consentReason: "",
    transport: "", personnel: "",
    records: [],
    certName: "", certTime: new Date().toLocaleTimeString(),
  })
  const [printing, setPrinting] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const togRec = r => setF(p => ({ ...p, records: p.records.includes(r) ? p.records.filter(x => x !== r) : [...p.records, r] }))

  const handlePrint = () => { setPrinting(true); setTimeout(() => { window.print(); setPrinting(false) }, 150) }
  const summary = `EMTALA Transfer — Patient: ${f.ptName||"(unnamed)"} → ${f.acceptFacility||"(facility)"} — Accepting MD: ${f.acceptMd||"(unknown)"} — ${new Date().toLocaleDateString()}`

  const Inp = ({ lbl2, k, type="text", ph="" }) => <div><span style={lbl(t)}>{lbl2}</span><input style={{ ...inp(t), marginTop: 4 }} type={type} placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)} /></div>
  const Area = ({ lbl2, k, ph="", rows=3 }) => <div><span style={lbl(t)}>{lbl2}</span><textarea style={{ ...inp(t), minHeight: rows*24, resize: "vertical", marginTop: 4 }} placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)} /></div>

  if (printing) return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 32, color: "#000", background: "#fff", fontSize: 12 }}>
      <h2 style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 8, margin: "0 0 4px 0" }}>EMTALA TRANSFER CERTIFICATE</h2>
      <p style={{ textAlign: "center", fontSize: 10, color: "#555", marginBottom: 16 }}>Emergency Medical Treatment and Labor Act — 42 CFR §489.24(e)</p>
      {[
        ["A — Patient Information", [["Patient Name", f.ptName],["Date of Birth", f.ptDob],["MRN", f.ptMrn],["Arrival Time", f.ptArrival]]],
        ["B — Medical Condition", [["Emergency Medical Condition", f.emcDesc],["Current Vital Signs", f.vitals],["Treatment Rendered", f.treatments]]],
        ["C — Transfer Justification", [["Reason for Transfer", f.reason],["Benefits", f.benefits],["Risks", f.risks],f.unstabilized && ["Unstabilized Transfer Justification", f.unstabReason]]],
        ["D — Accepting Facility &amp; Physician", [["Accepting Facility", f.acceptFacility],["Accepting Physician", f.acceptMd],["Direct Phone", f.acceptPhone],["Date/Time of Acceptance", f.acceptDatetime]]],
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

      <div style={grid2(2, { gap: 12 })}>
        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="A — Patient Information" t={t} />
            <div style={grid2(2)}><Inp lbl2="Patient Name" k="ptName" /><Inp lbl2="Date of Birth" k="ptDob" type="date" /><Inp lbl2="MRN" k="ptMrn" /><Inp lbl2="Arrival Time" k="ptArrival" /></div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="B — Medical Condition" t={t} />
            <div style={col({ gap: 10 })}>
              <Area lbl2="Emergency Medical Condition Description" k="emcDesc" ph="Describe the EMC..." />
              <Area lbl2="Current Vital Signs" k="vitals" ph="HR, BP, RR, SpO2, Temp..." rows={2} />
              <Area lbl2="Treatment Rendered Prior to Transfer" k="treatments" ph="Interventions performed..." />
            </div>
          </div>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="C — Transfer Justification" t={t} />
            <div style={col({ gap: 10 })}>
              <Area lbl2="Reason for Transfer" k="reason" ph="Level of care unavailable at this facility..." rows={2} />
              <Area lbl2="Medical Benefits of Transfer" k="benefits" ph="Specialist availability, higher level care..." rows={2} />
              <Area lbl2="Risks of Transfer" k="risks" ph="Hemodynamic instability, deterioration in transit..." rows={2} />
              <Checkbox checked={f.unstabilized} onChange={() => set("unstabilized", !f.unstabilized)} label="Patient is being transferred in UNSTABILIZED condition" t={t} danger />
              {f.unstabilized && <Area lbl2="Justification for Unstabilized Transfer (required by 42 CFR §489.24(e)(1))" k="unstabReason" ph="Medical necessity requires transfer prior to stabilization because..." rows={2} />}
            </div>
          </div>
        </div>

        <div style={col({ gap: 12 })}>
          <div style={glass(t, { padding: 16 })}>
            <SectionH title="D — Accepting Facility &amp; Physician" t={t} />
            <div style={col({ gap: 10 })}>
              <Inp lbl2="Accepting Facility" k="acceptFacility" ph="Receiving hospital name" />
              <Inp lbl2="Accepting Physician" k="acceptMd" ph="Name and specialty" />
              <Inp lbl2="Direct Phone Number" k="acceptPhone" />
              <Inp lbl2="Date &amp; Time of Acceptance" k="acceptDatetime" type="datetime-local" />
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
function OnCallLog({ t, addBanner }) {
  const [entries, setEntries] = useState([])
  const [f, setF] = useState({ specialty: "", provider: "", phone: "", called: "", responded: "", outcome: "", refused: false })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const OUTCOMES = ["Responded to bedside","Phone consultation","Transfer arranged","Referred to alternate provider"]

  const add = () => {
    if (!f.specialty || !f.provider) return
    if (f.refused) addBanner({ title: "On-Call Refusal — EMTALA Reportable Event", msg: `${f.provider} (${f.specialty}) refused response. Notify administration and document per 42 CFR §489.24(j).` })
    setEntries(p => [...p, { ...f, id: Date.now() }])
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
          <div><span style={lbl(t)}>Time Called</span><input style={{ ...inp(t), marginTop: 4 }} type="time" value={f.called} onChange={e => set("called", e.target.value)} /></div>
          <div><span style={lbl(t)}>Time Responded</span><input style={{ ...inp(t), marginTop: 4 }} type="time" value={f.responded} onChange={e => set("responded", e.target.value)} /></div>
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
function RiskScanner({ ctx, t }) {
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
      setResult({ ...JSON.parse(raw.replace(/```json|```/g, "").trim()), preFlags: flags })
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
          value={scenario} onChange={e => setScenario(e.target.value)} />
        <button onClick={scan} disabled={!scenario||loading} style={btn(t, t.teal, { opacity: (!scenario||loading)?0.5:1 })}>
          {loading ? "Scanning for EMTALA risk..." : "⚠ Scan for Violation Risk"}
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
        </div>
      )}
    </div>
  )
}

// ─── Tab 6: Compliance Audit ──────────────────────────────────────────────────
function ComplianceAudit({ log, t }) {
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
    </div>
  )
}

// ─── Patient Context Bar ──────────────────────────────────────────────────────
function PCBar({ ctx, setCtx, t }) {
  const FLAGS = ["Pregnant","Peds","Psych","Immunocomp","Anticoag","Age>65"]
  return (
    <div style={{ ...glass(t, { padding: "10px 16px" }), marginBottom: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ color: t.teal, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>Patient</span>
      {[{ k:"name",ph:"Name / MRN",w:130 },{ k:"age",ph:"Age",w:50 },{ k:"sex",ph:"Sex",w:55 },{ k:"complaint",ph:"Chief Complaint",w:170 },{ k:"esi",ph:"ESI",w:46 },{ k:"arrivalTime",ph:"Arrival",w:88 }].map(({ k, ph, w }) => (
        <input key={k} value={ctx[k]||""} onChange={e => setCtx(p => ({ ...p, [k]: e.target.value }))} placeholder={ph}
          style={{ ...inp(t, { width: w, flexShrink: 0 }) }} />
      ))}
      <div style={{ marginLeft: "auto", display: "flex", gap: 5, flexWrap: "wrap" }}>
        {FLAGS.map(fl => <button key={fl} onClick={() => setCtx(p => ({ ...p, [fl]: !p[fl] }))} style={{ ...pill(t, t.gold, ctx[fl]), padding: "4px 10px", fontSize: 11 }}>{fl}</button>)}
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────
const TABS = ["✓ Visit Checklist","⚕ SmartMSE","⇄ Transfer Form","📋 On-Call Log","⚠ Risk Scanner","📊 Audit"]

export default function EMTALAHub({ C = {} }) {
  const t = mk(C)
  const [tab, setTab] = useState(0)
  const [ctx, setCtx] = useState({ name:"", age:"", sex:"", complaint:"", esi:"", arrivalTime:"" })
  const [banners, setBanners] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const addBanner  = useCallback(b => setBanners(p => [...p, b]), [])
  const dismiss    = useCallback(i => setBanners(p => p.filter((_, idx) => idx !== i)), [])
  const addToAudit = useCallback(e => setAuditLog(p => [...p, e]), [])

  return (
    <div style={{ background: t.bg, minHeight: "100vh", padding: 16, fontFamily: "DM Sans, sans-serif", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: 14, borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }}>
        <div style={row({ gap: 10, alignItems: "baseline" })}>
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 900, color: t.teal }}>Notrya</span>
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700, color: t.text }}>EMTALA Hub</span>
          <span style={{ color: t.gold, fontSize: 11, background: `${t.gold}18`, border: `1px solid ${t.gold}44`, borderRadius: 20, padding: "2px 10px" }}>42 CFR §489.24</span>
        </div>
        <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>Emergency Medical Treatment and Labor Act — Clinical Compliance Suite</div>
      </div>

      <PCBar ctx={ctx} setCtx={setCtx} t={t} />
      <PanicBanner banners={banners} dismiss={dismiss} t={t} />

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {TABS.map((name, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? `${t.teal}22` : "rgba(255,255,255,0.02)",
            border: `1px solid ${tab === i ? t.teal : t.border}`,
            borderRadius: 8, color: tab === i ? t.teal : t.muted,
            padding: "7px 14px", cursor: "pointer", fontSize: 12,
            fontFamily: "DM Sans, sans-serif", fontWeight: tab === i ? 700 : 400,
          }}>{name}</button>
        ))}
      </div>

      {/* Content */}
      <div style={glass(t, { padding: 20, minHeight: 500 })}>
        {tab === 0 && <VisitChecklist ctx={ctx} t={t} addBanner={addBanner} addToAudit={addToAudit} />}
        {tab === 1 && <SmartMSE ctx={ctx} t={t} />}
        {tab === 2 && <TransferForm ctx={ctx} t={t} />}
        {tab === 3 && <OnCallLog t={t} addBanner={addBanner} />}
        {tab === 4 && <RiskScanner ctx={ctx} t={t} />}
        {tab === 5 && <ComplianceAudit log={auditLog} t={t} />}
      </div>
    </div>
  )
}