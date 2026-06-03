import { useEffect, useRef, useState, useCallback } from "react";
import {
  T, SURFACE_META, tierStyle,
  ACUITY,
  ORDER_CATALOG, CAT_COLOR, CATALOG_BY_ID,
  TRIAGE_BY_ID, vitalFlag, LABS_BY_ID, IMAGING_BY_ID, ALLERGY_DETAIL, trendFrom,
  AcuityBadge, StatusPill, AllergyChip,
  HUBS, HUB_CAT_COLOR, HUB_BY_ID, suggestHubs,
} from "@/components/ccsKit";

/*
  ccsSurfaces - every summoned surface that overlays the board.
  Half-sheet (Orders), dock (Note), popovers (Triage + the info set), and the
  takeover (Hub). Each takes a frozen `patient` prop captured at open time.
  HubTakeover also takes isTop + bindEscape to participate in the consume-Esc
  contract. Base44-safe: straight quotes only, ASCII only, no Router/localStorage.
*/

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

/* ---------------------------------------- note dock (first real dock) ----------------------------------------
   A bottom dock that summons over the lower ~42vh while the board stays visible
   above it - the point of the dock tier: you keep the board in view while you
   document. APSO section tabs, a per-section editor, and quick-phrase chips.
   Save shows a brief confirmation, then closes back to the board. The AI draft
   control is a stub here; it is where InvokeLLM plugs in once PHI-safe. Editing
   happens in a real textarea, so the global focus guard protects it: letters do
   not summon, and the first Esc blurs before the second Esc closes the dock. */
const APSO = [
  { id: "A", label: "Assessment" },
  { id: "P", label: "Plan" },
  { id: "S", label: "Subjective" },
  { id: "O", label: "Objective" },
];

const NOTE_PHRASES = {
  A: ["Acute, uncomplicated presentation", "Differential includes", "Clinically stable at this time"],
  P: ["Workup as ordered above", "Reassess after intervention", "Disposition pending results", "Shared decision-making discussed"],
  S: ["Patient reports", "Denies fever, chills, or night sweats", "Symptoms began", "No similar episodes previously"],
  O: ["Alert, no acute distress", "Exam notable for", "Vitals reviewed and within stated ranges"],
};

