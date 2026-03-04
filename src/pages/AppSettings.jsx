import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Check, Key, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Trash2, Building2, Users, Newspaper, Globe } from "lucide-react";

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

const NEWS_API_KEY = "thenewsapi_token";
const WEBZIO_KEY = "webzio_token";
const NEWSDATA_KEY = "newsdata_token";

function SectionCard({ icon: Icon, iconColor, title, subtitle, children }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${iconColor}18`, border: `1px solid ${iconColor}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.bright }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: T.dim, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: "18px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function DarkInput({ value, onChange, placeholder, type = "text", onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", background: T.edge, border: `1.5px solid ${focused ? T.teal : T.border}`,
        borderRadius: 8, padding: "8px 12px", color: T.bright, fontSize: 12.5,
        fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
        boxSizing: "border-box"
      }}
    />
  );
}

function ApiKeySection({ storageKey, label, color, validateFn, getUrl, urlLabel, dbSettings, onSaveToken }) {
  const [inputVal, setInputVal] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [focused, setFocused] = useState(false);

  // Read from DB (passed in as prop) — fall back to localStorage for migration
  const saved = dbSettings?.[storageKey] || localStorage.getItem(storageKey) || "";

  const validate = async (token) => {
    setStatus("validating");
    setErrMsg("");
    try {
      const res = await base44.functions.invoke(validateFn, { token });
      if (res.data?.valid) {
        setStatus("valid");
        // Save to DB via parent callback AND keep localStorage as fallback
        localStorage.setItem(storageKey, token);
        onSaveToken(storageKey, token);
        setInputVal("");
      } else {
        setStatus("invalid");
        setErrMsg(res.data?.error || "Invalid token");
      }
    } catch {
      setStatus("invalid");
      setErrMsg("Validation failed — check your connection");
    }
  };

  const handleRevoke = () => {
    localStorage.removeItem(storageKey);
    onSaveToken(storageKey, "");
    setInputVal(""); setStatus(null); setErrMsg("");
  };
  const maskedKey = (k) => k ? `${k.slice(0, 8)}${"•".repeat(18)}${k.slice(-4)}` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {saved && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", background: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={14} style={{ color: T.green, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.green }}>{label} — Active</div>
              <div style={{ fontSize: 10.5, color: T.dim, fontFamily: "monospace", marginTop: 2 }}>{maskedKey(saved)}</div>
            </div>
          </div>
          <button onClick={handleRevoke} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "rgba(255,92,108,0.08)", border: "1px solid rgba(255,92,108,0.25)", color: T.red, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Trash2 size={11} /> Revoke
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type={show ? "text" : "password"}
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setStatus(null); setErrMsg(""); }}
            onKeyDown={e => e.key === "Enter" && inputVal.trim() && validate(inputVal.trim())}
            placeholder={`Paste your ${label} token…`}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: "100%", background: T.edge, border: `1.5px solid ${focused ? color : T.border}`,
              borderRadius: 8, padding: "8px 36px 8px 12px", color: T.bright, fontSize: 12,
              fontFamily: "monospace", outline: "none", transition: "border-color 0.15s", boxSizing: "border-box"
            }}
          />
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.dim, cursor: "pointer", padding: 0, display: "flex" }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={() => inputVal.trim() && validate(inputVal.trim())}
          disabled={!inputVal.trim() || status === "validating"}
          style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 11.5, fontWeight: 700,
            cursor: !inputVal.trim() || status === "validating" ? "not-allowed" : "pointer",
            background: !inputVal.trim() || status === "validating" ? T.muted : `linear-gradient(135deg, ${color}, ${color}bb)`,
            border: "none", color: T.navy, fontFamily: "inherit", whiteSpace: "nowrap",
            opacity: !inputVal.trim() ? 0.5 : 1,
            display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s"
          }}
        >
          {status === "validating"
            ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Validating…</>
            : "Validate & Save"}
        </button>
      </div>

      {status === "valid" && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: "rgba(46,204,113,0.07)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 8, fontSize: 11.5, color: T.green }}>
          <CheckCircle2 size={13} /> Token validated and saved successfully!
        </div>
      )}
      {status === "invalid" && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: "rgba(255,92,108,0.07)", border: "1px solid rgba(255,92,108,0.2)", borderRadius: 8, fontSize: 11.5, color: T.red }}>
          <AlertCircle size={13} /> {errMsg || "Invalid token — please check and try again."}
        </div>
      )}

      <div style={{ fontSize: 10.5, color: T.dim }}>
        Get a free token at{" "}
        <a href={getUrl} target="_blank" rel="noopener noreferrer"
          style={{ color: color, textDecoration: "none" }}
          onMouseEnter={e => e.target.style.textDecoration = "underline"}
          onMouseLeave={e => e.target.style.textDecoration = "none"}>
          {urlLabel}
        </a>
        . Stored locally in this browser.
      </div>
    </div>
  );
}

