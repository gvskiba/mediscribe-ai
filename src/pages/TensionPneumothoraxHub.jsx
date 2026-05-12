import { useState } from "react";
import { useNavigate } from "react-router-dom";

(() => {
  if (typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

const T = {
  bg: "#0a1628", glass: "rgba(255,255,255,0.04)", glassMid: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)", teal: "#14b8a6", gold: "#f59e0b", coral: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6", purple: "#a78bfa", amber: "#fb923c",
  white: "#f0f4f8", muted: "rgba(240,244,248,0.55)", dim: "rgba(240,244,248,0.28)",
  sans: "'DM Sans', sans-serif", serif: "'Playfair Display', serif", mono: "'JetBrains Mono', monospace",
};
const G    = (x = {}) => ({ background: T.glass, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${T.border}`, borderRadius: 14, ...x });
const pill = (bg)     => ({ display: "inline-block", background: bg, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 6, marginBottom: 10 });
const tag  = (c)      => ({ display: "inline-block", background: c + "22", border: `1px solid ${c}44`, borderRadius: 5, padding: "2px 8px", fontSize: 10.5, fontWeight: 600, color: c });
const card = (x = {}) => ({ ...G(), padding: "14px 16px", ...x });
const aBox = (c, mb = 10) => ({ background: c + "14", border: `1px solid ${c}40`, borderRadius: 10, padding: "10px 14px", marginBottom: mb });
const sL   = (c = T.coral) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 });
const dv   = { height: 1, background: T.border, margin: "10px 0" };

export default function TensionPneumothoraxHub({ onBack }) {
  const navigate = useNavigate();
  const handleBack = () => onBack ? onBack() : navigate("/CriticalProtocolsPage");

  const [tab, setTab]     = useState(0);
  const [method, setMethod] = useState("Needle");
  const [side, setSide]   = useState(null);
  const [size, setSize]   = useState(null);
  const TABS = ["Recognition", "Needle Decompression", "Chest Tube", "Monitoring"];

  // ── TAB 0: RECOGNITION ──────────────────────────────────────────────────
  const T0 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.09)", marginBottom: 16 }), padding: "14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>⚡ TENSION PTX = CLINICAL DIAGNOSIS — DO NOT WAIT FOR CXR</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Tension pneumothorax causes death in minutes. Needle decompression first — confirm later. In cardiac arrest or rapid deterioration: treat presumptively.</div>
      </div>

      {/* Simple vs Tension comparison */}
      <div style={sL()}>Simple vs Tension Pneumothorax</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={card({ borderLeft: `3px solid ${T.gold}`, padding: "13px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 8 }}>Simple PTX</div>
          {["Air in pleural space", "No mediastinal shift", "Hemodynamically stable", "Decreased breath sounds unilaterally", "Can wait for CXR confirmation", "Chest tube or observation depending on size"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, display: "flex", gap: 5, marginBottom: 3 }}><span style={{ color: T.gold }}>●</span>{s}</div>
          ))}
        </div>
        <div style={card({ borderLeft: `3px solid ${T.coral}`, padding: "13px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 8 }}>Tension PTX</div>
          {["One-way valve mechanism", "Progressive air accumulation", "Mediastinal shift AWAY from affected side", "Hemodynamic collapse", "JVD + tracheal deviation", "IMMEDIATE decompression required"].map((s, i) => (
            <div key={i} style={{ fontSize: 11, color: T.muted, display: "flex", gap: 5, marginBottom: 3 }}><span style={{ color: T.coral }}>●</span>{s}</div>
          ))}
        </div>
      </div>

      <div style={sL()}>Classic Signs — "5Ts" of Tension PTX</div>
      {[
        { sign: "Tachycardia",             detail: "Compensatory response to falling cardiac output · often early sign · HR &gt; 120 commonly seen before hypotension develops", color: T.amber },
        { sign: "Tracheal Deviation",      detail: "AWAY from affected side · late sign · insensitive in clinical practice (only 30–35% have detectable deviation) · do NOT wait for this sign to act", color: T.gold },
        { sign: "Tension (decreased breath sounds)", detail: "Unilateral absent or markedly reduced breath sounds on affected side · auscultate bilaterally in every trauma patient · unreliable in noisy ED", color: T.teal },
        { sign: "Turgid JVP (JVD)",        detail: "Elevated jugular venous distension · venous return obstructed by mediastinal compression · may be absent in hypovolemic patient (mixed obstructive + hemorrhagic shock)", color: T.blue },
        { sign: "Tremendous Hypotension",  detail: "Obstructive shock — mediastinal shift compresses vena cava and heart · may develop suddenly · PEA arrest if untreated", color: T.coral },
      ].map(({ sign, detail, color }) => (
        <div key={sign} style={{ ...G(), padding: "11px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{sign}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.blue)}>POCUS Findings</div>
      {[
        { finding: "Absent lung sliding", detail: "Normal lung: pleural line moves with respiration (sliding) · Pneumothorax: no movement = 'stratosphere sign' on M-mode vs 'seashore sign' · Sensitivity 87–90% · Specificity 98–100%", color: T.blue },
        { finding: "Absent B-lines",     detail: "B-lines (comet tails) rule OUT pneumothorax in that area · if B-lines present = lung is touching chest wall = no PTX there · check multiple intercostal spaces", color: T.teal },
        { finding: "Lung Point",         detail: "Transition between sliding and non-sliding pleura = edge of pneumothorax · pathognomonic but not seen in tension (complete collapse) · 66% sensitive · 100% specific", color: T.purple },
        { finding: "Mediastinal shift",  detail: "Cardiac structures displaced TOWARD contralateral side · trachea deviated · subcostal view shows heart rotated away from affected side · tension PTX", color: T.coral },
      ].map(({ finding, detail, color }) => (
        <div key={finding} style={{ ...G(), padding: "10px 13px", marginBottom: 7, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{finding}</div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
        </div>
      ))}

      <div style={sL(T.gold)}>Causes</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {[
          { c: "Trauma (most common)", d: "Penetrating chest trauma · rib fractures · blunt deceleration", color: T.coral },
          { c: "Iatrogenic",          d: "Central line placement · intubation (right mainstem) · biopsy · positive pressure ventilation", color: T.amber },
          { c: "Spontaneous (Primary)", d: "Tall thin young males · Marfan syndrome · subpleural blebs · no underlying disease", color: T.blue },
          { c: "Spontaneous (Secondary)", d: "COPD (most common) · asthma · cystic fibrosis · Pneumocystis in HIV · interstitial lung disease", color: T.teal },
          { c: "Mechanical Ventilation", d: "High PEEP · high peak pressures · barotrauma · auto-PEEP in asthma/COPD · common in ARDS", color: T.gold },
          { c: "Rib fractures",       d: "Flail chest · sharp fragment lacerates pleura · often bilateral", color: T.purple },
        ].map(({ c, d, color }) => (
          <div key={c} style={{ ...G({ borderRadius: 9 }), padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color, marginBottom: 2 }}>{c}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 1: NEEDLE DECOMPRESSION ──────────────────────────────────────
  const T1 = (
    <div>
      <div style={{ ...G({ borderRadius: 14, border: `2px solid ${T.coral}55`, background: "rgba(244,63,94,0.08)", marginBottom: 16 }), padding: "13px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.coral, marginBottom: 4 }}>DO THIS FIRST — Immediate Decompression</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Needle decompression is a temporizing measure only. Chest tube MUST follow. In arrest or near-arrest: bilateral decompression simultaneously.</div>
      </div>

      {/* Site selection */}
      <div style={sL()}>Decompression Site — Choose Approach</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["Needle", "Finger"].map(m => (
          <button key={m} onClick={() => setMethod(m)}
            style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid ${method === m ? T.coral : T.border}`, background: method === m ? "rgba(244,63,94,0.15)" : T.glass, color: method === m ? T.coral : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, transition: "all 0.15s" }}>
            {m === "Needle" ? "🔵 Needle Decompression" : "✋ Finger Thoracostomy"}
          </button>
        ))}
      </div>

      {method === "Needle" ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ ...card({ borderLeft: `3px solid ${T.teal}` }) }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Site 1: 2nd ICS Midclavicular</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 6 }}>
                2nd intercostal space · midclavicular line · upper border of 3rd rib (avoid neurovascular bundle at inferior edge)
              </div>
              <div style={{ ...tag(T.teal), fontSize: 9 }}>Traditional · ACS/TCCC standard</div>
            </div>
            <div style={{ ...card({ borderLeft: `3px solid ${T.blue}` }) }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>Site 2: 4th/5th ICS Anterior Axillary Line</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 6 }}>
                4th–5th ICS · anterior axillary line · higher success rate in trauma (thicker chest walls) · avoid breast tissue
              </div>
              <div style={{ ...tag(T.blue), fontSize: 9 }}>Preferred in trauma · ATLS 11th edition</div>
            </div>
          </div>

          <div style={sL()}>Needle Decompression Technique</div>
          {[
            { n: 1, step: "Identify landmark", detail: "2nd ICS MCL: feel clavicle → count down 2 spaces · OR 4th/5th ICS AAL: nipple level → anterior axillary line", color: T.teal },
            { n: 2, step: "Prepare equipment",  detail: "14G or 16G angiocath (3.25 inch minimum in obese patients) · longer needle required if large chest wall · 8cm catheter recommended in TCCC", color: T.blue },
            { n: 3, step: "Insert needle",      detail: "Perpendicular to chest wall · upper border of lower rib (avoids intercostal neurovascular bundle at inferior rib border) · advance until resistance lost + air rushes out (rush of air = successful decompression)", color: T.gold },
            { n: 4, step: "Remove needle, leave catheter", detail: "Leave plastic catheter in place · secure to chest wall · hiss of air = successful · monitor for hemodynamic improvement immediately", color: T.amber },
            { n: 5, step: "Assess response",   detail: "Immediate improvement in BP · HR decreasing · improved SpO₂ · patient clenching (regaining consciousness) · follow with chest tube", color: T.green },
            { n: 6, step: "Failure → try again", detail: "If no improvement: consider wrong site · catheter kinked · inadequate needle length · bilateral tension PTX · other cause of obstructive shock (tamponade) · attempt other site or immediately proceed to finger thoracostomy", color: T.coral },
          ].map(({ n, step, detail, color }) => (
            <div key={n} style={{ ...card({ marginBottom: 7 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
                <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
              </div>
            </div>
          ))}

          <div style={aBox(T.amber, 0)}>
            <div style={{ fontSize: 11.5, color: T.muted }}>
              <span style={{ color: T.amber, fontWeight: 700 }}>Failure Rate: 30–38% with standard 3.25cm needle</span> — chest wall may be too thick, especially in obese or muscular patients. Use longest available needle. If failure: finger thoracostomy.
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={aBox(T.coral, 14)}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.coral, marginBottom: 2 }}>Finger Thoracostomy — Most Reliable Immediate Decompression</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>Higher success rate than needle decompression. Preferred in penetrating trauma, obese patients, and when needle fails. Requires chest tube immediately after.</div>
          </div>

          <div style={sL()}>Finger Thoracostomy Technique</div>
          {[
            { n: 1, step: "Landmark",      detail: "4th–5th ICS · anterior axillary line · OR 5th ICS · midaxillary line (ATLS) · same level as nipple line · safe triangle area (avoid liver/spleen below 5th ICS)", color: T.teal },
            { n: 2, step: "Incision",      detail: "2–3 cm transverse incision through skin and subcutaneous tissue along upper border of rib · use scalpel for skin only · blunt dissect through intercostal muscles with Kelly clamp", color: T.blue },
            { n: 3, step: "Blunt entry",   detail: "Kelly clamp opened and advanced through intercostal space into pleural cavity · open and spread to create adequate opening · feel for rush of air (decompression) · blood may exit (hemothorax)", color: T.gold },
            { n: 4, step: "Finger confirmation", detail: "Insert finger into pleural space (latex glove) · sweep 360° to confirm position · rule out diaphragm injury (abdominal viscera = do NOT insert chest tube) · feel for lung expansion", color: T.amber },
            { n: 5, step: "Chest tube immediately", detail: "Insert 32–36 Fr chest tube along finger as guide · direct tube posteriorly and superiorly · secure and connect to water seal / drainage system · confirm with CXR", color: T.coral },
          ].map(({ n, step, detail, color }) => (
            <div key={n} style={{ ...card({ marginBottom: 7 }), display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color, flexShrink: 0 }}>{n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{step}</div>
                <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── TAB 2: CHEST TUBE ────────────────────────────────────────────────
  const T2 = (
    <div>
      <div style={aBox(T.teal, 16)}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>Chest Tube — Definitive Treatment for Pneumothorax + Hemothorax</div>
        <div style={{ fontSize: 11.5, color: T.muted }}>Large-bore tube thoracostomy (28–36 Fr) for trauma pneumothorax and hemothorax. Smaller tubes (14–20 Fr) acceptable for simple spontaneous pneumothorax.</div>
      </div>

      {/* Size selector */}
      <div style={sL()}>Indication-Based Tube Size</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { s: "Simple PTX (Spontaneous)", size: "14–20 Fr pigtail/Seldinger", color: T.green },
          { s: "Hemothorax (Trauma)", size: "32–36 Fr large-bore", color: T.coral },
          { s: "Tension → Chest Tube", size: "28–32 Fr after decompression", color: T.amber },
          { s: "Hemopneumothorax", size: "32–36 Fr", color: T.coral },
        ].map(({ s, size, color }) => (
          <div key={s} style={{ ...G({ borderRadius: 9 }), padding: "9px 12px", flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>{s}</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.white }}>{size}</div>
          </div>
        ))}
      </div>

      {/* Landmark anatomy */}
      <div style={sL()}>Chest Tube Technique — Safe Triangle</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 8 }}>Safe Triangle — Standard Insertion Zone</div>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          Boundaries: anterior border of latissimus dorsi · lateral border of pectoralis major · above nipple line (5th ICS) · apex below axilla. Avoids major vessels (long thoracic nerve · thoracodorsal artery).
        </div>
        {[
          { n: 1, step: "Position + Prep", detail: "Patient supine with ipsilateral arm raised (hand under head) · sterile prep and drape · local anesthesia (lidocaine 1% with epinephrine) liberally into skin, subcutaneous tissue, periosteum, and pleura" },
          { n: 2, step: "Incision",       detail: "2–3 cm transverse incision over 5th ICS (nipple level) in midaxillary line · use scalpel for skin · then Kelly clamp for blunt dissection to rib superior border" },
          { n: 3, step: "Pleural Entry",  detail: "Kelly clamp pushed firmly over superior border of 6th rib into pleural space · air/blood confirms entry · open clamp widely to create adequate passage · finger sweep to confirm position and clear clots" },
          { n: 4, step: "Tube Insertion", detail: "Grasp tube tip with Kelly clamp · insert posteriorly and superiorly (apex for PTX · base for effusion/hemothorax) · confirm all fenestrations inside chest · advance until resistance · tube depth: large males ~40–45cm; small females ~30–35cm" },
          { n: 5, step: "Secure + Connect", detail: "Suture tube to skin (0-silk purse-string + anchor) · transparent dressing · connect to water-seal drainage system (Pleur-evac) · apply low suction (-20 cmH₂O) · confirm tube fogging with respiration" },
          { n: 6, step: "Confirm",        detail: "CXR immediately · tube tip should be at apex for PTX · sustained air leak = hole in lung parenchyma (often traumatic) or tube disconnect · large hemothorax output &gt; 1500 mL initial or &gt; 200 mL/h × 2h = surgical consult" },
        ].map(({ n, step, detail }) => (
          <div key={n} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: n < 6 ? `1px solid ${T.border}` : "none", alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.teal + "22", border: `1px solid ${T.teal}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.teal, flexShrink: 0 }}>{n}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 2 }}>{step}</div>
              <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pigtail / Seldinger */}
      <div style={sL(T.purple)}>Pigtail / Seldinger Technique (Small Bore)</div>
      <div style={{ ...card({ marginBottom: 14 }) }}>
        <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5, marginBottom: 8 }}>
          For simple spontaneous PTX · no active bleeding · ultrasound-guided preferred. Equivalent outcomes to large-bore for spontaneous PTX (DEVIATE trial).
        </div>
        {["Ultrasound confirmation of PTX and optimal insertion site",
          "Needle-over-wire technique (Seldinger) · same safe triangle landmarks",
          "Dilate tract sequentially over wire",
          "14–20 Fr pigtail catheter advanced over wire",
          "Connect to water-seal and confirm expansion on CXR"].map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: T.purple }}>▸</span>{s}
          </div>
        ))}
        <div style={{ ...aBox(T.gold, 0), marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: T.muted }}>AVOID pigtail in trauma or hemothorax — inadequate drainage for blood · use large-bore tube</div>
        </div>
      </div>

      <div style={sL(T.gold)}>Spontaneous PTX — Conservative Management</div>
      <div style={{ ...card() }}>
        {[
          { criteria: "Small PTX (&lt; 2cm apex or &lt; 3cm lateral)", mgmt: "Observation alone · 100% O₂ accelerates reabsorption (4× faster) · repeat CXR 6h · discharge if stable with 24h follow-up · prescribe no exertion, no air travel" },
          { criteria: "Large PTX (≥ 2cm or symptomatic)", mgmt: "Aspiration (60 mL syringe via 16G catheter) first attempt · if successful and lung re-expands → discharge; if failure → small-bore catheter or chest tube" },
          { criteria: "Secondary (underlying lung disease)", mgmt: "Lower threshold for chest tube even with small PTX · COPD patient poorly tolerates even small PTX · consider inpatient observation for all secondary PTX" },
        ].map(({ criteria, mgmt }, i) => (
          <div key={i} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 2 }}>{criteria}</div>
            <div style={{ fontSize: 11.5, color: T.muted }}>{mgmt}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB 3: MONITORING ───────────────────────────────────────────────────
  const T3 = (
    <div>
      <div style={sL()}>Post-Decompression Assessment</div>
      {[
        { time: "Immediately",     expect: "BP rapidly improving · HR decreasing · SpO₂ improving · patient becoming more alert · audible rush of air during decompression", color: T.coral },
        { time: "2–5 min",         expect: "Hemodynamic stability returning · chest tube output (if placed) · bilateral breath sounds improving · JVD resolving", color: T.gold },
        { time: "30 min",          expect: "Reassess for residual PTX · check tube position · water seal swinging with respiration (confirms placement) · repeat clinical exam", color: T.teal },
        { time: "Post-CXR",        expect: "Lung re-expansion confirmed · tube position at apex for PTX · no residual pneumothorax · drain output recorded", color: T.green },
      ].map(({ time, expect, color }) => (
        <div key={time} style={{ ...G(), padding: "9px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 700, color, minWidth: 90, flexShrink: 0 }}>{time}</div>
          <div style={{ fontSize: 11.5, color: T.muted }}>{expect}</div>
        </div>
      ))}

      <div style={sL()}>Ongoing Chest Tube Management</div>
      {[
        { param: "Water Seal Swinging",  normal: "Oscillates with respiration",               alarm: "No swing: tube kinked · clotted · malpositioned · lung fully expanded" },
        { param: "Air Leak (Bubbling)",  normal: "Initial bubbling expected (trauma) · should resolve",  alarm: "Continuous large air leak = parenchymal injury · may need bronchoscopy or VATS" },
        { param: "Output Volume",        normal: "Bloody initially (trauma) → serosanguinous → serous", alarm: "&gt; 1500 mL initial or &gt; 200 mL/h × 2h = surgical thoracotomy" },
        { param: "Suction",              normal: "−20 cmH₂O water suction standard",            alarm: "Increase to −40 cmH₂O if lung not re-expanding after 12–24h · consult surgery" },
      ].map(({ param, normal, alarm }) => (
        <div key={param} style={{ ...card({ marginBottom: 7 }) }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.teal, marginBottom: 6 }}>{param}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.green, fontWeight: 700, marginBottom: 2 }}>Normal</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{normal}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.coral, fontWeight: 700, marginBottom: 2 }}>Alarm</div>
              <div style={{ fontSize: 11.5, color: T.muted }}>{alarm}</div>
            </div>
          </div>
        </div>
      ))}

      <div style={sL(T.coral)}>Escalation Triggers</div>
      {["No improvement after needle decompression → second site attempt OR immediate finger thoracostomy → chest tube",
        "Bilateral findings on exam or bilateral tension suspected (trauma / ventilated) → bilateral decompression simultaneously",
        "Cardiac arrest with PEA → bilateral needle decompression as part of H's and T's algorithm",
        "Hemothorax output &gt; 1500 mL or &gt; 200 mL/h → thoracic surgery consult for OR",
        "Persistent large air leak &gt; 24h → bronchoscopy to evaluate for bronchial injury · VATS consideration",
        "Lung not re-expanding on CXR after 12h → second tube · consider empyema if infected"].map((t, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ color: T.coral, flexShrink: 0 }}>⚠</span>{t}
        </div>
      ))}

      <div style={sL(T.purple)}>Chest Tube Removal Criteria</div>
      {["Air leak resolved (no bubbling in water seal for 24h on water seal only — not suction)",
        "Output &lt; 150–200 mL/day (traumatic hemothorax) or &lt; 50–100 mL/day (simple PTX/effusion)",
        "CXR confirms full lung re-expansion",
        "Patient tolerating clamping trial (selected cases) if borderline output",
        "No fever or signs of pleural infection",
        "Patient tolerating oral intake and ambulatory if applicable"].map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: T.muted, display: "flex", gap: 8, marginBottom: 5 }}>
          <span style={{ color: T.green }}>✓</span>{s}
        </div>
      ))}

      <div style={sL(T.gold)}>Disposition</div>
      <div style={{ ...card() }}>
        {[
          { level: "ICU",           detail: "Tension PTX requiring decompression · hemothorax &gt; 500 mL · bilateral PTX · traumatic PTX on ventilator · hemodynamic instability · ongoing air leak" },
          { level: "Trauma Surgery", detail: "Hemothorax &gt; 1500 mL initial · ongoing &gt; 200 mL/h · penetrating mechanism · suspected great vessel or cardiac injury · bilateral significant hemothorax" },
          { level: "Telemetry / Floor", detail: "Stable PTX with chest tube in place · simple spontaneous PTX with aspiration or pigtail · monitoring for re-expansion pulmonary edema (rare but dangerous) · regular drain assessments" },
          { level: "Discharge",     detail: "Small spontaneous PTX with observation protocol · PTNX &lt; 2cm on CXR · no supplemental O₂ requirement · reliable 24h follow-up arranged · no manual labor or air travel for 6 weeks until healed" },
        ].map(({ level, detail }, i) => (
          <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 7, marginBottom: 7, borderBottom: i < 3 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, minWidth: 120, flexShrink: 0 }}>{level}</div>
            <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.4 }}>{detail}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 70% 40% at 15% 0%, rgba(244,63,94,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 85% 95%, rgba(20,184,166,0.07) 0%, transparent 55%), ${T.bg}`, fontFamily: T.sans, color: T.white, paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: T.teal, fontSize: 13, fontFamily: T.sans, cursor: "pointer", padding: "4px 0", marginBottom: 16 }}>
          ← Critical Protocols
        </button>
        <div>
          <span style={pill("linear-gradient(135deg,#3b82f6,#1e3a8a)")}>❤️ Cardiac / Pulm</span>
          <span style={pill("linear-gradient(135deg,#f43f5e,#be185d)")}>ATLS 11th Ed</span>
        </div>
        <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.15 }}>Tension Pneumothorax</h1>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 20px" }}>5Ts · POCUS findings · Needle decompression · Finger thoracostomy · Chest tube technique · Water seal monitoring</p>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 18, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: "7px 15px", borderRadius: 9, border: `1.5px solid ${tab === i ? T.coral : T.border}`, background: tab === i ? "rgba(244,63,94,0.14)" : T.glass, color: tab === i ? T.coral : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.sans, whiteSpace: "nowrap", transition: "all 0.18s", backdropFilter: "blur(8px)" }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        {tab === 0 && T0}{tab === 1 && T1}{tab === 2 && T2}{tab === 3 && T3}
      </div>
    </div>
  );
}