function NoteDock({ patient, depth, onClose }) {
  const [section, setSection] = useState("A");
  const [text, setText] = useState({ A: "", P: "", S: "", O: "" });
  const [saved, setSaved] = useState(false);

  const append = useCallback((phrase) => {
    setText((t) => {
      const cur = t[section] || "";
      const joined = cur && !cur.endsWith("\n") && !cur.endsWith(" ") ? cur + " " + phrase : cur + phrase;
      return { ...t, [section]: joined };
    });
  }, [section]);

  const save = useCallback(() => {
    setSaved(true);
  }, []);

  useEffect(() => {
    if (!saved) return undefined;
    const t = setTimeout(() => onClose(), 950);
    return () => clearTimeout(t);
  }, [saved, onClose]);

  const sheet = { ...tierStyle("dock"), zIndex: 100 + depth };
  const body = text[section] || "";
  const filled = APSO.filter((s) => (text[s.id] || "").trim().length > 0).length;
  const chars = Object.keys(text).reduce((n, k) => n + (text[k] || "").length, 0);

  return (
    <div style={sheet}>
      {/* header: title, patient, APSO tabs, count, actions */}
      <div style={{ flexShrink: 0, padding: "11px 14px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>Note</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>

        <div style={{ display: "flex", gap: 6, marginLeft: 6 }}>
          {APSO.map((s) => {
            const active = s.id === section;
            const has = (text[s.id] || "").trim().length > 0;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: active ? T.cardHi : "transparent",
                  border: "1px solid " + (active ? T.borderHi : T.border),
                  borderRadius: 8,
                  padding: "5px 10px",
                  color: active ? T.bright : T.dim,
                  fontFamily: T.sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontFamily: T.mono, fontWeight: 700, color: active ? T.teal : T.faint }}>{s.id}</span>
                {s.label}
                {has ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.teal }} /> : null}
              </button>
            );
          })}
        </div>

        <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>
          {filled}/4 sections / {chars} chars
        </span>
        <button onClick={onClose} style={{ cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "5px 9px" }}>
          Esc
        </button>
        <button
          onClick={save}
          style={{ cursor: "pointer", background: T.teal, color: T.bg, border: "none", borderRadius: 8, padding: "6px 16px", fontFamily: T.sans, fontWeight: 700, fontSize: 12.5 }}
        >
          Save draft
        </button>
      </div>

      {/* body: editor + quick phrases */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 12, padding: 12 }}>
        <textarea
          value={body}
          onChange={(e) => setText((t) => ({ ...t, [section]: e.target.value }))}
          placeholder={"Document the " + (APSO.find((s) => s.id === section) || {}).label + " section..."}
          style={{
            flex: 1,
            minWidth: 0,
            resize: "none",
            background: T.bg,
            border: "1px solid " + T.border,
            borderRadius: 10,
            padding: 12,
            color: T.bright,
            fontFamily: T.sans,
            fontSize: 14,
            lineHeight: 1.6,
            outline: "none",
          }}
        />
        <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 7, overflow: "auto" }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em" }}>QUICK PHRASES</div>
          {(NOTE_PHRASES[section] || []).map((p) => (
            <button
              key={p}
              onClick={() => append(p)}
              style={{ textAlign: "left", cursor: "pointer", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "7px 9px", color: T.txt, fontFamily: T.sans, fontSize: 12 }}
            >
              {p}
            </button>
          ))}
          <button
            title="Wires to InvokeLLM once PHI-safe"
            onClick={() => append("[AI draft pending - InvokeLLM]")}
            style={{ textAlign: "left", cursor: "pointer", background: "rgba(155,109,255,0.10)", border: "1px solid rgba(155,109,255,0.40)", borderRadius: 8, padding: "7px 9px", color: T.purple, fontFamily: T.sans, fontSize: 12, marginTop: 4 }}
          >
            AI draft (stub)
          </button>
        </div>
      </div>

      {/* saved confirmation */}
      {saved && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,15,30,0.92)", borderRadius: "14px 14px 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 20, color: T.teal }}>Draft saved</div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>Returning to the board.</div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------- triage surface (first real popover) ----------------------------------------
   A centered popover that surfaces the nurse triage note over the board, then
   dismisses with Esc - the read you do without losing your place. Read-only by
   design. Self-contained and lift-out-ready; the same shape (header + scrollable
   body in the popover tier) is the mold labs / imaging / vitals / patient reuse. */
function TriageVital({ label, value, unit, flag }) {
  return (
    <div style={{ background: T.bg, border: "1px solid " + (flag ? "rgba(255,159,67,0.45)" : T.border), borderRadius: 8, padding: "7px 9px" }}>
      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.dim, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700, color: flag ? T.orange : T.bright, marginTop: 2 }}>
        {value}{flag ? "*" : ""}{unit ? <span style={{ fontSize: 10, color: T.dim, fontWeight: 400 }}> {unit}</span> : null}
      </div>
    </div>
  );
}