export default function AppSettings() {
  const [settings, setSettings] = useState(null);
  const [newAttending, setNewAttending] = useState({ name: "", specialty: "", email: "" });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: hospitalSettings, isLoading } = useQuery({
    queryKey: ["hospitalSettings"],
    queryFn: async () => {
      const results = await base44.entities.HospitalSettings.list();
      return results.length > 0 ? results[0] : null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (settings?.id) return base44.entities.HospitalSettings.update(settings.id, data);
      return base44.entities.HospitalSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitalSettings"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  useEffect(() => { if (hospitalSettings) setSettings(hospitalSettings); }, [hospitalSettings]);

  const handleInputChange = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  const handleAddAttending = () => {
    if (!newAttending.name.trim()) return;
    const id = `attending_${Date.now()}`;
    setSettings(prev => ({ ...prev, attendings: [...(prev?.attendings || []), { id, ...newAttending }] }));
    setNewAttending({ name: "", specialty: "", email: "" });
  };

  const handleRemoveAttending = (id) => setSettings(prev => ({ ...prev, attendings: prev.attendings.filter(a => a.id !== id) }));
  const handleSetDefault = (id) => setSettings(prev => ({ ...prev, default_attending_id: id }));
  const handleSave = async () => saveMutation.mutateAsync(settings);

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2.5px solid ${T.border}`, borderTopColor: T.teal, animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  const SaveButton = () => (
    <button
      onClick={handleSave}
      disabled={saveMutation.isPending}
      style={{
        padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700,
        cursor: saveMutation.isPending ? "not-allowed" : "pointer",
        background: saveSuccess
          ? `linear-gradient(135deg, ${T.green}, #27ae60)`
          : `linear-gradient(135deg, ${T.teal}, ${T.teal2})`,
        border: "none", color: T.navy, fontFamily: "inherit", transition: "all 0.2s",
        display: "flex", alignItems: "center", gap: 6
      }}
    >
      {saveMutation.isPending
        ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</>
        : saveSuccess
          ? <><Check size={13} /> Saved!</>
          : "Save Changes"}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.navy, color: T.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", animation: "fadeUp 0.35s ease both" }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.bright, marginBottom: 4 }}>App Settings</div>
          <div style={{ fontSize: 12.5, color: T.dim }}>Configure API keys, hospital information, and clinical staff</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <SectionCard icon={Newspaper} iconColor={T.teal} title="TheNewsAPI.com" subtitle="Powers the Medical News feed page">
            <ApiKeySection
              storageKey={NEWS_API_KEY}
              label="TheNewsAPI"
              color={T.teal}
              validateFn="validateNewsApiKey"
              getUrl="https://www.thenewsapi.com"
              urlLabel="thenewsapi.com"
            />
          </SectionCard>

          <SectionCard icon={Globe} iconColor={T.purple} title="Webz.io News API" subtitle="Alternative source for the Medical News feed page">
            <ApiKeySection
              storageKey={WEBZIO_KEY}
              label="Webz.io"
              color={T.purple}
              validateFn="validateWebzApiKey"
              getUrl="https://webz.io"
              urlLabel="webz.io"
            />
          </SectionCard>

          <SectionCard icon={Newspaper} iconColor="#00b4d8" title="NewsData.io" subtitle="Alternative source for the Medical News feed page">
            <ApiKeySection
              storageKey={NEWSDATA_KEY}
              label="NewsData.io"
              color="#00b4d8"
              validateFn="validateNewsdataApiKey"
              getUrl="https://newsdata.io"
              urlLabel="newsdata.io"
            />
          </SectionCard>

          <SectionCard icon={Building2} iconColor={T.amber} title="Hospital Information" subtitle="Displayed in the top bar and clinical notes">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { field: "company_name", label: "Company / Practice Name", placeholder: "e.g. Riverside Medical Group" },
                { field: "hospital_name", label: "Hospital / Facility Name", placeholder: "e.g. Riverside General Hospital" },
                { field: "address", label: "Address", placeholder: "Hospital address" },
                { field: "phone", label: "Phone", placeholder: "Main phone number" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label style={{ display: "block", fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                  <DarkInput
                    value={settings?.[field] || ""}
                    onChange={e => handleInputChange(field, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div style={{ paddingTop: 4 }}><SaveButton /></div>
            </div>
          </SectionCard>

          <SectionCard icon={Users} iconColor={T.teal} title="Attending Physicians" subtitle="The default attending is shown in the top bar">
            <div style={{ background: T.edge, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Add New Physician</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { key: "name", placeholder: "Full Name" },
                  { key: "specialty", placeholder: "Specialty" },
                  { key: "email", placeholder: "Email" },
                ].map(({ key, placeholder }) => (
                  <DarkInput
                    key={key}
                    value={newAttending[key]}
                    onChange={e => setNewAttending(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    onKeyDown={e => e.key === "Enter" && handleAddAttending()}
                  />
                ))}
              </div>
              <button
                onClick={handleAddAttending}
                disabled={!newAttending.name.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7,
                  background: newAttending.name.trim() ? `linear-gradient(135deg, ${T.teal}, ${T.teal2})` : T.muted,
                  border: "none", color: T.navy, fontSize: 11.5, fontWeight: 700,
                  cursor: newAttending.name.trim() ? "pointer" : "not-allowed",
                  fontFamily: "inherit", opacity: newAttending.name.trim() ? 1 : 0.5, transition: "all 0.15s"
                }}
              >
                <Plus size={13} /> Add Physician
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {!settings?.attendings?.length ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: T.dim }}>No attending physicians added yet</div>
              ) : (
                settings.attendings.map((a) => {
                  const isDefault = settings.default_attending_id === a.id;
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      padding: "10px 14px",
                      background: isDefault ? "rgba(0,212,188,0.05)" : T.edge,
                      border: `1px solid ${isDefault ? "rgba(0,212,188,0.25)" : T.border}`,
                      borderRadius: 9, transition: "all 0.15s"
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.bright }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
                          {[a.specialty, a.email].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => handleSetDefault(a.id)}
                          style={{
                            padding: "4px 10px", borderRadius: 6, fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                            background: isDefault ? "rgba(0,212,188,0.12)" : "transparent",
                            border: `1px solid ${isDefault ? "rgba(0,212,188,0.35)" : T.border}`,
                            color: isDefault ? T.teal : T.dim, fontFamily: "inherit", transition: "all 0.15s",
                            display: "flex", alignItems: "center", gap: 4
                          }}
                          onMouseEnter={e => { if (!isDefault) { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; } }}
                          onMouseLeave={e => { if (!isDefault) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; } }}
                        >
                          {isDefault ? <><Check size={10} /> Default</> : "Set Default"}
                        </button>
                        <button onClick={() => handleRemoveAttending(a.id)}
                          style={{
                            width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "transparent", border: `1px solid ${T.border}`, color: T.dim, cursor: "pointer", transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,92,108,0.4)"; e.currentTarget.style.color = T.red; e.currentTarget.style.background = "rgba(255,92,108,0.06)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; e.currentTarget.style.background = "transparent"; }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {settings?.attendings?.length > 0 && (
              <div style={{ marginTop: 14 }}><SaveButton /></div>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}