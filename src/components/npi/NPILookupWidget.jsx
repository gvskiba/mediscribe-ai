// NPILookupWidget.jsx
// Provider NPI search for consult documentation.
// Uses the CMS NPPES public API — no authentication required.
// Designed to be embedded in ConsultTab for provider auto-population.
//
// Props:
//   onSelect({ npi, name, credential, specialty, organization, phone, address })
//                    — called when physician selects a provider result
//   onToast(msg, type) — toast bridge (no sonner)
//   defaultSpecialty   — optional string ID from consultSpecialty state
//                        pre-fills the taxonomy search hint
//
// Constraints: no form, no localStorage, no router, straight quotes only,
//   finally { setBusy(false) }, single react import, border before borderTop

import { useState, useCallback } from "react";

// ── NPPES public API ─────────────────────────────────────────────────────────
const NPPES = "https://npiregistry.cms.hhs.gov/api/";

// ── Specialty → NPPES taxonomy hint ─────────────────────────────────────────
const SPEC_TAXONOMY = {
  cardiology:   "Cardiovascular Disease",
  ctvs:         "Thoracic Surgery (Cardiothoracic Vascular Surgery)",
  neurology:    "Neurology",
  neurosurgery: "Neurological Surgery",
  gensurg:      "General Surgery",
  ortho:        "Orthopaedic Surgery",
  urology:      "Urology",
  obgyn:        "Obstetrics & Gynecology",
  hemeonc:      "Hematology & Oncology",
  nephrology:   "Nephrology",
  gi:           "Gastroenterology",
  pulm:         "Pulmonary Disease",
  id:           "Infectious Disease",
  psych:        "Psychiatry",
  ophtho:       "Ophthalmology",
  ent:          "Otolaryngology",
};

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#050f1e", panel:"#081628", card:"#0b1e36",
  b:"rgba(26,53,85,0.8)", bhi:"rgba(42,79,122,0.9)",
  txt:"#f2f7ff", txt2:"#b8d4f0", txt3:"#82aece", txt4:"#5a82a8",
  teal:"#00e5c0", gold:"#f5c842", coral:"#ff6b6b", blue:"#3b9eff",
  orange:"#ff9f43", purple:"#9b6dff", green:"#3dffa0",
};

// ── Parse a single NPPES result into a clean provider object ─────────────────
function parseProvider(r) {
  const basic    = r.basic || {};
  const taxArr   = r.taxonomies || [];
  const addrArr  = r.addresses  || [];

  // Name — individual vs org
  const isOrg = r.enumeration_type === "NPI-2";
  const name  = isOrg
    ? (basic.organization_name || basic.name || "")
    : [basic.first_name, basic.middle_name, basic.last_name]
        .filter(Boolean).join(" ");

  const credential = basic.credential || "";

  // Primary taxonomy
  const primaryTax = taxArr.find(t => t.primary) || taxArr[0] || {};
  const specialty  = primaryTax.desc || "";

  // Location address (prefer LOCATION over MAILING)
  const addr = addrArr.find(a => a.address_purpose === "LOCATION") || addrArr[0] || {};
  const addressLine = [
    addr.address_1,
    addr.city && addr.state ? `${addr.city}, ${addr.state}` : (addr.city || addr.state),
    addr.postal_code ? addr.postal_code.slice(0, 5) : "",
  ].filter(Boolean).join(" · ");

  const phone = addr.telephone_number || "";

  return {
    npi:          r.number || "",
    name,
    credential,
    specialty,
    organization: isOrg ? name : (basic.organization_name || ""),
    phone,
    address:      addressLine,
    status:       basic.status || "",
    isOrg,
  };
}

// ── Inline input ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <div style={{ flex:1, minWidth:120 }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
        color:T.txt4, letterSpacing:1.3, textTransform:"uppercase",
        marginBottom:4 }}>{label}</div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ""}
        style={{ width:"100%",
          background:"rgba(14,37,68,0.75)",
          border:`1px solid ${value ? "rgba(42,122,160,0.55)" : "rgba(26,53,85,0.45)"}`,
          borderRadius:7, padding:"7px 10px", outline:"none",
          fontFamily: mono ? "'JetBrains Mono',monospace" : "'DM Sans',sans-serif",
          fontSize:12, color:T.txt,
          letterSpacing: mono ? 1.5 : 0,
          transition:"border-color .1s" }} />
    </div>
  );
}

