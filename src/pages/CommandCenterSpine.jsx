import { useEffect, useRef, useState, useCallback } from "react";

/*
  CommandCenterSpine - build 3: the first real surface (orders).

  Build 1 proved the wiring; build 2 added the always-on banner + board frame.
  Build 3 replaces the orders stub with a real right half-sheet: search the
  catalog, toggle orders into a pending tray, Sign, and the sheet closes so the
  loop ends on the board. The other eight keys (n l i a h v p t) stay labeled
  stubs until their turn. The banner, board, keyboard contract, and focus guard
  are unchanged.

  Base44-safe: single file, default export, no Router, no localStorage,
  no <form>, no alert(), straight quotes only, no non-ASCII glyphs.
*/

/* ---------------------------------------- fonts (load once) ---------------------------------------- */
(function () {
  if (typeof document === "undefined") return;
  var id = "lx-fonts";
  if (document.getElementById(id)) return;
  var l = document.createElement("link");
  l.id = id;
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
})();

/* ---------------------------------------- tokens ---------------------------------------- */
const T = {
  bg: "#050f1e",
  panel: "#081628",
  card: "#0b1e36",
  cardHi: "#0e2747",
  border: "rgba(26,53,85,0.5)",
  borderHi: "rgba(0,229,192,0.55)",
  teal: "#00e5c0",
  gold: "#f5c842",
  coral: "#ff6b6b",
  purple: "#9b6dff",
  orange: "#ff9f43",
  red: "#ff4444",
  blue: "#6b9fff",
  bright: "#eaf2ff",
  txt: "#c6d6ef",
  dim: "#7c93b3",
  faint: "#4a607f",
  serif: "'Playfair Display', serif",
  sans: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ---------------------------------------- surface contract (unchanged from build 1) ----------------------------------------
   key -> surface id. Extend here; nothing else needs to change. */
const SURFACE_KEYS = {
  o: "orders",
  n: "note",
  l: "labs",
  i: "imaging",
  a: "allergies",
  h: "hub",
  v: "vitals",
  p: "patient",
  t: "triage",
};

/* How each surface renders, so the stub can label its tier. */
const SURFACE_META = {
  orders: { label: "Orders", tier: "half-sheet" },
  note: { label: "Note", tier: "dock" },
  labs: { label: "Labs", tier: "popover" },
  imaging: { label: "Imaging", tier: "popover" },
  allergies: { label: "Allergies detail", tier: "popover" },
  hub: { label: "Clinical Hub", tier: "takeover" },
  vitals: { label: "Vitals trend", tier: "popover" },
  patient: { label: "Patient info", tier: "popover" },
  triage: { label: "Nurse triage note", tier: "popover" },
};

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

/* ---------------------------------------- keyboard layer (the rule, enforced in code) ----------------------------------------
   Bare single keys summon. Esc always heads back to the board, but
   only after the focus guard has had its turn. Arrow Up/Down move the
   board selection. The one modifier combo is the palette (Cmd/Ctrl+K),
   handled with (metaKey || ctrlKey) so both OSes work with no branch. */
function useCommandKeys({ onSurface, onEscape, onPalette, onNav, enabled = true }) {
  const cb = useRef({ onSurface, onEscape, onPalette, onNav });
  cb.current = { onSurface, onEscape, onPalette, onNav };

  useEffect(() => {
    if (!enabled) return undefined;
    function onKeyDown(e) {
      // Command palette: the one cross-platform combo.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (cb.current.onPalette) cb.current.onPalette();
        return;
      }
      // Escape: always offered; the handler protects typing first.
      if (e.key === "Escape") {
        if (cb.current.onEscape) cb.current.onEscape(e);
        return;
      }
      // From here on, bare keys only. Never fire while typing or modified.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(document.activeElement)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (cb.current.onNav) cb.current.onNav(e.key === "ArrowDown" ? 1 : -1);
        return;
      }

      const key = e.key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(SURFACE_KEYS, key)) {
        e.preventDefault();
        if (cb.current.onSurface) cb.current.onSurface(SURFACE_KEYS[key]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/* ---------------------------------------- sample data (config, not entities - swapped for Patient.list later) */
const COLUMNS = [
  { id: "waiting", title: "Waiting", sub: "To be seen" },
  { id: "active", title: "In Progress", sub: "Active workup" },
  { id: "dispo", title: "Disposition", sub: "Boarding / leaving" },
];

const ACUITY = {
  1: { color: T.red, tone: "Resuscitation" },
  2: { color: T.orange, tone: "Emergent" },
  3: { color: T.gold, tone: "Urgent" },
  4: { color: T.teal, tone: "Less urgent" },
  5: { color: T.blue, tone: "Nonurgent" },
};

const PATIENTS = [
  { id: "p1", room: "T1", name: "Alvarez, Marco", age: 58, sex: "M", mrn: "0049213", cc: "Chest pain", esi: 2, col: "active", status: "WORKUP", wait: 41, allergies: ["Penicillin", "Aspirin"] },
  { id: "p2", room: "T2", name: "Booker, Dawn", age: 71, sex: "F", mrn: "0051880", cc: "Syncope", esi: 2, col: "active", status: "WORKUP", wait: 33, allergies: [] },
  { id: "p3", room: "WR", name: "Cho, Linda", age: 24, sex: "F", mrn: "0058102", cc: "Ankle injury", esi: 4, col: "waiting", status: "NEW", wait: 18, allergies: ["Latex"] },
  { id: "p4", room: "WR", name: "Diaz, Hector", age: 9, sex: "M", mrn: "0058777", cc: "Fever", esi: 3, col: "waiting", status: "NEW", wait: 12, allergies: [] },
  { id: "p5", room: "WR", name: "Engel, Ruth", age: 83, sex: "F", mrn: "0042009", cc: "Weakness", esi: 3, col: "waiting", status: "NEW", wait: 27, allergies: ["Sulfa", "Codeine", "Iodine"] },
  { id: "p6", room: "R3", name: "Foster, Jamal", age: 46, sex: "M", mrn: "0060115", cc: "Abdominal pain", esi: 3, col: "active", status: "RESULTS", wait: 64, allergies: [] },
  { id: "p7", room: "R5", name: "Greer, Tanya", age: 36, sex: "F", mrn: "0055431", cc: "Asthma", esi: 3, col: "active", status: "TX", wait: 22, allergies: ["NSAIDs"] },
  { id: "p8", room: "H1", name: "Holt, Eugene", age: 67, sex: "M", mrn: "0039220", cc: "Sepsis", esi: 2, col: "dispo", status: "ADMIT", wait: 188, allergies: ["Vancomycin"] },
  { id: "p9", room: "H2", name: "Im, Soo-jin", age: 52, sex: "F", mrn: "0061004", cc: "Renal colic", esi: 3, col: "dispo", status: "DC", wait: 96, allergies: [] },
];

/* Flattened, column-ordered list - drives arrow-key selection order. */
const ORDER = COLUMNS.flatMap((c) => PATIENTS.filter((p) => p.col === c.id).map((p) => p.id));

/* Order catalog for the orders surface (config; becomes an entity/order set later). */
const ORDER_CATALOG = [
  { id: "cbc", cat: "Lab", label: "CBC with differential" },
  { id: "bmp", cat: "Lab", label: "Basic metabolic panel" },
  { id: "cmp", cat: "Lab", label: "Comprehensive metabolic panel" },
  { id: "trop", cat: "Lab", label: "Troponin, high-sensitivity" },
  { id: "lactate", cat: "Lab", label: "Lactate" },
  { id: "vbg", cat: "Lab", label: "Venous blood gas" },
  { id: "lipase", cat: "Lab", label: "Lipase" },
  { id: "ua", cat: "Lab", label: "Urinalysis, reflex culture" },
  { id: "coags", cat: "Lab", label: "PT / INR / PTT" },
  { id: "ddimer", cat: "Lab", label: "D-dimer" },
  { id: "bcx", cat: "Lab", label: "Blood cultures x2" },
  { id: "cxr", cat: "Imaging", label: "Chest X-ray, portable" },
  { id: "ecg", cat: "Imaging", label: "ECG, 12-lead" },
  { id: "cth", cat: "Imaging", label: "CT head without contrast" },
  { id: "ctap", cat: "Imaging", label: "CT abdomen / pelvis with contrast" },
  { id: "cta", cat: "Imaging", label: "CTA chest, PE protocol" },
  { id: "usruq", cat: "Imaging", label: "Ultrasound, right upper quadrant" },
  { id: "xr", cat: "Imaging", label: "X-ray, extremity" },
  { id: "apap", cat: "Med", label: "Acetaminophen 1 g PO" },
  { id: "ibu", cat: "Med", label: "Ibuprofen 600 mg PO" },
  { id: "zofran", cat: "Med", label: "Ondansetron 4 mg IV" },
  { id: "morphine", cat: "Med", label: "Morphine 4 mg IV" },
  { id: "toradol", cat: "Med", label: "Ketorolac 15 mg IV" },
  { id: "ctx", cat: "Med", label: "Ceftriaxone 1 g IV" },
  { id: "nsbolus", cat: "Med", label: "Normal saline 1 L bolus" },
  { id: "asa", cat: "Med", label: "Aspirin 324 mg PO chewed" },
  { id: "iv", cat: "Nursing", label: "Establish IV access" },
  { id: "monitor", cat: "Nursing", label: "Continuous cardiac monitor" },
  { id: "npo", cat: "Nursing", label: "NPO" },
];

const CAT_COLOR = { Lab: T.teal, Imaging: T.purple, Med: T.gold, Nursing: T.blue };
const CATALOG_BY_ID = ORDER_CATALOG.reduce((m, o) => { m[o.id] = o; return m; }, {});

/* ---------------------------------------- primitives ---------------------------------------- */
function AcuityBadge({ esi }) {
  const a = ACUITY[esi] || ACUITY[3];
  return (
    <div
      title={a.tone}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: a.color + "1f",
        border: "1.5px solid " + a.color,
        color: a.color,
        fontFamily: T.mono,
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {esi}
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: T.dim,
        background: "rgba(124,147,179,0.12)",
        border: "1px solid " + T.border,
        borderRadius: 5,
        padding: "2px 6px",
      }}
    >
      {status}
    </span>
  );
}

function AllergyChip({ allergies, compact }) {
  const has = allergies && allergies.length > 0;
  const bg = has ? "rgba(255,68,68,0.10)" : "rgba(0,229,192,0.08)";
  const bd = has ? "rgba(255,68,68,0.45)" : "rgba(0,229,192,0.30)";
  const fg = has ? T.coral : T.teal;
  const label = has ? "ALLERGY" : "NKDA";
  const body = has ? allergies.join(", ") : "No known drug allergies";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: bg,
        border: "1px solid " + bd,
        borderRadius: 8,
        padding: compact ? "4px 8px" : "6px 12px",
        maxWidth: compact ? 220 : 360,
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", color: fg, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: has ? T.bright : T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {body}
      </span>
    </div>
  );
}

function PatientCard({ p, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        background: selected ? T.cardHi : T.card,
        border: "1px solid " + (selected ? T.borderHi : T.border),
        boxShadow: selected ? "0 0 0 1px " + T.borderHi + ", 0 6px 18px rgba(0,0,0,0.35)" : "none",
        borderRadius: 10,
        padding: 11,
        marginBottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AcuityBadge esi={p.esi} />
        <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.teal, minWidth: 26 }}>{p.room}</span>
        <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.bright, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: T.sans, fontSize: 12, color: T.txt, flex: 1 }}>{p.cc}</span>
        <StatusPill status={p.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: T.dim, fontFamily: T.mono, fontSize: 10.5 }}>
        <span>{p.age}{p.sex}</span>
        <span>MRN {p.mrn}</span>
        <span style={{ marginLeft: "auto", color: p.wait > 120 ? T.orange : T.faint }}>{p.wait}m</span>
      </div>
    </button>
  );
}