function TriageSurface({ patient, depth, onClose }) {
  const rec = patient ? TRIAGE_BY_ID[patient.id] : null;
  const sheet = { ...tierStyle("popover"), zIndex: 100 + depth, width: "min(460px, 86vw)", maxHeight: "82vh" };

  return (
    <div style={sheet}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>Triage Note</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16 }}>
        {!rec ? (
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, textAlign: "center", padding: 20 }}>
            {patient ? "No triage note on file for this patient." : "Select a patient to view their triage note."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* arrival line */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontFamily: T.mono, fontSize: 11, color: T.dim }}>
              <span>{rec.arrival}</span>
              <span>Arr {rec.arrTime}</span>
              <span>Triaged {rec.triTime}</span>
              <span>{rec.nurse}</span>
            </div>

            {/* chief complaint in patient words */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 5 }}>STATED COMPLAINT</div>
              <div style={{ fontFamily: T.sans, fontStyle: "italic", fontSize: 14, color: T.bright, lineHeight: 1.5, borderLeft: "2px solid " + T.gold, paddingLeft: 10 }}>
                "{rec.ccQuote}"
              </div>
            </div>

            {/* triage vitals */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 7 }}>TRIAGE VITALS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                <TriageVital label="HR" value={rec.vitals.hr} flag={vitalFlag("hr", rec.vitals.hr)} />
                <TriageVital label="BP" value={rec.vitals.bp} flag={false} />
                <TriageVital label="RR" value={rec.vitals.rr} flag={vitalFlag("rr", rec.vitals.rr)} />
                <TriageVital label="SpO2" value={rec.vitals.spo2} unit="%" flag={vitalFlag("spo2", rec.vitals.spo2)} />
                <TriageVital label="Temp" value={rec.vitals.temp} unit="F" flag={vitalFlag("temp", rec.vitals.temp)} />
                <TriageVital label="Pain" value={rec.vitals.pain} unit="/10" flag={vitalFlag("pain", rec.vitals.pain)} />
              </div>
            </div>

            {/* narrative */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 5 }}>TRIAGE NARRATIVE</div>
              <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.txt, lineHeight: 1.6 }}>{rec.narrative}</div>
            </div>

            {/* screens */}
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 7 }}>SCREENS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {rec.screens.map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + (s.flag ? "rgba(255,107,107,0.45)" : T.border), borderRadius: 8, padding: "7px 10px" }}>
                    <span style={{ fontFamily: T.sans, fontSize: 13, color: T.txt, flex: 1 }}>{s.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: s.flag ? T.coral : T.dim }}>
                      {s.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------- popover surfaces (the proven mold) ----------------------------------------
   PopoverShell is the literal mold triage established: popover-tier container,
   a standard header (title + patient + Esc), and a scrollable body slot. Labs,
   Imaging, Allergies, Vitals, and Patient all pour into it. Each is read-only
   and self-contained / lift-out-ready. */
function PopoverShell({ title, patient, depth, onClose, children, width }) {
  const sheet = { ...tierStyle("popover"), zIndex: 100 + depth, width: width || "min(460px, 86vw)", maxHeight: "82vh" };
  return (
    <div style={sheet}>
      <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 16, color: T.bright }}>{title}</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {patient ? patient.name + " / " + patient.room : "No patient"}
        </span>
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "4px 9px" }}>
          Esc
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 16 }}>{children}</div>
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, textAlign: "center", padding: 20 }}>{text}</div>;
}