// ── Provider result card ─────────────────────────────────────────────────────
function ProviderCard({ provider, onSelect, selected }) {
  const active = selected === provider.npi;
  return (
    <div style={{
      border:`1px solid ${active ? "rgba(0,229,192,0.55)" : "rgba(26,53,85,0.4)"}`,
      borderLeft:`3px solid ${active ? T.teal : "rgba(42,79,122,0.4)"}`,
      borderRadius:9,
      background: active
        ? "rgba(0,229,192,0.06)"
        : "rgba(8,22,40,0.65)",
      padding:"10px 12px",
      transition:"all .15s" }}>

      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        {/* Provider info */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Name + credential */}
          <div style={{ display:"flex", alignItems:"baseline", gap:6,
            flexWrap:"wrap", marginBottom:3 }}>
            <span style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:700, fontSize:13,
              color: active ? T.teal : T.txt }}>
              {provider.name}
            </span>
            {provider.credential && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:9, color:T.gold, letterSpacing:1 }}>
                {provider.credential}
              </span>
            )}
            {provider.status !== "A" && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace",
                fontSize:8, color:T.coral, letterSpacing:1,
                background:"rgba(255,107,107,0.1)",
                border:"1px solid rgba(255,107,107,0.3)",
                borderRadius:4, padding:"1px 5px" }}>
                INACTIVE
              </span>
            )}
          </div>

          {/* Specialty */}
          {provider.specialty && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.blue, marginBottom:3 }}>
              {provider.specialty}
            </div>
          )}

          {/* Organization (if individual with org affiliation) */}
          {!provider.isOrg && provider.organization && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
              color:T.txt4, marginBottom:3 }}>
              {provider.organization}
            </div>
          )}

          {/* NPI + address + phone */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:10,
            marginTop:4 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:T.txt4, letterSpacing:1 }}>
              NPI: <span style={{ color:T.txt3 }}>{provider.npi}</span>
            </span>
            {provider.address && (
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9,
                color:T.txt4 }}>{provider.address}</span>
            )}
            {provider.phone && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                color:T.txt4 }}>&#9742; {provider.phone}</span>
            )}
          </div>
        </div>

        {/* Select button */}
        <button onClick={() => onSelect(provider)}
          style={{ flexShrink:0,
            fontFamily:"'DM Sans',sans-serif", fontWeight:700,
            fontSize:11, padding:"6px 14px", borderRadius:8,
            cursor:"pointer", whiteSpace:"nowrap",
            transition:"all .15s",
            border:`1px solid ${active ? T.teal+"88" : "rgba(0,229,192,0.35)"}`,
            background:active
              ? "rgba(0,229,192,0.15)"
              : "rgba(0,229,192,0.07)",
            color: active ? T.teal : T.txt3 }}>
          {active ? "\u2713 Selected" : "Use Provider"}
        </button>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function NPILookupWidget({ onSelect, onToast, defaultSpecialty }) {
  const [mode,       setMode]       = useState("name"); // "name" | "npi"
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [taxonomy,   setTaxonomy]   = useState(
    defaultSpecialty ? (SPEC_TAXONOMY[defaultSpecialty] || "") : ""
  );
  const [npiDirect,  setNpiDirect]  = useState("");
  const [busy,       setBusy]       = useState(false);
  const [results,    setResults]    = useState(null);   // null = no search yet
  const [error,      setError]      = useState(null);
  const [selected,   setSelected]   = useState(null);   // selected NPI string
  const [expanded,   setExpanded]   = useState(true);

  const resultCount = results?.length || 0;

  // ── Name search ────────────────────────────────────────────────────────────
  const searchByName = useCallback(async () => {
    if (!lastName.trim() && !firstName.trim()) {
      onToast?.("Enter at least a last name to search", "error");
      return;
    }
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ version:"2.1", limit:"15" });
      if (firstName.trim()) params.set("first_name", firstName.trim());
      if (lastName.trim())  params.set("last_name",  lastName.trim());
      if (taxonomy.trim())  params.set("taxonomy_description", taxonomy.trim());

      const res  = await fetch(`${NPPES}?${params.toString()}`);
      const data = await res.json();
      const list = (data.results || []).map(parseProvider);
      setResults(list);
      if (!list.length) onToast?.("No providers found — try broader search", "error");
      else onToast?.(`${list.length} provider${list.length > 1 ? "s" : ""} found`, "success");
    } catch (e) {
      setError("NPPES API unreachable — check network and retry");
      onToast?.("NPI search failed", "error");
    } finally {
      setBusy(false);
    }
  }, [firstName, lastName, taxonomy, onToast]);

  // ── Direct NPI lookup ──────────────────────────────────────────────────────
  const searchByNPI = useCallback(async () => {
    const num = npiDirect.replace(/\D/g, "");
    if (num.length !== 10) {
      onToast?.("NPI must be exactly 10 digits", "error");
      return;
    }
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ version:"2.1", number:num });
      const res    = await fetch(`${NPPES}?${params.toString()}`);
      const data   = await res.json();
      const list   = (data.results || []).map(parseProvider);
      setResults(list);
      if (!list.length) onToast?.("NPI not found in NPPES registry", "error");
      else onToast?.("Provider found", "success");
    } catch (e) {
      setError("NPPES API unreachable — check network and retry");
      onToast?.("NPI lookup failed", "error");
    } finally {
      setBusy(false);
    }
  }, [npiDirect, onToast]);

  // ── Select provider ────────────────────────────────────────────────────────
  const handleSelect = useCallback((provider) => {
    setSelected(provider.npi);
    onSelect?.(provider);
    onToast?.(`${provider.name}${provider.credential ? ", " + provider.credential : ""} added to consult`, "success");
  }, [onSelect, onToast]);

  // ── Keyboard submit ────────────────────────────────────────────────────────
  const handleKey = (e) => {
    if (e.key === "Enter") {
      mode === "name" ? searchByName() : searchByNPI();
    }
  };

  return (
    <div style={{ marginBottom:12 }}>

      {/* ── Header / collapse ───────────────────────────────────────────── */}
      <button onClick={() => setExpanded(p => !p)}
        style={{ display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"9px 13px",
          background: expanded
            ? "linear-gradient(135deg,rgba(59,158,255,0.12),rgba(8,22,40,0.9))"
            : "rgba(8,22,40,0.6)",
          border:"1px solid rgba(42,79,122,0.4)",
          borderRadius: expanded ? "9px 9px 0 0" : 9,
          cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
        <span style={{ fontSize:14 }}>&#x1F50D;</span>
        <div style={{ flex:1 }}>
          <span style={{ fontFamily:"'Playfair Display',serif",
            fontWeight:700, fontSize:13,
            color: expanded ? T.blue : T.txt3 }}>
            NPI Provider Lookup
          </span>
          {selected && !expanded && (
            <span style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:9, color:T.teal, marginLeft:10, letterSpacing:1 }}>
              &#x2713; Provider selected
            </span>
          )}
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
          color: expanded ? T.blue : T.txt4, letterSpacing:1 }}>
          {expanded ? "&#x25B2; COLLAPSE" : "&#x25BC; EXPAND"}
        </span>
      </button>

      {expanded && (
        <div style={{ padding:"12px 13px 10px",
          background:"rgba(8,22,40,0.7)",
          border:"1px solid rgba(42,79,122,0.4)",
          borderTop:"none",
          borderRadius:"0 0 9px 9px" }}>

          {/* ── Mode toggle ─────────────────────────────────────────────── */}
          <div style={{ display:"flex", gap:5, marginBottom:12 }}>
            {[
              { id:"name", label:"Search by Name" },
              { id:"npi",  label:"Lookup by NPI #" },
            ].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setResults(null); setError(null); }}
                style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                  fontWeight:700, padding:"4px 12px", borderRadius:20,
                  cursor:"pointer", letterSpacing:1, textTransform:"uppercase",
                  transition:"all .12s",
                  border:`1px solid ${mode===m.id ? T.blue+"77" : "rgba(42,79,122,0.35)"}`,
                  background:mode===m.id ? "rgba(59,158,255,0.14)" : "transparent",
                  color:mode===m.id ? T.blue : T.txt4 }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* ── Name search inputs ───────────────────────────────────────── */}
          {mode === "name" && (
            <div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}
                onKeyDown={handleKey}>
                <Field label="First Name" value={firstName}
                  onChange={setFirstName} placeholder="e.g. James" />
                <Field label="Last Name" value={lastName}
                  onChange={setLastName} placeholder="e.g. Wilson" />
                <Field label="Specialty / Taxonomy" value={taxonomy}
                  onChange={setTaxonomy} placeholder="e.g. Cardiology" />
              </div>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:T.txt4 }}>
                  Searches CMS NPPES national registry — no auth required
                </span>
                <button onClick={searchByName} disabled={busy}
                  style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    fontSize:12, padding:"7px 18px", borderRadius:8,
                    cursor: busy ? "not-allowed" : "pointer",
                    border:`1px solid ${busy ? "rgba(42,79,122,0.3)" : "rgba(59,158,255,0.55)"}`,
                    background: busy
                      ? "rgba(42,79,122,0.15)"
                      : "linear-gradient(135deg,rgba(59,158,255,0.2),rgba(59,158,255,0.08))",
                    color: busy ? T.txt4 : T.blue,
                    transition:"all .15s" }}>
                  {busy ? "Searching..." : "Search NPPES"}
                </button>
              </div>
            </div>
          )}

          {/* ── Direct NPI input ─────────────────────────────────────────── */}
          {mode === "npi" && (
            <div>
              <div style={{ display:"flex", gap:8, alignItems:"flex-end",
                marginBottom:8 }} onKeyDown={handleKey}>
                <Field label="10-Digit NPI Number" value={npiDirect}
                  onChange={v => setNpiDirect(v.replace(/\D/g, "").slice(0, 10))}
                  placeholder="e.g. 1234567890"
                  mono={true} />
                <button onClick={searchByNPI} disabled={busy || npiDirect.length !== 10}
                  style={{ flexShrink:0,
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    fontSize:12, padding:"7px 18px", borderRadius:8,
                    cursor: busy || npiDirect.length !== 10 ? "not-allowed" : "pointer",
                    border:`1px solid ${npiDirect.length===10 ? "rgba(59,158,255,0.55)" : "rgba(42,79,122,0.3)"}`,
                    background: npiDirect.length===10
                      ? "linear-gradient(135deg,rgba(59,158,255,0.2),rgba(59,158,255,0.08))"
                      : "rgba(42,79,122,0.15)",
                    color: npiDirect.length===10 ? T.blue : T.txt4,
                    transition:"all .15s",
                    marginBottom:0 }}>
                  {busy ? "Looking up..." : "Lookup"}
                </button>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color:T.txt4, letterSpacing:1 }}>
                {npiDirect.length}/10 digits
              </div>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {error && (
            <div style={{ padding:"8px 11px", borderRadius:7,
              marginTop:8, marginBottom:4,
              background:"rgba(255,107,107,0.08)",
              border:"1px solid rgba(255,107,107,0.28)",
              fontFamily:"'DM Sans',sans-serif", fontSize:11,
              color:T.coral }}>
              {error}
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {results !== null && !busy && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8,
                color: resultCount > 0 ? T.teal : T.txt4,
                letterSpacing:1.5, textTransform:"uppercase",
                marginBottom:7 }}>
                {resultCount > 0
                  ? `${resultCount} Result${resultCount > 1 ? "s" : ""} — Select to Add to Consult`
                  : "No Results"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {results.map(p => (
                  <ProviderCard
                    key={p.npi}
                    provider={p}
                    onSelect={handleSelect}
                    selected={selected}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Footer note ──────────────────────────────────────────────── */}
          <div style={{ marginTop:10,
            fontFamily:"'JetBrains Mono',monospace", fontSize:8,
            color:"rgba(42,79,122,0.6)", letterSpacing:1,
            textTransform:"uppercase" }}>
            Data source: CMS NPPES National Plan and Provider Enumeration System
          </div>
        </div>
      )}
    </div>
  );
}