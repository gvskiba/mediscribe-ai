import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Color tokens — identical to the rest of the Notrya app ─────────
const C = {
  navy:"#050f1e", slate:"#0b1d35", panel:"#0d2240", edge:"#162d4f",
  border:"#1e3a5f", muted:"#2a4d72", dim:"#4a7299", text:"#c8ddf0",
  bright:"#e8f4ff", teal:"#00d4bc", amber:"#f5a623", red:"#ff5c6c",
  green:"#2ecc71", purple:"#9b6dff", blue:"#4a90d9", rose:"#f472b6", gold:"#f0c040",
};

// ── Sidebar nav sections ───────────────────────────────────────────
const ACCOUNT_SECTIONS = [
  { id:"profile",       icon:"👤", label:"Profile",           sub:"Name, credentials, photo"    },
  { id:"credentials",   icon:"🏥", label:"Clinical Info",     sub:"Specialty, license, NPI"     },
  { id:"preferences",   icon:"⚙️", label:"Preferences",       sub:"Display, notifications"      },
  { id:"security",      icon:"🔒", label:"Security",          sub:"Password, 2FA, sessions"     },
  { id:"integrations",  icon:"🔗", label:"Integrations",      sub:"EHR, lab, imaging links"     },
  { id:"activity",      icon:"📋", label:"Activity Log",      sub:"Recent actions"              },
];

// ── Specialty options ──────────────────────────────────────────────
const SPECIALTIES = [
  "Emergency Medicine","Internal Medicine","Pediatrics","Surgery","Obstetrics & Gynecology",
  "Anesthesiology","Radiology","Psychiatry","Neurology","Cardiology","Pulmonology",
  "Infectious Disease","Hospitalist","Family Medicine","Critical Care","Other",
];

// ── Role options ───────────────────────────────────────────────────
const ROLES = ["Attending Physician","Resident","Fellow","Nurse Practitioner","Physician Assistant","Registered Nurse","Medical Student","Other"];

// ── Shared Card ────────────────────────────────────────────────────
function Card({ title, icon, badge, badgeColor = C.blue, children, style = {} }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", ...style }}>
      <div style={{ padding:"10px 16px", background:"rgba(0,0,0,.18)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        {icon && <span style={{ fontSize:14 }}>{icon}</span>}
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.dim, letterSpacing:".1em", flex:1 }}>{title}</span>
        {badge && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:7, background:`${badgeColor}18`, border:`1px solid ${badgeColor}44`, color:badgeColor }}>{badge}</span>}
      </div>
      <div style={{ padding:"16px" }}>{children}</div>
    </div>
  );
}

// ── Field label ────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:5 }}>
    {children}
  </div>
);

// ── Input styles ───────────────────────────────────────────────────
const inputStyle = {
  width:"100%", background:C.edge, border:`1px solid ${C.border}`, borderRadius:9,
  padding:"9px 11px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none",
};
const selectStyle = {
  ...inputStyle, cursor:"pointer", appearance:"none",
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%234a7299'/%3E%3C/svg%3E")`,
  backgroundRepeat:"no-repeat", backgroundPosition:"calc(100% - 10px) center",
};

// ── Toggle Switch ──────────────────────────────────────────────────
function Toggle({ value, onChange, color = C.teal }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width:40, height:22, borderRadius:11, background:value ? color : C.edge, border:`1px solid ${value ? color : C.border}`, cursor:"pointer", position:"relative", transition:"all .2s", flexShrink:0 }}>
      <div style={{ width:16, height:16, borderRadius:"50%", background:value ? C.navy : C.dim, position:"absolute", top:2, left:value ? 20 : 2, transition:"left .2s" }} />
    </div>
  );
}