/* ---------------------------------------- banner: the always-on layer (never summoned, never dismissed) */
function Banner({ patient, clock }) {
  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 18px",
        background: T.panel,
        borderBottom: "1px solid " + T.border,
        zIndex: 50,
      }}
    >
      {/* mark + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(0,229,192,0.18), rgba(245,200,66,0.12))",
            border: "1px solid " + T.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: T.serif,
            fontWeight: 900,
            fontSize: 15,
            color: T.gold,
            letterSpacing: "-0.02em",
          }}
        >
          LX
        </div>
        <div>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 15, color: T.bright, lineHeight: 1 }}>Command Center</div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginTop: 2 }}>SPINE / FRAME TEST</div>
        </div>
      </div>

      <div style={{ width: 1, height: 34, background: T.border, flexShrink: 0 }} />

      {/* selected patient identity */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
        {patient ? (
          <>
            <AcuityBadge esi={patient.esi} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 16, color: T.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {patient.name}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, padding: "1px 7px", borderRadius: 5, border: "1px solid " + T.border }}>
                  {patient.room}
                </span>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 2 }}>
                {patient.age}{patient.sex} &nbsp;/&nbsp; MRN {patient.mrn} &nbsp;/&nbsp; {patient.cc}
              </div>
            </div>
          </>
        ) : (
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>
            No patient selected. Click a card or use the arrow keys.
          </span>
        )}
      </div>

      {/* always-visible allergy chip - the Epic fix lives here */}
      {patient && <AllergyChip allergies={patient.allergies} />}

      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, flexShrink: 0, marginLeft: 4 }}>{clock}</span>
    </header>
  );
}

