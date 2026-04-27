// UserPreferences.jsx
// Provider name, credentials, facility, default encounter type, format mode
// Stored in UserPreferences entity — loaded by QuickNote on mount

import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

(() => {
  if (document.getElementById("up-css")) return;
  const s = document.createElement("style"); s.id = "up-css";
  s.textContent = `
    :root{--up-bg:#050f1e;--up-txt:#f2f7ff;--up-txt2:#b8d4f0;--up-txt3:#82aece;
          --up-txt4:#6b9ec8;--up-teal:#00e5c0;--up-bd:rgba(42,79,122,0.4);}
    .up-input{background:rgba(14,37,68,.75);border:1px solid var(--up-bd);border-radius:9px;
      padding:9px 13px;color:var(--up-txt);font-family:"DM Sans",sans-serif;font-size:13px;
      outline:none;width:100%;box-sizing:border-box;transition:border-color .15s;}
    .up-input:focus{border-color:rgba(0,229,192,.5);}
    .up-input::placeholder{color:rgba(130,174,206,.3);}
    .up-label{font-family:"JetBrains Mono",monospace;font-size:9px;font-weight:700;
      color:var(--up-txt4);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:5px;}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("up-fonts")) {
    const l = document.createElement("link"); l.id="up-fonts"; l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

const ENC_TYPES = [
  { id:"adult",  label:"Adult ED"  },
  { id:"peds",   label:"Pediatric" },
  { id:"psych",  label:"Psych"     },
  { id:"trauma", label:"Trauma"    },
  { id:"obs",    label:"Observation"},
];

export default function UserPreferences() {
  const [prefs,    setPrefs]    = useState(null);
  const [prefId,   setPrefId]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  // Field state
  const [providerName,   setProviderName]   = useState("");
  const [credentials,    setCredentials]    = useState("");
  const [facility,       setFacility]       = useState("");
  const [location,       setLocation]       = useState("Emergency Department");
  const [defaultEncType, setDefaultEncType] = useState("adult");
  const [formatMode,     setFormatMode]     = useState("plain");
  const [sigBlock,       setSigBlock]       = useState("");

  useEffect(() => {
    base44.entities.UserPreferences.list({ sort:"-created_date", limit:1 })
      .then(results => {
        const r = results?.[0];
        if (r) {
          setPrefId(r.id);
          setProviderName(r.provider_name    || "");
          setCredentials(r.credentials       || "");
          setFacility(r.facility             || "");
          setLocation(r.location             || "Emergency Department");
          setDefaultEncType(r.default_encounter_type || "adult");
          setFormatMode(r.format_mode        || "plain");
          setSigBlock(r.signature_block      || "");
          setPrefs(r);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    if (!providerName.trim()) { setError("Provider name is required."); return; }
    setSaving(true); setError(null);
    const payload = {
      provider_name:          providerName.trim(),
      credentials:            credentials.trim(),
      facility:               facility.trim(),
      location:               location.trim(),
      default_encounter_type: defaultEncType,
      format_mode:            formatMode,
      signature_block:        sigBlock.trim(),
    };
    try {
      if (prefId) {
        await base44.entities.UserPreferences.update(prefId, payload);
      } else {
        const rec = await base44.entities.UserPreferences.create(payload);
        if (rec?.id) setPrefId(rec.id);
      }
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Save failed: " + (e.message || "try again"));
    } finally {
      setSaving(false);
    }
  }, [prefId, providerName, credentials, facility, location, defaultEncType, formatMode, sigBlock]);

  const Field = ({ label, children }) => (
    <div style={{ marginBottom:16 }}>
      <div className="up-label">{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--up-bg)",
      fontFamily:"'DM Sans',sans-serif", color:"var(--up-txt)",
      padding:"28px 24px 60px" }}>
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        <button onClick={() => window.history.back()}
          style={{ marginBottom:16, display:"inline-flex", alignItems:"center", gap:7,
            fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
            background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
            borderRadius:8, padding:"5px 14px", color:"var(--up-txt3)", cursor:"pointer" }}>
          ← Back
        </button>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
          fontSize:"clamp(22px,4vw,32px)", letterSpacing:-.4,
          margin:"0 0 6px", color:"var(--up-txt)" }}>Provider Preferences</h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
          color:"var(--up-txt4)", margin:"0 0 28px", lineHeight:1.6 }}>
          Saved once — auto-populates every QuickNote copy output with your name,
          credentials, and facility. Sets your default encounter type and format.
        </p>

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0",
            fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"var(--up-txt4)" }}>
            Loading…
          </div>
        ) : (
          <div style={{ background:"rgba(8,22,40,.65)", border:"1px solid rgba(42,79,122,.4)",
            borderRadius:14, padding:"24px" }}>

            <Field label="Provider Name *">
              <input className="up-input" value={providerName}
                onChange={e => setProviderName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith" />
            </Field>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <Field label="Credentials">
                <input className="up-input" value={credentials}
                  onChange={e => setCredentials(e.target.value)}
                  placeholder="MD, DO, PA-C, NP…" />
              </Field>
              <Field label="Facility">
                <input className="up-input" value={facility}
                  onChange={e => setFacility(e.target.value)}
                  placeholder="e.g. Spencer Hospital" />
              </Field>
            </div>

            <Field label="Department / Location">
              <input className="up-input" value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Emergency Department" />
            </Field>

            <Field label="Default Encounter Type">
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {ENC_TYPES.map(t => (
                  <button key={t.id} onClick={() => setDefaultEncType(t.id)}
                    style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                      transition:"all .15s",
                      border:`1px solid ${defaultEncType === t.id ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.4)"}`,
                      background:defaultEncType === t.id ? "rgba(0,229,192,.12)" : "rgba(14,37,68,.5)",
                      color:defaultEncType === t.id ? "var(--up-teal)" : "var(--up-txt3)" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Default Copy Format">
              <div style={{ display:"flex", gap:6 }}>
                {[["plain","Plain Text — works in all EHRs"],["epic","Epic — SmartText compatible"]].map(([v,l]) => (
                  <button key={v} onClick={() => setFormatMode(v)}
                    style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:12,
                      transition:"all .15s",
                      border:`1px solid ${formatMode === v ? "rgba(0,229,192,.5)" : "rgba(42,79,122,.4)"}`,
                      background:formatMode === v ? "rgba(0,229,192,.12)" : "rgba(14,37,68,.5)",
                      color:formatMode === v ? "var(--up-teal)" : "var(--up-txt3)" }}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Signature Block (optional)">
              <textarea className="up-input" value={sigBlock}
                onChange={e => setSigBlock(e.target.value)}
                rows={3} style={{ resize:"vertical" }}
                placeholder={"Dr. Jane Smith, MD\nSpencer Hospital Emergency Department\n555-867-5309"} />
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:"var(--up-txt4)", marginTop:4, lineHeight:1.5 }}>
                Appended to Copy Phase 1 and Copy Phase 2 outputs
              </div>
            </Field>

            {error && (
              <div style={{ marginBottom:12, padding:"7px 11px", borderRadius:7,
                background:"rgba(255,107,107,.08)", border:"1px solid rgba(255,107,107,.3)",
                fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#ff6b6b" }}>
                {error}
              </div>
            )}

            <button onClick={save} disabled={saving}
              style={{ padding:"10px 24px", borderRadius:9, cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:13,
                border:`1px solid ${saved ? "rgba(61,255,160,.5)" : "rgba(0,229,192,.5)"}`,
                background:saved ? "rgba(61,255,160,.15)" : "rgba(0,229,192,.12)",
                color:saved ? "#3dffa0" : "var(--up-teal)",
                opacity:saving ? .6 : 1, transition:"all .15s" }}>
              {saving ? "Saving…" : saved ? "✓ Preferences Saved" : "Save Preferences"}
            </button>
          </div>
        )}

        <div style={{ marginTop:24, textAlign:"center",
          fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color:"rgba(107,158,200,.4)", letterSpacing:1.5 }}>
          NOTRYA PROVIDER PREFERENCES · STORED LOCALLY TO YOUR ACCOUNT
        </div>
      </div>
    </div>
  );
}