// ── Avatar initials ────────────────────────────────────────────────
function Avatar({ name, size = 72, color = C.teal }) {
  const initials = name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "??";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color}22,${color}44)`, border:`2px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:size * 0.34, fontWeight:700, color:color }}>{initials}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function UserAccount() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clock, setClock] = useState("");
  const [section, setSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  // ── User state ─────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Attending Physician",
    specialty: "Emergency Medicine",
    institution: "",
    department: "",
    npi: "",
    licenseNumber: "",
    licenseState: "",
    deaNumber: "",
    bio: "",
  });

  const [prefs, setPrefs] = useState({
    darkMode: true,
    compactView: false,
    autoSave: true,
    showVitalAlerts: true,
    showLabAlerts: true,
    aiAssistEnabled: true,
    defaultTab: "patient_intake",
    fontSize: "medium",
    timezone: "America/Chicago",
    notifyOnSign: true,
    notifyOnResult: true,
    notifyOnMessage: true,
    soundAlerts: false,
    twoFactor: false,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ── Clock ──────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setClock(new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false })), 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Fetch current user (Base44 auth) ──────────────────────────
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // ── Hydrate from Base44 user ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setProfile(prev => ({
      ...prev,
      firstName: currentUser.first_name || prev.firstName,
      lastName:  currentUser.last_name  || prev.lastName,
      email:     currentUser.email      || prev.email,
    }));
  }, [currentUser?.id]);

  // ── Save profile mutation ──────────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateProfile({
        first_name: profile.firstName,
        last_name:  profile.lastName,
        email:      profile.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile saved");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => toast.error("Save failed: " + err.message),
  });

  const handleSave = async () => {
    setSaving(true);
    try { await saveProfileMutation.mutateAsync(); }
    finally { setSaving(false); }
  };

  const updateProfile = (key, val) => setProfile(prev => ({ ...prev, [key]: val }));
  const updatePrefs   = (key, val) => setPrefs(prev => ({ ...prev, [key]: val }));

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  const ACTIVITY = [];

  const activityIcon = { sign:"✍️", create:"📝", lab:"🧪", med:"💊", export:"📤", login:"🔐" };

  const INTEGRATIONS = [];

  const statusColor = { connected:C.green, pending:C.amber, disconnected:C.muted };
  const statusLabel = { connected:"CONNECTED", pending:"PENDING", disconnected:"DISCONNECTED" };

  // ── Render section content ─────────────────────────────────────
  const renderSection = () => {
    switch (section) {

      // ── PROFILE ──────────────────────────────────────────────
      case "profile": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Avatar + name hero */}
          <Card title="PROFILE OVERVIEW" icon="👤">
            <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:18 }}>
              <Avatar name={fullName} size={80} color={C.teal} />
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>{fullName || "Your Name"}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim, marginTop:3 }}>{profile.role} · {profile.specialty}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted, marginTop:2 }}>{profile.institution}</div>
              </div>
              <div style={{ flex:1 }} />
              <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"3px 10px", borderRadius:8, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.28)", color:C.teal }}>● ACTIVE</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>NPI {profile.npi}</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <Label>FIRST NAME</Label>
                <input value={profile.firstName} onChange={e => updateProfile("firstName", e.target.value)} style={inputStyle} placeholder="First name" />
              </div>
              <div>
                <Label>LAST NAME</Label>
                <input value={profile.lastName} onChange={e => updateProfile("lastName", e.target.value)} style={inputStyle} placeholder="Last name" />
              </div>
              <div>
                <Label>EMAIL ADDRESS</Label>
                <input value={profile.email} onChange={e => updateProfile("email", e.target.value)} style={inputStyle} placeholder="you@hospital.org" type="email" />
              </div>
              <div>
                <Label>PHONE</Label>
                <input value={profile.phone} onChange={e => updateProfile("phone", e.target.value)} style={inputStyle} placeholder="+1 (000) 000-0000" />
              </div>
              <div>
                <Label>ROLE</Label>
                <select value={profile.role} onChange={e => updateProfile("role", e.target.value)} style={selectStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label>INSTITUTION</Label>
                <input value={profile.institution} onChange={e => updateProfile("institution", e.target.value)} style={inputStyle} placeholder="Hospital / Clinic" />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <Label>BIO</Label>
              <textarea value={profile.bio} onChange={e => updateProfile("bio", e.target.value)} rows={3} style={{ ...inputStyle, resize:"vertical", lineHeight:1.65 }} placeholder="Brief professional bio..." />
            </div>
          </Card>
        </div>
      );

      // ── CLINICAL INFO ─────────────────────────────────────────
      case "credentials": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="CLINICAL CREDENTIALS" icon="🏥" badge="Verified" badgeColor={C.green}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <Label>SPECIALTY</Label>
                <select value={profile.specialty} onChange={e => updateProfile("specialty", e.target.value)} style={selectStyle}>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>DEPARTMENT</Label>
                <input value={profile.department} onChange={e => updateProfile("department", e.target.value)} style={inputStyle} placeholder="Emergency Department" />
              </div>
              <div>
                <Label>NPI NUMBER</Label>
                <input value={profile.npi} onChange={e => updateProfile("npi", e.target.value)} style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace" }} placeholder="10-digit NPI" />
              </div>
              <div>
                <Label>DEA NUMBER</Label>
                <input value={profile.deaNumber} onChange={e => updateProfile("deaNumber", e.target.value)} style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace" }} placeholder="DEA registration #" />
              </div>
              <div>
                <Label>LICENSE NUMBER</Label>
                <input value={profile.licenseNumber} onChange={e => updateProfile("licenseNumber", e.target.value)} style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace" }} placeholder="State license #" />
              </div>
              <div>
                <Label>LICENSE STATE</Label>
                <input value={profile.licenseState} onChange={e => updateProfile("licenseState", e.target.value)} style={inputStyle} placeholder="Missouri" />
              </div>
            </div>
          </Card>

          <Card title="SIGNATURE & NOTE DEFAULTS" icon="✍️">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <Label>DEFAULT NOTE TYPE</Label>
                <select style={selectStyle} defaultValue="ED Visit">
                  {["ED Visit","Progress Note","Discharge Summary","Consult","Procedure Note"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>DEFAULT DISPOSITION</Label>
                <select style={selectStyle} defaultValue="">
                  <option value="">No default</option>
                  {["Discharge Home","Admit — Floor","Admit — ICU","Observation"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <Label>ELECTRONIC SIGNATURE TEXT</Label>
            <input defaultValue={`Electronically signed by ${fullName}, ${profile.role}`} style={inputStyle} />
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:5 }}>Appended to all finalized notes</div>
          </Card>
        </div>
      );

      // ── PREFERENCES ───────────────────────────────────────────
      case "preferences": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="DISPLAY & LAYOUT" icon="🖥️">
            {[
              { key:"compactView",       label:"Compact View",            sub:"Denser layout with smaller spacing"          },
              { key:"aiAssistEnabled",   label:"AI Assistant (Notrya AI)",sub:"Floating AI button and sidebar analysis"     },
            ].map(item => (
              <div key={item.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:C.bright }}>{item.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:2 }}>{item.sub}</div>
                </div>
                <Toggle value={prefs[item.key]} onChange={val => updatePrefs(item.key, val)} />
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
              <div>
                <Label>FONT SIZE</Label>
                <select value={prefs.fontSize} onChange={e => updatePrefs("fontSize", e.target.value)} style={selectStyle}>
                  {["small","medium","large"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <Label>TIMEZONE</Label>
                <select value={prefs.timezone} onChange={e => updatePrefs("timezone", e.target.value)} style={selectStyle}>
                  {["America/Chicago","America/New_York","America/Denver","America/Los_Angeles","America/Phoenix","UTC"].map(tz => <option key={tz} value={tz}>{tz.replace("America/","").replace("_"," ")}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card title="ALERTS & NOTIFICATIONS" icon="🔔">
            {[
              { key:"showVitalAlerts",  label:"Critical Vital Alerts",   sub:"Flag out-of-range vitals in Studio",        color:C.red    },
              { key:"showLabAlerts",    label:"Abnormal Lab Flags",       sub:"Highlight critical lab values",             color:C.amber  },
              { key:"autoSave",         label:"Auto-Save Notes",          sub:"Save draft every 30 seconds",              color:C.teal   },
              { key:"notifyOnSign",     label:"Notify on Note Signed",    sub:"Push notification when co-signed",          color:C.blue   },
              { key:"notifyOnResult",   label:"Notify on Lab Result",     sub:"Alert when results return",                 color:C.green  },
              { key:"notifyOnMessage",  label:"Notify on Message",        sub:"Secure messaging notifications",            color:C.purple },
              { key:"soundAlerts",      label:"Sound Alerts",             sub:"Audio notification for critical values",    color:C.rose   },
            ].map((item, i, arr) => (
              <div key={item.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:item.color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:C.bright }}>{item.label}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:2 }}>{item.sub}</div>
                  </div>
                </div>
                <Toggle value={prefs[item.key]} onChange={val => updatePrefs(item.key, val)} color={item.color} />
              </div>
            ))}
          </Card>
        </div>
      );

      // ── SECURITY ──────────────────────────────────────────────
      case "security": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="CHANGE PASSWORD" icon="🔑">
            <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:420 }}>
              {[
                { key:"currentPassword", label:"CURRENT PASSWORD",  placeholder:"Enter current password"  },
                { key:"newPassword",     label:"NEW PASSWORD",       placeholder:"Min 12 characters"       },
                { key:"confirmPassword", label:"CONFIRM NEW PASSWORD",placeholder:"Repeat new password"   },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <input type="password" value={security[f.key]} onChange={e => setSecurity(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} placeholder={f.placeholder} />
                </div>
              ))}
              <button style={{ padding:"9px 18px", borderRadius:10, background:`linear-gradient(135deg,${C.teal},#00b8a5)`, border:"none", color:C.navy, fontSize:13, fontWeight:700, cursor:"pointer", marginTop:4, alignSelf:"flex-start" }}>
                Update Password
              </button>
            </div>
          </Card>

          <Card title="TWO-FACTOR AUTHENTICATION" icon="📱" badge={prefs.twoFactor ? "ENABLED" : "DISABLED"} badgeColor={prefs.twoFactor ? C.green : C.dim}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:C.bright }}>Authenticator App (TOTP)</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:2 }}>Use Google Authenticator, Authy, or similar</div>
              </div>
              <Toggle value={prefs.twoFactor} onChange={val => updatePrefs("twoFactor", val)} color={C.green} />
            </div>
            {!prefs.twoFactor && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(245,166,35,.07)", border:"1px solid rgba(245,166,35,.28)", fontSize:12, color:C.amber }}>
                ⚠ 2FA is not enabled. We recommend enabling it for HIPAA-compliant access security.
              </div>
            )}
          </Card>

          <Card title="ACTIVE SESSIONS" icon="💻" badge="3 SESSIONS" badgeColor={C.blue}>
            {[
              { device:"Chrome · macOS",  location:"Macon, MO",    time:"Current session", current:true  },
              { device:"Safari · iPhone", location:"Macon, MO",    time:"2 hr ago",        current:false },
              { device:"Chrome · Windows",location:"St. Louis, MO",time:"Yesterday",       current:false },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i < 2 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize:18 }}>{s.device.includes("iPhone") ? "📱" : "💻"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.bright }}>{s.device}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:2 }}>{s.location} · {s.time}</div>
                </div>
                {s.current
                  ? <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:7, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.28)", color:C.teal }}>THIS DEVICE</span>
                  : <button style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:"rgba(255,92,108,.08)", border:"1px solid rgba(255,92,108,.28)", color:C.red }}>Revoke</button>
                }
              </div>
            ))}
            <button style={{ marginTop:10, padding:"7px 14px", borderRadius:9, background:"rgba(255,92,108,.07)", border:"1px solid rgba(255,92,108,.28)", color:C.red, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              Sign Out All Other Sessions
            </button>
          </Card>

          {/* Danger zone */}
          <Card title="DANGER ZONE" icon="⚠️" badgeColor={C.red}>
            <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(255,92,108,.05)", border:"1px solid rgba(255,92,108,.28)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.red, marginBottom:4 }}>Delete Account</div>
              <div style={{ fontSize:12, color:C.dim, lineHeight:1.65, marginBottom:12 }}>Permanently delete your account and all associated data. This action cannot be undone. All clinical notes remain in the system per retention policy.</div>
              {!showDeleteConfirm
                ? <button onClick={() => setShowDeleteConfirm(true)} style={{ padding:"7px 14px", borderRadius:9, background:"rgba(255,92,108,.1)", border:"1px solid rgba(255,92,108,.35)", color:C.red, fontSize:12, fontWeight:700, cursor:"pointer" }}>Request Account Deletion</button>
                : (
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.red, marginBottom:6 }}>TYPE YOUR EMAIL TO CONFIRM</div>
                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder={profile.email} style={{ ...inputStyle, border:"1px solid rgba(255,92,108,.5)", marginBottom:8 }} />
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }} style={{ padding:"6px 14px", borderRadius:8, background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:12, cursor:"pointer" }}>Cancel</button>
                      <button disabled={deleteInput !== profile.email} style={{ padding:"6px 14px", borderRadius:8, background:deleteInput === profile.email ? "rgba(255,92,108,.2)" : "transparent", border:`1px solid ${deleteInput === profile.email ? "rgba(255,92,108,.5)" : C.border}`, color:deleteInput === profile.email ? C.red : C.muted, fontSize:12, fontWeight:700, cursor:deleteInput === profile.email ? "pointer" : "not-allowed" }}>
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )
              }
            </div>
          </Card>
        </div>
      );

      // ── INTEGRATIONS ──────────────────────────────────────────
      case "integrations": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="SYSTEM INTEGRATIONS" icon="🔗" badge={`${INTEGRATIONS.filter(i=>i.status==="connected").length} CONNECTED`} badgeColor={C.green}>
            {INTEGRATIONS.map((intg, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:i < INTEGRATIONS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:C.edge, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{intg.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.bright }}>{intg.name}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:2 }}>{intg.note}</div>
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:7, background:`${statusColor[intg.status]}15`, border:`1px solid ${statusColor[intg.status]}35`, color:statusColor[intg.status], flexShrink:0 }}>
                  {statusLabel[intg.status]}
                </span>
                <button style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:"transparent", border:`1px solid ${C.border}`, color:C.dim, flexShrink:0 }}>
                  {intg.status === "connected" ? "Manage" : "Configure"}
                </button>
              </div>
            ))}
          </Card>

          <Card title="API ACCESS" icon="⚡" badge="DEVELOPER" badgeColor={C.purple}>
            <div style={{ marginBottom:12 }}>
              <Label>YOUR API KEY</Label>
              <div style={{ display:"flex", gap:8 }}>
                <input readOnly value="ntr_sk_••••••••••••••••••••••••••••••••" style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace", fontSize:12, flex:1 }} />
                <button style={{ padding:"8px 14px", borderRadius:9, background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:12, cursor:"pointer", flexShrink:0 }}>Reveal</button>
                <button style={{ padding:"8px 14px", borderRadius:9, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.28)", color:C.purple, fontSize:12, cursor:"pointer", flexShrink:0, fontWeight:600 }}>Regenerate</button>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:5 }}>⚠ Keep this key secret. Do not share or commit to version control.</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[{label:"API Calls Today",value:"142",c:C.teal},{label:"Rate Limit",value:"1,000/hr",c:C.blue},{label:"Plan",value:"Clinical Pro",c:C.purple}].map(s=>(
                <div key={s.label} style={{ background:C.edge, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.border}`, textAlign:"center" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:s.c }}>{s.value}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      // ── ACTIVITY LOG ──────────────────────────────────────────
      case "activity": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="RECENT ACTIVITY" icon="📋" badge="LAST 24 HR" badgeColor={C.blue}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i < ACTIVITY.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:32, height:32, borderRadius:9, background:C.edge, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{activityIcon[a.type]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:C.bright }}>{a.action}</div>
                  {a.patient !== "—" && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:1 }}>Patient: {a.patient}</div>}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted, flexShrink:0 }}>{a.time}</div>
              </div>
            ))}
            <button style={{ marginTop:10, padding:"7px 14px", borderRadius:9, background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:12, cursor:"pointer" }}>
              Load More →
            </button>
          </Card>

          <Card title="USAGE STATS — THIS MONTH" icon="📊">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[
                {label:"Notes Created",value:"47",  sub:"↑ 12% vs last mo", c:C.teal  },
                {label:"Notes Signed", value:"44",  sub:"94% sign rate",    c:C.green },
                {label:"AI Assists",   value:"189", sub:"Avg 4/note",       c:C.purple},
                {label:"Avg Note Time",value:"6.2m",sub:"↓ 18% vs last mo",c:C.blue  },
              ].map(s => (
                <div key={s.label} style={{ background:C.edge, borderRadius:12, padding:"12px 10px", border:`1px solid ${C.border}`, textAlign:"center" }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color:s.c }}>{s.value}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:3 }}>{s.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:3 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      default: return null;
    }
  };

  // ── Main render ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.navy, height:"100vh", color:C.text, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input,textarea,select{transition:border-color .15s}
        input:focus,textarea:focus,select:focus{border-color:#4a7299 !important;outline:none}
        input::placeholder,textarea::placeholder{color:#2a4d72}
        select option{background:#0b1d35}
        button:hover{filter:brightness(1.08)}
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav style={{ height:52, background:"rgba(11,29,53,.97)", borderBottom:`1px solid ${C.border}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0, zIndex:100 }}>
        <span onClick={() => navigate(createPageUrl("Home"))} style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:C.bright, cursor:"pointer", letterSpacing:"-.02em" }}>Notrya</span>
        <div style={{ width:1, height:16, background:C.border }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:C.teal, letterSpacing:".12em" }}>ACCOUNT SETTINGS</span>
        <div style={{ flex:1 }} />

        {/* Quick-nav back to clinical pages */}
        <div style={{ display:"flex", gap:5 }}>
          {[
            { label:"📝 Notes",    page:"ClinicalNoteStudio", c:C.teal   },
            { label:"🧬 Drugs",    page:"DrugsBugs",          c:C.green  },
          ].map(p => (
            <button key={p.page} onClick={() => navigate(createPageUrl(p.page))} style={{ padding:"4px 11px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${p.c}44`, background:`${p.c}0e`, color:p.c, transition:"all .15s" }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:16, background:C.border }} />

        {/* User pill */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 10px", borderRadius:10, background:C.edge, border:`1px solid ${C.border}` }}>
          <Avatar name={fullName} size={26} color={C.teal} />
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:C.bright, lineHeight:1.2 }}>{fullName}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim }}>{profile.specialty}</div>
          </div>
        </div>

        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.dim }}>{clock}</span>
      </nav>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* ── Left Sidebar ────────────────────────────────────── */}
        <div style={{ width:228, flexShrink:0, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* User summary */}
          <div style={{ padding:"16px 14px 12px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
              <Avatar name={fullName} size={44} color={C.teal} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:C.bright, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fullName}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.dim, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{profile.email}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:5 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:6, background:"rgba(0,212,188,.1)", border:"1px solid rgba(0,212,188,.25)", color:C.teal }}>● ACTIVE</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:700, padding:"2px 7px", borderRadius:6, background:"rgba(74,144,217,.08)", border:`1px solid ${C.border}`, color:C.blue }}>{profile.role}</span>
            </div>
          </div>

          {/* Nav */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
            {ACCOUNT_SECTIONS.map(sec => {
              const isActive = section === sec.id;
              return (
                <div key={sec.id} onClick={() => setSection(sec.id)} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:10, cursor:"pointer", marginBottom:2, transition:"all .15s", background:isActive ? "rgba(0,212,188,.08)" : "transparent", border:`1px solid ${isActive ? "rgba(0,212,188,.3)" : "transparent"}` }}>
                  <div style={{ fontSize:15, width:22, textAlign:"center", flexShrink:0 }}>{sec.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:isActive ? C.teal : C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sec.label}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:1 }}>{sec.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sign out */}
          <div style={{ padding:"10px", borderTop:`1px solid ${C.border}` }}>
            <button onClick={() => base44.auth.logout().then(() => navigate(createPageUrl("Home")))} style={{ width:"100%", padding:"8px", borderRadius:10, background:"rgba(255,92,108,.07)", border:"1px solid rgba(255,92,108,.28)", color:C.red, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Section header + save button */}
          <div style={{ padding:"12px 20px", background:C.slate, borderBottom:`1px solid ${C.border}`, flexShrink:0, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:18 }}>{ACCOUNT_SECTIONS.find(s => s.id === section)?.icon}</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright, letterSpacing:"-.02em" }}>
                {ACCOUNT_SECTIONS.find(s => s.id === section)?.label}
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:1 }}>
                {ACCOUNT_SECTIONS.find(s => s.id === section)?.sub}
              </div>
            </div>
            <div style={{ flex:1 }} />
            {["profile","credentials","preferences"].includes(section) && (
              <button onClick={handleSave} disabled={saving} style={{ padding:"7px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:saving ? "not-allowed" : "pointer", border:`1px solid ${saved ? "rgba(46,204,113,.4)" : C.border}`, background:saved ? "rgba(46,204,113,.1)" : `linear-gradient(135deg,${C.teal},#00b8a5)`, color:saved ? C.green : saving ? C.dim : C.navy, transition:"all .2s", opacity:saving ? .6 : 1 }}>
                {saving ? "Saving…" : saved ? "✓ Saved" : "💾 Save Changes"}
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div style={{ flex:1, overflowY:"auto" }}>
            <AnimatePresence mode="wait">
              <motion.div key={section} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} transition={{ duration:.15 }}>
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}