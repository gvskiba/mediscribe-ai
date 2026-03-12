import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X, Plus, Check, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Trash2, Building2, Users, Newspaper, Globe, GripVertical, Edit } from "lucide-react";

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
  { id:"quick_nav",     icon:"🚀", label:"Quick Navigation",  sub:"Customize home page links"   },
  { id:"security",      icon:"🔒", label:"Security",          sub:"Password, 2FA, sessions"     },
  { id:"app_settings",  icon:"🔧", label:"App Settings",      sub:"Hospital, API, Dashboard"    },
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

// ── Available app pages ────────────────────────────────────────────
const AVAILABLE_PAGES = [
  "NoteCreationHub","ClinicalNoteStudio","DiagnosticStewardship","Results","DrugsBugs",
  "Dashboard","Shift","PatientDashboard","SoapCompiler","SoapCompilerStandalone",
  "NotesLibrary","DischargePlanning","OrderSetBuilder","BillingDashboard",
  "AntibioticStewardship","PediatricDosing","DrugReference","CMELearningCenter",
  "Guidelines","MedicalKnowledgeBase","PatientEducation","Calculators",
  "NoteTemplates","CustomTemplates","Snippets","AddendumManager",
  "UserPreferences","AppSettings","UserSettings","CommandCenter",
].sort();

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
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  // ── User state ─────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    degreeType: "",
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
    dashboard_layout: '2x2',
    clock_face_style: 'digital',
    color_theme: 'light',
    notifications_email: true,
    notifications_inapp: true,
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // App Settings state
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [newAttending, setNewAttending] = useState({ name: "", specialty: "", email: "" });
  const [appSaveSuccess, setAppSaveSuccess] = useState(false);

  // News API keys state
  const [newsApiInputs, setNewsApiInputs] = useState({
    thenewsapi_token: { value: "", show: false, status: null, error: "" },
    webzio_token: { value: "", show: false, status: null, error: "" },
    newsdata_token: { value: "", show: false, status: null, error: "" },
  });

  // Quick Nav state
  const [editingLink, setEditingLink] = useState(null);
  const [newLink, setNewLink] = useState({
    page: "", icon: "✦", label: "", sub: "", desc: "", color: "#00d4bc", shortcut: "", enabled: true
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

  // ── Fetch hospital settings ────────────────────────────────────
  const { data: hospitalSettingsData } = useQuery({
    queryKey: ["hospitalSettings"],
    queryFn: async () => {
      const results = await base44.entities.HospitalSettings.list();
      return results.length > 0 ? results[0] : null;
    },
  });

  useEffect(() => {
    if (hospitalSettingsData) setHospitalSettings(hospitalSettingsData);
  }, [hospitalSettingsData]);

  // ── Hydrate from Base44 user ───────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setProfile(prev => ({
      ...prev,
      firstName: currentUser.first_name || prev.firstName,
      lastName:  currentUser.last_name  || prev.lastName,
      email:     currentUser.email      || prev.email,
      degreeType: currentUser.degree_type || prev.degreeType,
    }));
    if (currentUser.profile_photo) setProfilePhoto(currentUser.profile_photo);
  }, [currentUser?.id]);

  // ── Upload photo handler ───────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfilePhoto(file_url);
      await base44.auth.updateMe({ profile_photo: file_url });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Photo upload failed: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Save profile mutation ──────────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        first_name: profile.firstName,
        last_name:  profile.lastName,
        email:      profile.email,
        phone:      profile.phone,
        degree_type: profile.degreeType,
        role:       profile.role,
        specialty:  profile.specialty,
        institution: profile.institution,
        department: profile.department,
        npi:        profile.npi,
        licenseNumber: profile.licenseNumber,
        licenseState: profile.licenseState,
        deaNumber:  profile.deaNumber,
        bio:        profile.bio,
        preferences: prefs,
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

  // ── Hospital Settings Mutations ────────────────────────────────
  const saveHospitalMutation = useMutation({
    mutationFn: (data) => {
      if (hospitalSettings?.id) return base44.entities.HospitalSettings.update(hospitalSettings.id, data);
      return base44.entities.HospitalSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitalSettings"] });
      setAppSaveSuccess(true);
      setTimeout(() => setAppSaveSuccess(false), 2500);
      toast.success("Hospital settings saved");
    },
    onError: (err) => toast.error("Save failed: " + err.message),
  });

  const handleHospitalInputChange = (field, value) => {
    setHospitalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAttending = () => {
    if (!newAttending.name.trim()) return;
    const id = `attending_${Date.now()}`;
    setHospitalSettings(prev => ({ ...prev, attendings: [...(prev?.attendings || []), { id, ...newAttending }] }));
    setNewAttending({ name: "", specialty: "", email: "" });
  };

  const handleRemoveAttending = (id) => {
    setHospitalSettings(prev => ({ ...prev, attendings: prev.attendings.filter(a => a.id !== id) }));
  };

  const handleSetDefault = (id) => {
    setHospitalSettings(prev => ({ ...prev, default_attending_id: id }));
  };

  const handleSaveHospital = async () => {
    await saveHospitalMutation.mutateAsync(hospitalSettings);
  };

  // ── API Key Validation ─────────────────────────────────────────
  const validateApiKey = async (keyType, token, validateFn) => {
    setNewsApiInputs(prev => ({ ...prev, [keyType]: { ...prev[keyType], status: "validating", error: "" } }));
    try {
      const res = await base44.functions.invoke(validateFn, { token });
      if (res.data?.valid) {
        setNewsApiInputs(prev => ({ ...prev, [keyType]: { ...prev[keyType], status: "valid", value: "" } }));
        localStorage.setItem(keyType, token);
        const tokens = { ...(hospitalSettings?.api_tokens || {}), [keyType]: token };
        const updated = { ...hospitalSettings, api_tokens: tokens };
        setHospitalSettings(updated);
        await saveHospitalMutation.mutateAsync(updated);
        toast.success("API key validated and saved");
      } else {
        setNewsApiInputs(prev => ({ ...prev, [keyType]: { ...prev[keyType], status: "invalid", error: res.data?.error || "Invalid token" } }));
      }
    } catch {
      setNewsApiInputs(prev => ({ ...prev, [keyType]: { ...prev[keyType], status: "invalid", error: "Validation failed" } }));
    }
  };

  const handleRevokeApiKey = (keyType) => {
    localStorage.removeItem(keyType);
    const tokens = { ...(hospitalSettings?.api_tokens || {}), [keyType]: "" };
    const updated = { ...hospitalSettings, api_tokens: tokens };
    setHospitalSettings(updated);
    saveHospitalMutation.mutateAsync(updated);
    setNewsApiInputs(prev => ({ ...prev, [keyType]: { value: "", show: false, status: null, error: "" } }));
    toast.success("API key revoked");
  };

  // Quick Nav link queries
  const { data: quickNavLinks = [] } = useQuery({
    queryKey: ["quickNavLinks"],
    queryFn: () => base44.entities.QuickNavLink.list("order", 50),
  });

  // Quick Nav mutations
  const createLinkMutation = useMutation({
    mutationFn: (data) => base44.entities.QuickNavLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickNavLinks"] });
      toast.success("Link added");
      setNewLink({ page: "", icon: "✦", label: "", sub: "", desc: "", color: "#00d4bc", shortcut: "", enabled: true });
    },
    onError: (err) => toast.error("Failed to add link: " + err.message),
  });

  const updateLinkMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QuickNavLink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickNavLinks"] });
      toast.success("Link updated");
      setEditingLink(null);
    },
    onError: (err) => toast.error("Update failed: " + err.message),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id) => base44.entities.QuickNavLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickNavLinks"] });
      toast.success("Link removed");
    },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const toggleLinkMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.QuickNavLink.update(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickNavLinks"] });
    },
  });

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
              {/* Clickable avatar / photo upload */}
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{ position:"relative", width:80, height:80, borderRadius:"50%", cursor:"pointer", flexShrink:0 }}
                title="Click to change photo"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:`2px solid ${C.teal}55` }} />
                ) : (
                  <Avatar name={fullName} size={80} color={C.teal} />
                )}
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", opacity:uploadingPhoto ? 1 : 0, transition:"opacity .2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => !uploadingPhoto && (e.currentTarget.style.opacity = "0")}
                >
                  {uploadingPhoto
                    ? <div style={{ width:16, height:16, border:`2px solid ${C.teal}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .6s linear infinite" }} />
                    : <span style={{ fontSize:20 }}>📷</span>
                  }
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:"none" }} />
              </div>
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
                <Label>DEGREE TYPE</Label>
                <select value={profile.degreeType} onChange={e => updateProfile("degreeType", e.target.value)} style={selectStyle}>
                  <option value="">Select degree...</option>
                  <option value="MD">MD - Doctor of Medicine</option>
                  <option value="DO">DO - Doctor of Osteopathic Medicine</option>
                  <option value="ARNP">ARNP - Advanced Registered Nurse Practitioner</option>
                  <option value="NP">NP - Nurse Practitioner</option>
                  <option value="PA">PA - Physician Assistant</option>
                </select>
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

          <Card title="ACTIVE SESSIONS" icon="💻" badgeColor={C.blue}>
            <div style={{ fontSize:12, color:C.dim, padding:"10px 0" }}>Session management coming soon.</div>
            <button style={{ marginTop:6, padding:"7px 14px", borderRadius:9, background:"rgba(255,92,108,.07)", border:"1px solid rgba(255,92,108,.28)", color:C.red, fontSize:12, fontWeight:600, cursor:"pointer" }}>
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
                <input readOnly value="••••••••••••••••••••••••••••••••" style={{ ...inputStyle, fontFamily:"'JetBrains Mono',monospace", fontSize:12, flex:1 }} />
                <button style={{ padding:"8px 14px", borderRadius:9, background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:12, cursor:"pointer", flexShrink:0 }}>Reveal</button>
                <button style={{ padding:"8px 14px", borderRadius:9, background:"rgba(155,109,255,.1)", border:"1px solid rgba(155,109,255,.28)", color:C.purple, fontSize:12, cursor:"pointer", flexShrink:0, fontWeight:600 }}>Regenerate</button>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.muted, marginTop:5 }}>⚠ Keep this key secret. Do not share or commit to version control.</div>
            </div>

          </Card>
        </div>
      );

      // ── APP SETTINGS ──────────────────────────────────────────
      case "app_settings": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          
          {/* News API Keys */}
          {[
            { key: "thenewsapi_token", label: "TheNewsAPI.com", color: C.teal, validateFn: "validateNewsApiKey", url: "https://www.thenewsapi.com", icon: "📰" },
            { key: "webzio_token", label: "Webz.io News API", color: C.purple, validateFn: "validateWebzApiKey", url: "https://webz.io", icon: "🌐" },
            { key: "newsdata_token", label: "NewsData.io", color: C.blue, validateFn: "validateNewsdataApiKey", url: "https://newsdata.io", icon: "📰" },
          ].map(api => {
            const saved = hospitalSettings?.api_tokens?.[api.key] || localStorage.getItem(api.key) || "";
            const input = newsApiInputs[api.key];
            const maskedKey = (k) => k ? `${k.slice(0, 8)}${"•".repeat(18)}${k.slice(-4)}` : "";
            
            return (
              <Card key={api.key} title={api.label} icon={api.icon}>
                {saved && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"10px 14px", background:`${C.green}08`, border:`1px solid ${C.green}33`, borderRadius:9, marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <CheckCircle2 size={14} style={{ color:C.green, flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:C.green }}>Active</div>
                        <div style={{ fontSize:10, color:C.dim, fontFamily:"monospace", marginTop:2 }}>{maskedKey(saved)}</div>
                      </div>
                    </div>
                    <button onClick={() => handleRevokeApiKey(api.key)} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, background:`${C.red}12`, border:`1px solid ${C.red}33`, color:C.red, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                      <Trash2 size={11} /> Revoke
                    </button>
                  </div>
                )}
                
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <input
                      type={input.show ? "text" : "password"}
                      value={input.value}
                      onChange={e => setNewsApiInputs(prev => ({ ...prev, [api.key]: { ...prev[api.key], value: e.target.value, status: null, error: "" } }))}
                      onKeyDown={e => e.key === "Enter" && input.value.trim() && validateApiKey(api.key, input.value.trim(), api.validateFn)}
                      placeholder={`Paste your ${api.label} token…`}
                      style={{ width:"100%", background:C.edge, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"8px 36px 8px 12px", color:C.bright, fontSize:12, fontFamily:"monospace", outline:"none" }}
                    />
                    <button onClick={() => setNewsApiInputs(prev => ({ ...prev, [api.key]: { ...prev[api.key], show: !prev[api.key].show } }))}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.dim, cursor:"pointer", padding:0, display:"flex" }}>
                      {input.show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={() => input.value.trim() && validateApiKey(api.key, input.value.trim(), api.validateFn)}
                    disabled={!input.value.trim() || input.status === "validating"}
                    style={{ padding:"8px 14px", borderRadius:8, fontSize:11, fontWeight:700, cursor:!input.value.trim() || input.status === "validating" ? "not-allowed" : "pointer", background:!input.value.trim() || input.status === "validating" ? C.muted : `linear-gradient(135deg,${api.color},${api.color}bb)`, border:"none", color:C.navy, whiteSpace:"nowrap", opacity:!input.value.trim() ? 0.5 : 1, display:"flex", alignItems:"center", gap:5 }}>
                    {input.status === "validating" ? <><Loader2 size={12} style={{ animation:"spin .8s linear infinite" }} /> Validating…</> : "Validate & Save"}
                  </button>
                </div>
                
                {input.status === "valid" && <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 12px", background:`${C.green}08`, border:`1px solid ${C.green}33`, borderRadius:8, fontSize:11, color:C.green }}><CheckCircle2 size={13} /> Token validated and saved!</div>}
                {input.status === "invalid" && <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 12px", background:`${C.red}08`, border:`1px solid ${C.red}33`, borderRadius:8, fontSize:11, color:C.red }}><AlertCircle size={13} /> {input.error || "Invalid token"}</div>}
                
                <div style={{ fontSize:10, color:C.dim, marginTop:8 }}>Get a free token at <a href={api.url} target="_blank" rel="noopener noreferrer" style={{ color:api.color, textDecoration:"none" }}>{api.url.replace("https://", "")}</a></div>
              </Card>
            );
          })}

          {/* Hospital Information */}
          <Card title="HOSPITAL INFORMATION" icon="🏥">
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { field: "company_name", label: "COMPANY / PRACTICE NAME", placeholder: "e.g. Riverside Medical Group" },
                { field: "hospital_name", label: "HOSPITAL / FACILITY NAME", placeholder: "e.g. Riverside General Hospital" },
                { field: "address", label: "ADDRESS", placeholder: "Hospital address" },
                { field: "phone", label: "PHONE", placeholder: "Main phone number" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <Label>{label}</Label>
                  <input value={hospitalSettings?.[field] || ""} onChange={e => handleHospitalInputChange(field, e.target.value)} style={inputStyle} placeholder={placeholder} />
                </div>
              ))}
              <button onClick={handleSaveHospital} disabled={saveHospitalMutation.isPending} style={{ padding:"8px 18px", borderRadius:10, fontSize:12, fontWeight:700, cursor:saveHospitalMutation.isPending ? "not-allowed" : "pointer", background:appSaveSuccess ? `linear-gradient(135deg,${C.green},#27ae60)` : `linear-gradient(135deg,${C.teal},#00b8a5)`, border:"none", color:C.navy, alignSelf:"flex-start", marginTop:4 }}>
                {saveHospitalMutation.isPending ? <><Loader2 size={13} style={{ animation:"spin .8s linear infinite" }} /> Saving…</> : appSaveSuccess ? <><Check size={13} /> Saved!</> : "Save Changes"}
              </button>
            </div>
          </Card>

          {/* Attending Physicians */}
          <Card title="ATTENDING PHYSICIANS" icon="👨‍⚕️">
            <div style={{ background:C.edge, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px", marginBottom:14 }}>
              <Label>ADD NEW PHYSICIAN</Label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                {[
                  { key: "name", placeholder: "Full Name" },
                  { key: "specialty", placeholder: "Specialty" },
                  { key: "email", placeholder: "Email" },
                ].map(({ key, placeholder }) => (
                  <input key={key} value={newAttending[key]} onChange={e => setNewAttending(prev => ({ ...prev, [key]: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleAddAttending()} style={inputStyle} placeholder={placeholder} />
                ))}
              </div>
              <button onClick={handleAddAttending} disabled={!newAttending.name.trim()} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:7, background:newAttending.name.trim() ? `linear-gradient(135deg,${C.teal},#00b8a5)` : C.muted, border:"none", color:C.navy, fontSize:11, fontWeight:700, cursor:newAttending.name.trim() ? "pointer" : "not-allowed", opacity:newAttending.name.trim() ? 1 : 0.5 }}>
                <Plus size={13} /> Add Physician
              </button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {!hospitalSettings?.attendings?.length ? (
                <div style={{ padding:"20px", textAlign:"center", fontSize:12, color:C.dim }}>No attending physicians added yet</div>
              ) : (
                hospitalSettings.attendings.map((a) => {
                  const isDefault = hospitalSettings.default_attending_id === a.id;
                  return (
                    <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"10px 14px", background:isDefault ? `${C.teal}08` : C.edge, border:`1px solid ${isDefault ? `${C.teal}33` : C.border}`, borderRadius:9 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.bright }}>{a.name}</div>
                        <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{[a.specialty, a.email].filter(Boolean).join(" · ")}</div>
                      </div>
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        <button onClick={() => handleSetDefault(a.id)} style={{ padding:"4px 10px", borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", background:isDefault ? `${C.teal}18` : "transparent", border:`1px solid ${isDefault ? `${C.teal}44` : C.border}`, color:isDefault ? C.teal : C.dim, display:"flex", alignItems:"center", gap:4 }}>
                          {isDefault ? <><Check size={10} /> Default</> : "Set Default"}
                        </button>
                        <button onClick={() => handleRemoveAttending(a.id)} style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:`1px solid ${C.border}`, color:C.dim, cursor:"pointer" }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {hospitalSettings?.attendings?.length > 0 && (
              <button onClick={handleSaveHospital} disabled={saveHospitalMutation.isPending} style={{ padding:"8px 18px", borderRadius:10, fontSize:12, fontWeight:700, cursor:saveHospitalMutation.isPending ? "not-allowed" : "pointer", background:appSaveSuccess ? `linear-gradient(135deg,${C.green},#27ae60)` : `linear-gradient(135deg,${C.teal},#00b8a5)`, border:"none", color:C.navy, marginTop:14 }}>
                {saveHospitalMutation.isPending ? <><Loader2 size={13} style={{ animation:"spin .8s linear infinite" }} /> Saving…</> : appSaveSuccess ? <><Check size={13} /> Saved!</> : "Save Changes"}
              </button>
            )}
          </Card>

          {/* Dashboard Preferences */}
          <Card title="DASHBOARD & APPEARANCE" icon="🎨">
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <Label>DASHBOARD LAYOUT</Label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {[{ value: '2x2', label: '2×2 Grid' }, { value: '3x3', label: '3×3 Grid' }, { value: '4x4', label: '4×4 Grid' }, { value: '6x6', label: '6×6 Grid' }, { value: 'horizontal', label: 'Horizontal' }].map(opt => (
                    <button key={opt.value} onClick={() => updatePrefs('dashboard_layout', opt.value)} style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:prefs.dashboard_layout === opt.value ? `linear-gradient(135deg,${C.teal},#00b8a5)` : C.edge, border:`1px solid ${prefs.dashboard_layout === opt.value ? C.teal : C.border}`, color:prefs.dashboard_layout === opt.value ? C.navy : C.text }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>CLOCK FACE STYLE</Label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {[{ value: 'digital', label: 'Digital' }, { value: 'analog', label: 'Analog' }, { value: 'minimal', label: 'Minimal' }, { value: 'binary', label: 'Binary' }].map(opt => (
                    <button key={opt.value} onClick={() => updatePrefs('clock_face_style', opt.value)} style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:prefs.clock_face_style === opt.value ? `linear-gradient(135deg,${C.teal},#00b8a5)` : C.edge, border:`1px solid ${prefs.clock_face_style === opt.value ? C.teal : C.border}`, color:prefs.clock_face_style === opt.value ? C.navy : C.text }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>COLOR THEME</Label>
                <div style={{ display:"flex", gap:8 }}>
                  {[{ value: 'light', label: '☀️ Light' }, { value: 'dark', label: '🌙 Dark' }, { value: 'auto', label: '🔄 Auto' }].map(opt => (
                    <button key={opt.value} onClick={() => updatePrefs('color_theme', opt.value)} style={{ padding:"7px 18px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:prefs.color_theme === opt.value ? `linear-gradient(135deg,${C.purple},#7c3aed)` : C.edge, border:`1px solid ${prefs.color_theme === opt.value ? C.purple : C.border}`, color:prefs.color_theme === opt.value ? "#fff" : C.text }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

        </div>
      );

      // ── QUICK NAVIGATION ──────────────────────────────────────
      case "quick_nav": return (
        <div style={{ maxWidth:900, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          
          {/* Add new link */}
          <Card title="ADD NEW QUICK LINK" icon="➕">
            {/* Simple page selector */}
            <div style={{ marginBottom:16 }}>
              <Label>SELECT PAGE</Label>
              <select 
                value={newLink.page} 
                onChange={e => {
                  const page = e.target.value;
                  setNewLink(p => ({ 
                    ...p, 
                    page,
                    label: page ? page.replace(/([A-Z])/g, ' $1').trim() : "",
                  }));
                }} 
                style={{ ...selectStyle, fontSize:14, padding:"11px 13px" }}
              >
                <option value="">Choose a page to add...</option>
                {AVAILABLE_PAGES.map(page => (
                  <option key={page} value={page}>{page}</option>
                ))}
              </select>
            </div>

            {/* Advanced options (collapsed by default) */}
            {newLink.page && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} style={{ overflow:"hidden" }}>
                <div style={{ padding:"14px", background:C.edge, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:12 }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:C.dim, letterSpacing:".1em", marginBottom:10 }}>CUSTOMIZE (OPTIONAL)</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div>
                      <Label>DISPLAY LABEL</Label>
                      <input value={newLink.label} onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))} style={inputStyle} placeholder="Custom name" />
                    </div>
                    <div>
                      <Label>ICON</Label>
                      <select value={newLink.icon} onChange={e => setNewLink(p => ({ ...p, icon: e.target.value }))} style={selectStyle}>
                        <option value="✦">✦ Sparkle</option>
                        <option value="📝">📝 Note</option>
                        <option value="🔬">🔬 Microscope</option>
                        <option value="🧪">🧪 Test Tube</option>
                        <option value="💊">💊 Pill</option>
                        <option value="⚙️">⚙️ Gear</option>
                        <option value="📋">📋 Clipboard</option>
                        <option value="🩺">🩺 Stethoscope</option>
                        <option value="🏥">🏥 Hospital</option>
                        <option value="📊">📊 Chart</option>
                        <option value="🔍">🔍 Search</option>
                        <option value="📚">📚 Books</option>
                        <option value="⚡">⚡ Lightning</option>
                        <option value="🎯">🎯 Target</option>
                        <option value="📈">📈 Trending</option>
                        <option value="💉">💉 Syringe</option>
                        <option value="🧬">🧬 DNA</option>
                        <option value="🔬">🔬 Science</option>
                        <option value="📱">📱 Mobile</option>
                        <option value="💼">💼 Briefcase</option>
                      </select>
                    </div>
                    <div>
                      <Label>COLOR</Label>
                      <div style={{ display:"flex", gap:6 }}>
                        {["#00d4bc","#4a90d9","#9b6dff","#f5a623","#2ecc71","#f472b6"].map(col => (
                          <button key={col} onClick={() => setNewLink(p => ({ ...p, color: col }))} style={{ width:32, height:32, borderRadius:8, background:col, border:`2px solid ${newLink.color === col ? C.bright : "transparent"}`, cursor:"pointer", flexShrink:0 }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>SHORTCUT KEY</Label>
                      <input value={newLink.shortcut} onChange={e => setNewLink(p => ({ ...p, shortcut: e.target.value.toUpperCase() }))} style={{ ...inputStyle, textTransform:"uppercase", textAlign:"center" }} placeholder="Letter" maxLength={1} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <button 
              onClick={() => createLinkMutation.mutate({ ...newLink, order: quickNavLinks.length })} 
              disabled={!newLink.page || !newLink.label || createLinkMutation.isPending} 
              style={{ 
                padding:"10px 20px", 
                borderRadius:10, 
                fontSize:13, 
                fontWeight:700, 
                cursor:!newLink.page || !newLink.label || createLinkMutation.isPending ? "not-allowed" : "pointer", 
                background:!newLink.page || !newLink.label ? C.muted : `linear-gradient(135deg,${C.teal},#00b8a5)`, 
                border:"none", 
                color:C.navy, 
                opacity:!newLink.page || !newLink.label ? .5 : 1,
                display:"flex",
                alignItems:"center",
                gap:7,
                justifyContent:"center"
              }}
            >
              {createLinkMutation.isPending ? <Loader2 size={14} style={{ animation:"spin .8s linear infinite" }} /> : <Plus size={14} />}
              {createLinkMutation.isPending ? "Adding..." : "Add to Quick Navigation"}
            </button>
          </Card>

          {/* Current links */}
          <Card title="YOUR QUICK LINKS" icon="🚀" badge={`${quickNavLinks.filter(l => l.enabled).length} ACTIVE`} badgeColor={C.teal}>
            {quickNavLinks.length === 0 ? (
              <div style={{ padding:"20px", textAlign:"center", fontSize:12, color:C.dim }}>
                No custom links yet. Using default navigation.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {quickNavLinks.map((link, i) => {
                  const linkData = link.data || link;
                  const linkColor = linkData.color || C.teal;
                  const linkIcon = linkData.icon || "✦";
                  const linkLabel = linkData.label || link.label;
                  const linkPage = linkData.page || link.page;
                  const linkShortcut = linkData.shortcut || link.shortcut;
                  const isEnabled = linkData.enabled !== undefined ? linkData.enabled : link.enabled;
                  return (
                    <div key={link.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:isEnabled ? C.edge : "rgba(0,0,0,.15)", border:`1px solid ${C.border}`, borderRadius:10, opacity:isEnabled ? 1 : .5 }}>
                      {/* Drag handle */}
                      <GripVertical size={14} style={{ color:C.muted, cursor:"move", flexShrink:0 }} />
                      
                      {/* Icon preview */}
                      <div style={{ width:40, height:40, borderRadius:9, background:`${linkColor}12`, border:`1px solid ${linkColor}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                        {linkIcon}
                      </div>

                      {/* Link info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.bright }}>{linkLabel}</div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:2 }}>{linkPage} {linkShortcut && `· Key: ${linkShortcut}`}</div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                        <button onClick={() => toggleLinkMutation.mutate({ id: link.id, enabled: !isEnabled })} style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:`1px solid ${C.border}`, color:isEnabled ? C.green : C.muted, cursor:"pointer" }} title={isEnabled ? "Hide" : "Show"}>
                          {isEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button onClick={() => setEditingLink(linkData.id ? linkData : { ...linkData, id: link.id })} style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:`1px solid ${C.border}`, color:C.dim, cursor:"pointer" }}>
                          <Edit size={13} />
                        </button>
                        <button onClick={() => deleteLinkMutation.mutate(link.id)} style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:`1px solid ${C.border}`, color:C.red, cursor:"pointer" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Edit dialog */}
          {editingLink && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={() => setEditingLink(null)}>
              <div onClick={e => e.stopPropagation()} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px", maxWidth:500, width:"90%" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:C.bright, marginBottom:16 }}>Edit Quick Link</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div>
                    <Label>PAGE NAME</Label>
                    <select value={editingLink.page} onChange={e => setEditingLink(p => ({ ...p, page: e.target.value }))} style={selectStyle}>
                      {AVAILABLE_PAGES.map(page => <option key={page} value={page}>{page}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>DISPLAY LABEL</Label>
                    <input value={editingLink.label} onChange={e => setEditingLink(p => ({ ...p, label: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <Label>ICON</Label>
                    <select value={editingLink.icon} onChange={e => setEditingLink(p => ({ ...p, icon: e.target.value }))} style={selectStyle}>
                      <option value="✦">✦ Sparkle</option>
                      <option value="📝">📝 Note</option>
                      <option value="🔬">🔬 Microscope</option>
                      <option value="🧪">🧪 Test Tube</option>
                      <option value="💊">💊 Pill</option>
                      <option value="⚙️">⚙️ Gear</option>
                      <option value="📋">📋 Clipboard</option>
                      <option value="🩺">🩺 Stethoscope</option>
                      <option value="🏥">🏥 Hospital</option>
                      <option value="📊">📊 Chart</option>
                      <option value="🔍">🔍 Search</option>
                      <option value="📚">📚 Books</option>
                      <option value="⚡">⚡ Lightning</option>
                      <option value="🎯">🎯 Target</option>
                      <option value="📈">📈 Trending</option>
                      <option value="💉">💉 Syringe</option>
                      <option value="🧬">🧬 DNA</option>
                      <option value="🔬">🔬 Science</option>
                      <option value="📱">📱 Mobile</option>
                      <option value="💼">💼 Briefcase</option>
                    </select>
                  </div>
                  <div>
                    <Label>COLOR</Label>
                    <input value={editingLink.color} onChange={e => setEditingLink(p => ({ ...p, color: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <Label>SUBTITLE</Label>
                    <input value={editingLink.sub} onChange={e => setEditingLink(p => ({ ...p, sub: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <Label>SHORTCUT</Label>
                    <input value={editingLink.shortcut} onChange={e => setEditingLink(p => ({ ...p, shortcut: e.target.value.toUpperCase() }))} style={inputStyle} maxLength={1} />
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <Label>DESCRIPTION</Label>
                  <input value={editingLink.desc} onChange={e => setEditingLink(p => ({ ...p, desc: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <button onClick={() => setEditingLink(null)} style={{ padding:"7px 14px", borderRadius:8, background:C.edge, border:`1px solid ${C.border}`, color:C.dim, fontSize:12, cursor:"pointer" }}>Cancel</button>
                  <button onClick={() => updateLinkMutation.mutate({ id: editingLink.id, data: editingLink })} style={{ padding:"7px 14px", borderRadius:8, background:`linear-gradient(135deg,${C.teal},#00b8a5)`, border:"none", color:C.navy, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );

      // ── ACTIVITY LOG ──────────────────────────────────────────
      case "activity": return (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:14 }}>
          <Card title="RECENT ACTIVITY" icon="📋" badge="LAST 24 HR" badgeColor={C.blue}>
            {ACTIVITY.length === 0
              ? <div style={{ fontSize:12, color:C.dim, padding:"10px 0" }}>No recent activity to display.</div>
              : ACTIVITY.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i < ACTIVITY.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:C.edge, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{activityIcon[a.type]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:C.bright }}>{a.action}</div>
                    {a.patient !== "—" && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.dim, marginTop:1 }}>Patient: {a.patient}</div>}
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.muted, flexShrink:0 }}>{a.time}</div>
                </div>
              ))
            }
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
        @keyframes spin{to{transform:rotate(360deg)}}
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
            {["profile","credentials","preferences","app_settings"].includes(section) && (
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