/* ---------------------------------------- board: three columns of cards ---------------------------------------- */
function Board({ selectedId, onSelect }) {
  return (
    <main style={{ flex: 1, minHeight: 0, display: "flex", gap: 12, padding: 14, overflow: "hidden" }}>
      {COLUMNS.map((col) => {
        const rows = PATIENTS.filter((p) => p.col === col.id);
        return (
          <section
            key={col.id}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              background: T.panel,
              border: "1px solid " + T.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "11px 14px",
                borderBottom: "1px solid " + T.border,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 14, color: T.bright }}>{col.title}</span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal }}>{rows.length}</span>
              <span style={{ fontFamily: T.sans, fontSize: 11, color: T.dim, marginLeft: "auto" }}>{col.sub}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 10 }}>
              {rows.map((p) => (
                <PatientCard key={p.id} p={p} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

/* ---------------------------------------- surface stub (styled by tier; real content is a later build) */
function tierStyle(tier) {
  const base = { position: "fixed", background: T.card, border: "1px solid " + T.borderHi, boxShadow: "0 20px 60px rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" };
  if (tier === "half-sheet") return { ...base, top: 0, right: 0, bottom: 0, width: "min(440px, 42vw)", borderRadius: "14px 0 0 14px" };
  if (tier === "dock") return { ...base, left: 0, right: 0, bottom: 0, height: "42vh", borderRadius: "14px 14px 0 0" };
  if (tier === "takeover") return { ...base, inset: 24, borderRadius: 16 };
  // popover
  return { ...base, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(420px, 80vw)", borderRadius: 14 };
}

function SurfaceStub({ id, patient, depth, onClose }) {
  const meta = SURFACE_META[id] || { label: id, tier: "popover" };
  return (
    <div style={{ ...tierStyle(meta.tier), zIndex: 100 + depth }}>
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>{meta.label}</span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, border: "1px solid " + T.border, borderRadius: 5, padding: "2px 7px" }}>
          {meta.tier}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center" }}>
        <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>Stub surface - real content lands in a later build.</span>
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.teal }}>
          {patient ? patient.name + " / " + patient.room : "No patient selected"}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------- orders surface (first real surface) ----------------------------------------
   A right half-sheet that summons over the frame. Search the catalog, toggle
   orders into a pending tray, then Sign - which closes the sheet so the loop
   ends on the board. Self-contained: lift this verbatim into its own component
   file later. Keyboard: ArrowUp/Down move the highlight, Enter toggles the
   highlighted order, Cmd/Ctrl+Enter signs. The global hook ignores arrows while
   a surface is open, so there is no collision; typing in the search field is
   protected by the same focus guard the board uses. */
function OrdersSurface({ patient, depth, onClose }) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState([]);
  const [hi, setHi] = useState(0);
  const [signed, setSigned] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ORDER_CATALOG.filter((o) => o.label.toLowerCase().indexOf(q) >= 0 || o.cat.toLowerCase().indexOf(q) >= 0)
    : ORDER_CATALOG;

  useEffect(() => {
    setHi((h) => Math.max(0, Math.min(h, Math.max(0, filtered.length - 1))));
  }, [filtered.length]);

  const toggle = useCallback((id) => {
    setPending((p) => (p.indexOf(id) >= 0 ? p.filter((x) => x !== id) : p.concat(id)));
  }, []);

  const sign = useCallback(() => {
    setPending((p) => {
      if (p.length > 0) setSigned(true);
      return p;
    });
  }, []);

  useEffect(() => {
    if (!signed) return undefined;
    const t = setTimeout(() => onClose(), 950);
    return () => clearTimeout(t);
  }, [signed, onClose]);

  // local keyboard for the sheet; mirrors current values through a ref so the
  // window listener only needs to mount once.
  const st = useRef({ filtered, hi, toggle, sign });
  st.current = { filtered, hi, toggle, sign };
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        st.current.sign();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHi((h) => Math.min(st.current.filtered.length - 1, h + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHi((h) => Math.max(0, h - 1));
        return;
      }
      if (e.key === "Enter") {
        const item = st.current.filtered[st.current.hi];
        if (item) {
          e.preventDefault();
          st.current.toggle(item.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sheet = { ...tierStyle("half-sheet"), zIndex: 100 + depth };

  return (
    <div style={sheet}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>Orders</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>

      {/* search */}
      <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: "1px solid " + T.border }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter orders (e.g. trop, CT, zofran)"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: T.bg,
            border: "1px solid " + T.border,
            borderRadius: 8,
            padding: "8px 11px",
            color: T.bright,
            fontFamily: T.sans,
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* catalog */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "8px 10px" }}>
        {filtered.length === 0 && (
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, padding: 16, textAlign: "center" }}>No matching orders.</div>
        )}
        {filtered.map((o, idx) => {
          const added = pending.indexOf(o.id) >= 0;
          const isHi = idx === hi;
          const c = CAT_COLOR[o.cat] || T.teal;
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              onMouseEnter={() => setHi(idx)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                marginBottom: 5,
                borderRadius: 8,
                background: added ? "rgba(0,229,192,0.10)" : isHi ? T.cardHi : "transparent",
                border: "1px solid " + (added ? T.borderHi : isHi ? T.border : "transparent"),
              }}
            >
              <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: c, border: "1px solid " + c + "66", borderRadius: 4, padding: "2px 5px", flexShrink: 0, minWidth: 52, textAlign: "center" }}>
                {o.cat.toUpperCase()}
              </span>
              <span style={{ fontFamily: T.sans, fontSize: 13, color: T.bright, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {o.label}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: added ? T.teal : T.faint, flexShrink: 0 }}>
                {added ? "added" : "+"}
              </span>
            </button>
          );
        })}
      </div>

      {/* pending tray */}
      {pending.length > 0 && (
        <div style={{ flexShrink: 0, borderTop: "1px solid " + T.border, padding: "10px 12px", maxHeight: "26vh", overflow: "auto" }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 7 }}>
            PENDING ({pending.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pending.map((id) => {
              const o = CATALOG_BY_ID[id];
              if (!o) return null;
              return (
                <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.card, border: "1px solid " + T.border, borderRadius: 7, padding: "4px 6px 4px 9px" }}>
                  <span style={{ fontFamily: T.sans, fontSize: 12, color: T.txt }}>{o.label}</span>
                  <button onClick={() => toggle(id)} style={{ cursor: "pointer", background: "transparent", border: "none", color: T.coral, fontFamily: T.mono, fontSize: 13, lineHeight: 1, padding: "0 2px" }}>
                    x
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* sign bar */}
      <div style={{ flexShrink: 0, borderTop: "1px solid " + T.border, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>Cmd / Ctrl + Enter</span>
        <button
          onClick={sign}
          disabled={pending.length === 0}
          style={{
            marginLeft: "auto",
            cursor: pending.length === 0 ? "default" : "pointer",
            background: pending.length === 0 ? "rgba(0,229,192,0.10)" : T.teal,
            color: pending.length === 0 ? T.faint : T.bg,
            border: "none",
            borderRadius: 9,
            padding: "9px 18px",
            fontFamily: T.sans,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {pending.length === 0 ? "Sign orders" : "Sign " + pending.length + " order" + (pending.length === 1 ? "" : "s")}
        </button>
      </div>

      {/* signed confirmation, then auto-return to the board */}
      {signed && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,15,30,0.92)", borderRadius: "14px 0 0 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 20, color: T.teal }}>Signed {pending.length} order{pending.length === 1 ? "" : "s"}</div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>Returning to the board.</div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------- footer hint (keycap legend) ---------------------------------------- */
function HintBar() {
  const keys = ["o orders", "n note", "l labs", "i imaging", "a allergies", "h hub", "v vitals", "p patient", "t triage"];
  return (
    <footer
      style={{
        flexShrink: 0,
        height: 30,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 16px",
        background: T.panel,
        borderTop: "1px solid " + T.border,
        overflow: "hidden",
      }}
    >
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, letterSpacing: "0.06em" }}>SUMMON</span>
      {keys.map((k) => (
        <span key={k} style={{ fontFamily: T.mono, fontSize: 10.5, color: T.dim, whiteSpace: "nowrap" }}>{k}</span>
      ))}
      <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>Esc back / Cmd or Ctrl + K palette</span>
    </footer>
  );
}

/* ---------------------------------------- page ---------------------------------------- */
export default function CommandCenterSpine() {
  const [selectedId, setSelectedId] = useState(ORDER[0] || null);
  const [stack, setStack] = useState([]);
  const [palette, setPalette] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setClock(hh + ":" + mm);
    }
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  const patient = PATIENTS.find((p) => p.id === selectedId) || null;

  const summon = useCallback((id) => {
    setStack((s) => (s[s.length - 1] === id ? s : s.concat(id)));
  }, []);

  const navSelect = useCallback((dir) => {
    if (stack.length > 0) return; // arrows drive board only when no surface is up
    setSelectedId((cur) => {
      const i = ORDER.indexOf(cur);
      const next = i < 0 ? 0 : Math.max(0, Math.min(ORDER.length - 1, i + dir));
      return ORDER[next];
    });
  }, [stack.length]);

  const escape = useCallback(() => {
    const el = typeof document !== "undefined" ? document.activeElement : null;
    if (isEditable(el)) {
      el.blur(); // focus guard: first Esc keeps your place in a field
      return;
    }
    if (palette) {
      setPalette(false);
      return;
    }
    setStack((s) => s.slice(0, -1)); // peel one layer back toward the board
  }, [palette]);

  useCommandKeys({
    onSurface: summon,
    onEscape: escape,
    onPalette: () => setPalette((v) => !v),
    onNav: navSelect,
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, display: "flex", flexDirection: "column", fontFamily: T.sans }}>
      <Banner patient={patient} clock={clock} />
      <Board selectedId={selectedId} onSelect={setSelectedId} />
      <HintBar />

      {/* summoned surfaces overlay the frame; banner/board stay put underneath */}
      {stack.map((id, depth) => {
        const close = () => setStack((s) => s.filter((_, idx) => idx !== depth));
        if (id === "orders") {
          return <OrdersSurface key={id + "-" + depth} patient={patient} depth={depth} onClose={close} />;
        }
        return <SurfaceStub key={id + "-" + depth} id={id} patient={patient} depth={depth} onClose={close} />;
      })}

      {palette && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,15,30,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh" }}>
          <div style={{ width: "min(560px, 90vw)", background: T.card, border: "1px solid " + T.borderHi, borderRadius: 14, boxShadow: "0 24px 70px rgba(0,0,0,0.6)", padding: 18 }}>
            <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright, marginBottom: 6 }}>Command Palette</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, marginBottom: 12 }}>Stub. Esc to close.</div>
            <button onClick={() => setPalette(false)} style={{ cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 8, color: T.txt, fontFamily: T.sans, fontSize: 13, padding: "7px 14px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}