import { useState } from "react";
import { SEPSIS } from "./sepsisData";

const SOURCE_FILTERS = [
  { id: "all", icon: "🔍", label: "All Systems" },
  { id: "pulm", icon: "🫁", label: "Pulmonary" },
  { id: "gu", icon: "🫘", label: "GU / Renal" },
  { id: "gi", icon: "🫃", label: "GI / Abdominal" },
  { id: "ssti", icon: "🩹", label: "SSTI / Skin" },
  { id: "neuro", icon: "🧠", label: "Neuro / CNS" },
  { id: "cardio", icon: "❤️", label: "Cardiac / Vascular" },
  { id: "hem", icon: "🩸", label: "Hematologic" },
  { id: "bone", icon: "🦴", label: "Bone & Joint" },
];

export default function SepsisProtocol() {
  const [sepTab, setSepTab] = useState("criteria");
  const [abxTab, setAbxTab] = useState("empiric");
  const [sourceFilter, setSourceFilter] = useState("all");

  return (
    <div>
      <div className="sh">
        <div className="sh-l">
          <div className="sh-ico" style={{ background: "rgba(239,68,68,.1)" }}>🔴</div>
          <span className="sh-ttl">SEPSIS PROTOCOL</span>
        </div>
        <span className="sh-m">SSC 2018 · PHOENIX 2024 · Sepsis-3</span>
      </div>

      <div className="ntabs">
        {[["criteria", "📊 Criteria"], ["bundle", "⏱ Hour-1 Bundle"], ["fluids", "💧 Fluids"], ["antibiotics", "💉 Antibiotics"]].map(([id, label]) => (
          <button key={id} className={`ntab ${sepTab === id ? "on" : ""}`} onClick={() => setSepTab(id)}>{label}</button>
        ))}
      </div>

      {sepTab === "criteria" && (
        <div className="cgrid">
          {SEPSIS.criteria.map(crit => (
            <div className="cc" key={crit.id} style={{ borderTop: `3px solid ${crit.color}` }}>
              <div className="cct">
                <div className="ccb" style={{ background: `${crit.color}15`, color: crit.color, border: `1px solid ${crit.color}30` }}>{crit.badge}</div>
                <div className="ccl">{crit.label}</div>
                {crit.desc && <div className="ccd">{crit.desc}</div>}
              </div>
              <div className="ccp">
                {crit.params.map((p, i) => (
                  <div className="cprow" key={i}><span className="cpn">{p.name}</span><span className="cpv">{p.value}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {sepTab === "bundle" && (
        <div className="card">
          <div className="chdr">
            <div className="sh-l">
              <div className="sh-ico" style={{ background: "rgba(245,158,11,.1)" }}>⏱</div>
              <div>
                <div className="sh-ttl">SURVIVING SEPSIS CAMPAIGN — HOUR-1 BUNDLE</div>
                <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>All elements initiated within 1 hour of recognition</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "13px 15px" }}>
            <div className="blist">
              {SEPSIS.bundle.map(s => (
                <div key={s.step} className={`bstep ${s.priority}`}>
                  <div className="snum">{s.step}</div>
                  <div style={{ flex: 1 }}>
                    <div className="sact">{s.action}</div>
                    <div className="sdet">{s.detail}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", padding: "2px 7px", borderRadius: 3, flexShrink: 0, background: s.priority === "critical" ? "rgba(239,68,68,.12)" : "rgba(245,158,11,.12)", color: s.priority === "critical" ? "var(--red)" : "var(--yel)" }}>
                    {s.priority.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <div className="ibox" style={{ marginTop: 12, marginBottom: 0 }}>
              <strong>Lactate Targets:</strong> &gt;2 mmol/L = Sepsis · &gt;4 mmol/L = Septic Shock (even if normotensive) · Target ≥10% clearance at 2 hr · Non-clearance → reassess volume, vasopressor dose, source control
            </div>
          </div>
        </div>
      )}

      {sepTab === "fluids" && (
        <div className="fgrid">
          <div className="card" style={{ borderTop: "3px solid var(--teal)" }}>
            <div className="chdr"><span className="sh-ttl" style={{ color: "var(--teal)" }}>🧑 ADULT RESUSCITATION</span></div>
            <div className="cbdy">
              <div className="ibox">
                <strong>Initial:</strong> {SEPSIS.fluids.adult.initial}<br />
                <strong>Preferred:</strong> {SEPSIS.fluids.adult.preferred}<br />
                <strong>Vasopressor:</strong> {SEPSIS.fluids.adult.vasopressor}<br />
                <strong>⚠</strong> {SEPSIS.fluids.adult.caution}
              </div>
              <table className="ft">
                <thead><tr><th>FLUID</th><th>DOSE</th><th>NOTES</th></tr></thead>
                <tbody>
                  {SEPSIS.fluids.adult.list.map((f, i) => (
                    <tr key={i}><td><div className="fn">{f.name}</div></td><td style={{ fontFamily: "monospace", fontSize: 11 }}>{f.dose}</td><td className="fd">{f.note}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ borderTop: "3px solid var(--pur)" }}>
            <div className="chdr"><span className="sh-ttl" style={{ color: "var(--pur)" }}>👶 PEDIATRIC RESUSCITATION</span></div>
            <div className="cbdy">
              <div className="ibox">
                <strong>Initial:</strong> {SEPSIS.fluids.pediatric.initial}<br />
                <strong>Max 1st hr:</strong> {SEPSIS.fluids.pediatric.max}<br />
                <strong>⚠ FEAST:</strong> {SEPSIS.fluids.pediatric.caution}
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--tx3)", marginBottom: 7 }}>AGE-APPROPRIATE BP TARGETS</div>
              <table className="mtbl">
                <thead><tr><th>AGE GROUP</th><th>MIN SBP</th><th>TARGET MAP</th></tr></thead>
                <tbody>
                  {SEPSIS.fluids.pediatric.mapTargets.map((t, i) => (
                    <tr key={i}><td>{t.age}</td><td style={{ fontFamily: "monospace", color: "var(--yel)" }}>≥{t.sbp} mmHg</td><td style={{ fontFamily: "monospace", color: "var(--teal)" }}>≥{t.map} mmHg</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sepTab === "antibiotics" && (
        <>
          <div className="stabs">
            {[["empiric", "Empiric by Severity"], ["sources", "Source-Directed"], ["pediatric", "Pediatric"]].map(([id, label]) => (
              <button key={id} className={`stab ${abxTab === id ? "on" : ""}`} onClick={() => setAbxTab(id)}>{label}</button>
            ))}
          </div>

          {abxTab === "empiric" && SEPSIS.antibiotics.empiric.map((r, i) => (
            <div className="arow" key={i}>
              <div className="asev"><span style={{ width: 8, height: 8, borderRadius: "50%", background: r.dot, display: "inline-block", flexShrink: 0 }} />{r.severity}</div>
              <div className="abdy">
                <div><div className="al">PRIMARY REGIMEN</div><div className="ad">{r.primary}</div></div>
                <div><div className="al">ADD-ON COVERAGE</div><div className="aa">{r.addition}</div></div>
                <div><div className="al">NOTES</div><div className="an">{r.notes}</div></div>
              </div>
            </div>
          ))}

          {abxTab === "sources" && (
            <>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {SOURCE_FILTERS.map(f => (
                  <button key={f.id} onClick={() => setSourceFilter(f.id)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
                    border: "1px solid", transition: "all .15s", fontFamily: "inherit",
                    borderColor: sourceFilter === f.id ? "var(--teal)" : "var(--br)",
                    background: sourceFilter === f.id ? "rgba(0,196,160,0.12)" : "var(--c1)",
                    color: sourceFilter === f.id ? "var(--teal)" : "var(--tx2)",
                  }}>{f.icon} {f.label}</button>
                ))}
              </div>
              {SEPSIS.antibiotics.sources.filter(s => sourceFilter === "all" || s.id === sourceFilter).map((s, i) => (
                <div className="arow" key={i}>
                  <div className="asev"><span style={{ marginRight: 4 }}>{s.icon}</span>{s.source}</div>
                  <div className="abdy">
                    <div><div className="al">PRIMARY</div><div className="ad">{s.primary}</div></div>
                    <div><div className="al">ALTERNATIVE / PCN ALLERGY</div><div className="aa">{s.alt}</div></div>
                    <div><div className="al">DURATION</div><div className="an">{s.duration}</div></div>
                  </div>
                </div>
              ))}
            </>
          )}

          {abxTab === "pediatric" && SEPSIS.antibiotics.pediatric.map((r, i) => (
            <div className="arow" key={i}>
              <div className="asev"><span style={{ color: "var(--pur)" }}>👶</span>{r.age}</div>
              <div className="abdy">
                <div><div className="al">PRIMARY REGIMEN</div><div className="ad">{r.primary}</div></div>
                <div><div className="al">MODIFICATION</div><div className="aa">{r.mod}</div></div>
                <div><div className="al">CLINICAL NOTES</div><div className="an">{r.notes}</div></div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}