function LabsSurface({ patient, depth, onClose }) {
  const rows = patient ? LABS_BY_ID[patient.id] : null;
  return (
    <PopoverShell title="Labs" patient={patient} depth={depth} onClose={onClose}>
      {!rows || rows.length === 0 ? (
        <EmptyNote text={patient ? "No labs resulted yet." : "Select a patient to view labs."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r) => {
            const abn = r.flag === "H" || r.flag === "L";
            const c = r.flag === "H" ? T.orange : r.flag === "L" ? T.blue : T.dim;
            return (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + (abn ? "rgba(255,159,67,0.35)" : T.border), borderRadius: 8, padding: "8px 10px" }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.txt, flex: 1 }}>{r.name}</span>
                <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: abn ? T.bright : T.txt }}>
                  {r.value}<span style={{ fontSize: 10, color: T.dim, fontWeight: 400 }}> {r.unit}</span>
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: c, minWidth: 16, textAlign: "center" }}>{r.flag || "-"}</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.faint, minWidth: 64, textAlign: "right" }}>{r.ref}</span>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function ImagingSurface({ patient, depth, onClose }) {
  const rows = patient ? IMAGING_BY_ID[patient.id] : null;
  return (
    <PopoverShell title="Imaging" patient={patient} depth={depth} onClose={onClose}>
      {!rows || rows.length === 0 ? (
        <EmptyNote text={patient ? "No imaging ordered." : "Select a patient to view imaging."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => {
            const pending = r.status === "Pending";
            const sc = r.status === "Final" ? T.teal : r.status === "Prelim" ? T.gold : T.faint;
            return (
              <div key={r.study} style={{ background: T.bg, border: "1px solid " + T.border, borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.bright, flex: 1 }}>{r.study}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: sc, border: "1px solid " + sc + "66", borderRadius: 4, padding: "2px 6px" }}>{r.status.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: pending ? T.dim : T.txt, lineHeight: 1.5 }}>{r.impression}</div>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function AllergyDetailSurface({ patient, depth, onClose }) {
  const list = patient ? patient.allergies : [];
  return (
    <PopoverShell title="Allergies" patient={patient} depth={depth} onClose={onClose}>
      {!list || list.length === 0 ? (
        <EmptyNote text="No known drug allergies (NKDA)." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {list.map((a) => {
            const d = ALLERGY_DETAIL[a] || { reaction: "Reaction not documented", severity: "Unknown" };
            const sev = d.severity;
            const sc = sev === "Severe" ? T.coral : sev === "Moderate" ? T.orange : T.dim;
            return (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.30)", borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.bright }}>{a}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.dim, marginTop: 1 }}>{d.reaction}</div>
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: sc, border: "1px solid " + sc + "66", borderRadius: 5, padding: "3px 8px" }}>{sev.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function VitalsSurface({ patient, depth, onClose }) {
  const rec = patient ? TRIAGE_BY_ID[patient.id] : null;
  const v = rec ? rec.vitals : null;
  const rows = v
    ? [
        { key: "hr", label: "Heart rate", value: v.hr, unit: "bpm" },
        { key: "rr", label: "Resp rate", value: v.rr, unit: "/min" },
        { key: "spo2", label: "SpO2", value: v.spo2, unit: "%" },
        { key: "temp", label: "Temp", value: v.temp, unit: "F" },
      ]
    : [];
  return (
    <PopoverShell title="Vitals trend" patient={patient} depth={depth} onClose={onClose}>
      {!v ? (
        <EmptyNote text={patient ? "No vitals recorded." : "Select a patient to view vitals."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em" }}>SINCE TRIAGE ({rec.triTime})</div>
          {rows.map((r) => {
            const t = trendFrom(r.value);
            const flag = vitalFlag(r.key, r.value);
            const delta = t[2] - t[0];
            const arrow = delta > 0 ? "^" : delta < 0 ? "v" : "-";
            return (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + (flag ? "rgba(255,159,67,0.35)" : T.border), borderRadius: 8, padding: "8px 11px" }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.txt, flex: 1 }}>{r.label}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint }}>{t[0]} {String.fromCharCode(8594)} {t[1]} {String.fromCharCode(8594)}</span>
                <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700, color: flag ? T.orange : T.bright }}>{r.value}{flag ? "*" : ""}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, width: 12, textAlign: "center" }}>{arrow}</span>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.faint, width: 30 }}>{r.unit}</span>
              </div>
            );
          })}
        </div>
      )}
    </PopoverShell>
  );
}

function PatientSurface({ patient, depth, onClose }) {
  if (!patient) {
    return (
      <PopoverShell title="Patient info" patient={patient} depth={depth} onClose={onClose}>
        <EmptyNote text="Select a patient to view details." />
      </PopoverShell>
    );
  }
  const a = ACUITY[patient.esi] || ACUITY[3];
  const fields = [
    ["MRN", patient.mrn],
    ["Age / Sex", patient.age + " " + patient.sex],
    ["Room", patient.room],
    ["ESI", patient.esi + " (" + a.tone + ")"],
    ["Chief complaint", patient.cc],
    ["Status", patient.status],
    ["Time in dept", patient.wait + " min"],
  ];
  return (
    <PopoverShell title="Patient info" patient={patient} depth={depth} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fields.map(([k, val]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 8, padding: "8px 11px" }}>
            <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.dim, letterSpacing: "0.05em", width: 120 }}>{k}</span>
            <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.bright, flex: 1 }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: 4 }}>
          <AllergyChip allergies={patient.allergies} />
        </div>
      </div>
    </PopoverShell>
  );
}

/* ---------------------------------------- clinical hub (the takeover tier) ----------------------------------------
   A full-screen takeover that is still summoned and dismissed, never navigated
   to: Esc returns to the board like every other surface. It is the launcher
   into the decision hubs, with the ones relevant to this patient's complaint
   surfaced first. Selecting a hub swaps the takeover's body to that hub (a stub
   here) - in production the hub's tools render in this same container, so the
   one-screen rule holds even for deep clinical work. */

function HubCard({ hub, onOpen, suggested }) {
  const c = HUB_CAT_COLOR[hub.cat] || T.teal;
  return (
    <button
      onClick={() => onOpen(hub.id)}
      style={{
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: T.card,
        border: "1px solid " + (suggested ? c + "66" : T.border),
        borderRadius: 12,
        padding: 13,
        minHeight: 92,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 11, color: c, background: c + "1f", border: "1px solid " + c + "55", borderRadius: 7, padding: "4px 7px", minWidth: 38, textAlign: "center" }}>
          {hub.mark}
        </span>
        <span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14, color: T.bright, flex: 1 }}>{hub.name}</span>
      </div>
      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.dim, lineHeight: 1.45 }}>{hub.desc}</span>
      <span style={{ fontFamily: T.mono, fontSize: 9, color: c, letterSpacing: "0.06em", marginTop: "auto" }}>{hub.cat.toUpperCase()}</span>
    </button>
  );
}

function HubTakeover({ patient, depth, onClose, isTop, bindEscape }) {
  const [active, setActive] = useState(null);
  const suggestedIds = patient ? suggestHubs(patient.cc) : [];
  const suggested = suggestedIds.map((id) => HUB_BY_ID[id]).filter(Boolean);
  const sheet = { ...tierStyle("takeover"), zIndex: 100 + depth };
  const hub = active ? HUB_BY_ID[active] : null;
  const c = hub ? (HUB_CAT_COLOR[hub.cat] || T.teal) : T.teal;

  // Consume-Esc contract: while this is the top surface, claim Esc. If a hub
  // sub-view is open, the first Esc backs out to the launcher (consumed); with
  // no sub-view open, we relinquish so the page peels the takeover to the board.
  useEffect(() => {
    if (!isTop || !bindEscape) return undefined;
    bindEscape(() => {
      if (active) {
        setActive(null);
        return true; // handled internally; do not pop the stack
      }
      return false; // nothing to back out of; let the page close us
    });
    return () => bindEscape(null);
  }, [isTop, active, bindEscape]);

  return (
    <div style={sheet}>
      {/* header */}
      <div style={{ flexShrink: 0, padding: "14px 18px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 18, color: T.bright }}>Clinical Hub</span>
        {patient ? (
          <span style={{ fontFamily: T.mono, fontSize: 12, color: T.teal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {patient.name} / {patient.room} / {patient.cc}
          </span>
        ) : (
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim }}>No patient selected</span>
        )}
        <button onClick={onClose} style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 6, color: T.dim, fontFamily: T.mono, fontSize: 11, padding: "5px 10px" }}>
          Esc
        </button>
      </div>

      {/* body */}
      {hub ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 18 }}>
          <button
            onClick={() => setActive(null)}
            style={{ alignSelf: "flex-start", cursor: "pointer", background: "transparent", border: "1px solid " + T.border, borderRadius: 7, color: T.dim, fontFamily: T.sans, fontSize: 12.5, padding: "6px 12px", marginBottom: 16 }}
          >
            Back to hubs
          </button>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
            <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 18, color: c, background: c + "1f", border: "1px solid " + c + "55", borderRadius: 12, padding: "12px 16px" }}>
              {hub.mark}
            </span>
            <span style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 22, color: T.bright }}>{hub.name}</span>
            <span style={{ fontFamily: T.sans, fontSize: 14, color: T.txt, maxWidth: 460, lineHeight: 1.6 }}>{hub.desc}</span>
            <span style={{ fontFamily: T.sans, fontSize: 13, color: T.dim, maxWidth: 460, lineHeight: 1.6 }}>
              In production the {hub.name} tools render right here, inside the takeover. Esc still returns you to the board - the hub is summoned, never a place you navigate away to.
            </span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 20 }}>
          {suggested.length > 0 && (
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.gold, letterSpacing: "0.08em", marginBottom: 10 }}>
                SUGGESTED FOR {(patient && patient.cc ? patient.cc : "").toUpperCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
                {suggested.map((h) => <HubCard key={h.id} hub={h} onOpen={setActive} suggested />)}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.dim, letterSpacing: "0.08em", marginBottom: 10 }}>ALL HUBS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
              {HUBS.map((h) => <HubCard key={h.id} hub={h} onOpen={setActive} suggested={false} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------- footer hint (keycap legend) ---------------------------------------- */

export {
  SurfaceStub, OrdersSurface, NoteDock, TriageSurface,
  LabsSurface, ImagingSurface, AllergyDetailSurface, VitalsSurface, PatientSurface,
  HubTakeover,
};