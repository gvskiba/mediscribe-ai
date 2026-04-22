// DermMorphologyRef.jsx
// Visual primary skin morphology reference — 22 morphologies
// Wikipedia clinical photos · Urgency flags · ED significance · Filter + search
// Standalone page + embeddable in DermatologyHub

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── STYLE INJECTION ──────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("dmr-css")) return;
  const s = document.createElement("style"); s.id = "dmr-css";
  s.textContent = `
    :root{
      --dmr-bg:#050f1e;--dmr-panel:#081628;
      --dmr-txt:#f2f7ff;--dmr-txt2:#b8d4f0;--dmr-txt3:#82aece;--dmr-txt4:#6b9ec8;
      --dmr-teal:#00e5c0;--dmr-gold:#f5c842;--dmr-coral:#ff6b6b;--dmr-blue:#3b9eff;
      --dmr-orange:#ff9f43;--dmr-purple:#9b6dff;--dmr-green:#3dffa0;--dmr-red:#ff4444;
      --dmr-bd:rgba(42,79,122,0.4);--dmr-up:rgba(14,37,68,0.75);
    }
    @keyframes dmrfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .dmr-fade{animation:dmrfade .22s ease both}
    @keyframes dmrshim{0%{background-position:-200% center}100%{background-position:200% center}}
    .dmr-shim{
      background:linear-gradient(90deg,#e8f0fe 0%,#fff 28%,#00e5c0 50%,#9b6dff 72%,#e8f0fe 100%);
      background-size:250% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      background-clip:text;animation:dmrshim 7s linear infinite
    }
    @keyframes dmrpulse{0%,100%{opacity:.5}50%{opacity:1}}
    .dmr-pulse{animation:dmrpulse 1.5s ease-in-out infinite}
    .dmr-card{
      border-radius:12px;overflow:hidden;cursor:pointer;
      background:rgba(8,22,40,.8);transition:all .18s;
      position:relative;
    }
    .dmr-card:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
    .dmr-filter-btn{
      padding:5px 14px;border-radius:8px;cursor:pointer;transition:all .14s;
      font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;
      background:rgba(14,37,68,.5);border:1px solid rgba(42,79,122,.35);color:var(--dmr-txt4)
    }
    .dmr-filter-btn.on{background:rgba(0,229,192,.1);border-color:rgba(0,229,192,.45);color:var(--dmr-teal)}
    .dmr-si{
      background:var(--dmr-up);border:1px solid var(--dmr-bd);border-radius:8px;
      padding:7px 11px;color:var(--dmr-txt);font-family:'DM Sans',sans-serif;
      font-size:12px;outline:none;width:100%;box-sizing:border-box;transition:border-color .15s
    }
    .dmr-si:focus{border-color:rgba(0,229,192,.5)}
    .dmr-drawer{
      position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);
      background:#081628;border-left:1px solid rgba(42,79,122,.5);
      overflow-y:auto;z-index:1000;
      box-shadow:-8px 0 32px rgba(0,0,0,.5);
    }
    .dmr-scrim{
      position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;
    }
    @keyframes drawin{from{transform:translateX(100%)}to{transform:translateX(0)}}
    .dmr-drawer{animation:drawin .22s ease both}
    @media(max-width:600px){.dmr-drawer{width:100vw}}
    @media print{.no-print{display:none!important}}
  `;
  document.head.appendChild(s);
  if (!document.getElementById("dmr-fonts")) {
    const l = document.createElement("link"); l.id = "dmr-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l);
  }
})();

// ─── MORPHOLOGY DATA ──────────────────────────────────────────────────────────
const MORPHOLOGIES = [
  {
    id:"macule", name:"Macule", icon:"○",
    size:"Flat · ≤1cm", category:"primary_solid", urgency:"emergent",
    definition:"Flat, non-palpable, circumscribed color change ≤1cm in diameter. No surface elevation or depression.",
    ed_significance:"Non-blanching macules (petechiae) = rule out RMSF/meningococcemia/thrombocytopenia. Blanching macules generally benign.",
    key_feature:"FLAT — cannot be palpated or felt with eyes closed",
    ed_examples:["Drug eruption (morbilliform)","Viral exanthem","Cafe-au-lait spots","Freckles","Petechia (if <3mm, non-blanching)"],
    urgent_if:"Non-blanching — always rule out vascular emergency. Drug eruption + new medication = drug reaction watch.",
    workup:"Blanch test (glass slide/fingertip pressure). Diascopy separates blanching from non-blanching.",
    differentials:["Viral exanthem","Drug reaction","Early Rocky Mountain spotted fever","Tinea versicolor"],
    wiki:["Petechia","Port-wine stain","Freckle","Macule"],
    color:"#3b9eff",
  },
  {
    id:"patch", name:"Patch", icon:"□",
    size:"Flat · >1cm", category:"primary_solid", urgency:"common",
    definition:"Large macule >1cm. Flat, non-palpable color change. Often irregular borders.",
    ed_significance:"Large hypopigmented patches suggest vitiligo, tinea versicolor, or post-inflammatory hypopigmentation. Erythematous patches suggest dermatitis or drug reaction.",
    key_feature:"Like a macule — just larger. Still completely FLAT.",
    ed_examples:["Vitiligo","Tinea versicolor","Port-wine stain","Melasma","Pityriasis rosea herald patch"],
    urgent_if:"Large expanding erythematous patch with fever = consider erysipelas or early cellulitis.",
    workup:"KOH prep for tinea. Woods lamp for tinea versicolor and vitiligo.",
    differentials:["Vitiligo","Tinea versicolor","Pityriasis rosea","Contact dermatitis","Melasma"],
    wiki:["Vitiligo","Tinea versicolor","Melasma"],
    color:"#82aece",
  },
  {
    id:"papule", name:"Papule", icon:"⊙",
    size:"Raised · solid · ≤1cm", category:"primary_solid", urgency:"common",
    definition:"Raised, palpable, solid lesion ≤1cm. Various shapes: dome, flat-topped, pedunculated, filiform.",
    ed_significance:"Groups of umbilicated papules = molluscum (immunocompromised). Violaceous flat-topped papules = lichen planus (rule out hepatitis C).",
    key_feature:"Raised, palpable solid bump — smaller than a pencil eraser",
    ed_examples:["Warts (HPV)","Lichen planus","Acne comedone","Insect bites","Keratosis pilaris","Molluscum contagiosum"],
    urgent_if:"Umbilicated papules in immunocompromised = disseminated cryptococcosis. Grouped dermatomal = herpes zoster prodrome.",
    workup:"Dermoscopy for pigmented papules. Scraping for KOH. Biopsy for persistent undiagnosed papules.",
    differentials:["Molluscum contagiosum","Lichen planus","Warts","Early BCC","Acne"],
    wiki:["Molluscum contagiosum","Wart","Lichen planus","Papule"],
    color:"#3b9eff",
  },
  {
    id:"plaque", name:"Plaque", icon:"▭",
    size:"Raised · solid · >1cm", category:"primary_solid", urgency:"common",
    definition:"Raised, palpable, solid lesion >1cm, often with a flat or plateau-like top. Frequently formed by coalescence of papules.",
    ed_significance:"Silver-scaled plaques = psoriasis (check for arthritis, CV risk). Annular plaques = tinea corporis, granuloma annulare.",
    key_feature:"Large raised flat-topped solid lesion — like a mesa vs. a mountain",
    ed_examples:["Psoriasis","Atopic dermatitis","Discoid lupus","Mycosis fungoides","Tinea corporis"],
    urgent_if:"Rapidly expanding warm erythematous plaque with fever = cellulitis or erysipelas.",
    workup:"Biopsy for undiagnosed plaques. ANA/dsDNA if lupus suspected. KOH for tinea.",
    differentials:["Psoriasis","Eczema/Atopic dermatitis","Tinea corporis","Discoid lupus","Contact dermatitis"],
    wiki:["Psoriasis","Atopic dermatitis","Plaque (dermatology)"],
    color:"#3b9eff",
  },
  {
    id:"vesicle", name:"Vesicle", icon:"◎",
    size:"Fluid · ≤1cm", category:"primary_fluid", urgency:"urgent",
    definition:"Raised, fluid-filled lesion ≤1cm. Contains clear (serous) or cloudy fluid. Thin-walled.",
    ed_significance:"Grouped dermatomal vesicles = varicella-zoster. Oral/genital vesicles = HSV. Widespread vesicles + mucosal erosions = exclude SJS.",
    key_feature:"Blister filled with clear/cloudy fluid — smaller than 1cm",
    ed_examples:["Herpes simplex (HSV-1/2)","Varicella (chickenpox)","Herpes zoster (shingles)","Contact dermatitis","Dyshidrotic eczema"],
    urgent_if:"Dermatomal + immunocompromised = admission, IV acyclovir. Vesicles + mucosal erosions + new drug = SJS until proven otherwise.",
    workup:"Tzanck smear. PCR swab gold standard. DIF for autoimmune blistering disease.",
    differentials:["Herpes simplex","Varicella-zoster","Contact dermatitis","Dyshidrosis","Miliaria crystallina"],
    wiki:["Herpes simplex","Varicella","Herpes zoster","Vesicle (dermatology)"],
    color:"#9b6dff",
  },
  {
    id:"bulla", name:"Bulla", icon:"◉",
    size:"Fluid · >1cm", category:"primary_fluid", urgency:"emergent",
    definition:"Large fluid-filled blister >1cm. Can be tense (subepidermal) or flaccid (intraepidermal). Contains serous, serosanguineous, or hemorrhagic fluid.",
    ed_significance:"Tense bullae = bullous pemphigoid. Flaccid bullae + Nikolsky+ = pemphigus vulgaris or TEN. Nikolsky sign: lateral pressure on normal skin → new blister.",
    key_feature:"Large blister >1cm. Flaccid vs tense tells you epidermis vs subepidermal.",
    ed_examples:["Bullous pemphigoid","Pemphigus vulgaris","Second/third-degree burns","TEN","Bullous impetigo","Fixed drug eruption"],
    urgent_if:"Nikolsky+ → TEN/SSSS/pemphigus: stop all drugs, emergent dermatology, ICU/burn unit. Hemorrhagic bullae with fever = necrotizing fasciitis until excluded.",
    workup:"Nikolsky sign. Biopsy (peri-lesional for DIF). CBC, metabolic panel. Drug history.",
    differentials:["TEN","Bullous pemphigoid","Pemphigus vulgaris","SSSS","Burns","Fixed drug eruption"],
    wiki:["Bullous pemphigoid","Blister","Toxic epidermal necrolysis","Pemphigus vulgaris"],
    color:"#ff4444",
  },
  {
    id:"pustule", name:"Pustule", icon:"⊕",
    size:"Pus-filled · raised", category:"primary_fluid", urgency:"common",
    definition:"Raised, circumscribed, superficial lesion filled with purulent exudate (pus). May be follicular or non-follicular.",
    ed_significance:"Follicular pustules = folliculitis or acne. Non-follicular pustules in sterile psoriasis patches = pustular psoriasis. Umbilicated pustules = eczema herpeticum.",
    key_feature:"Pus-filled — yellow/white opaque fluid. Superficial unlike abscess.",
    ed_examples:["Acne vulgaris","Folliculitis","Impetigo (non-bullous)","Pustular psoriasis (Von Zumbusch)","Gonococcal septic emboli"],
    urgent_if:"Generalized pustules + fever + psoriasis history = Von Zumbusch pustular psoriasis (life-threatening). Pustules + eczematous skin + fever = eczema herpeticum (IV acyclovir).",
    workup:"Gram stain + culture. KOH for fungal. Tzanck if viral suspected.",
    differentials:["Folliculitis","Acne","Pustular psoriasis","Eczema herpeticum","Impetigo","Candidiasis"],
    wiki:["Impetigo","Pustule","Acne vulgaris","Folliculitis"],
    color:"#ff9f43",
  },
  {
    id:"nodule", name:"Nodule", icon:"●",
    size:"Raised · deep · solid · >1cm", category:"primary_solid", urgency:"urgent",
    definition:"Raised, solid, palpable lesion >1cm extending into dermis or subcutis. Larger and deeper than a papule.",
    ed_significance:"Any rapidly growing, firm nodule in adult = rule out melanoma and SCC. Tender nodule on lower extremity = erythema nodosum (systemic disease marker).",
    key_feature:"Deep solid bump — palpate depth. Like feeling a marble under the skin.",
    ed_examples:["Basal cell carcinoma (BCC)","Squamous cell carcinoma (SCC)","Lipoma","Erythema nodosum","Melanoma (nodular type)","Dermatofibroma"],
    urgent_if:"Rapidly growing nodule with bleeding → nodular melanoma (doesn't follow ABCDE). Pink/red nodule that bleeds on contact = pyogenic granuloma vs amelanotic melanoma — biopsy urgently.",
    workup:"Excisional biopsy for pigmented nodules. US for depth. Punch biopsy for inflammatory nodules.",
    differentials:["Melanoma (nodular)","BCC","Dermatofibroma","Lipoma","Pyogenic granuloma","Erythema nodosum"],
    wiki:["Basal-cell carcinoma","Dermatofibroma","Nodule (medicine)","Erythema nodosum"],
    color:"#ff9f43",
  },
  {
    id:"wheal", name:"Wheal / Urticaria", icon:"⊗",
    size:"Raised · edematous · transient", category:"primary_solid", urgency:"urgent",
    definition:"Raised, edematous, erythematous lesion with central pallor. TRANSIENT — individual lesions resolve within 24 hours. Intensely pruritic.",
    ed_significance:"Wheals + angioedema + systemic symptoms = anaphylaxis → epinephrine 0.3mg IM immediately. Urticaria lasting >6 weeks = chronic urticaria (autoimmune).",
    key_feature:"THE defining feature: individual lesions MIGRATE and resolve within 24h. Fixed >24h → biopsy (urticarial vasculitis).",
    ed_examples:["Acute urticaria (allergic)","Anaphylaxis","Dermographism","Cholinergic urticaria","Serum sickness","Drug reaction"],
    urgent_if:"Wheals + throat tightness/stridor/hypotension = ANAPHYLAXIS. Epinephrine IM 0.3mg anterolateral thigh, IV access, diphenhydramine + H2 blocker + corticosteroid.",
    workup:"H1 antihistamine trial. If fixed >24h: biopsy for urticarial vasculitis. C4 level for hereditary angioedema.",
    differentials:["Anaphylaxis","Drug reaction","Food allergy","Viral urticaria","Urticarial vasculitis","HAE"],
    wiki:["Urticaria","Hives","Angioedema","Anaphylaxis"],
    color:"#ff9f43",
  },
  {
    id:"petechiae", name:"Petechiae", icon:"·",
    size:"Non-blanching · <3mm", category:"vascular", urgency:"emergent",
    definition:"Pinpoint (1-3mm) non-blanching red/purple macules caused by extravasation of red blood cells. Do NOT blanch on diascopy.",
    ed_significance:"ANY petechiae in an acutely ill patient = potentially life-threatening until proven otherwise. RMSF starts at wrists/ankles. Meningococcemia: rapidly spreading petechiae + fever + meningismus = emergent antibiotics.",
    key_feature:"NON-BLANCHING. Glass test: press glass — if you see spots through it, they are petechiae.",
    ed_examples:["Rocky Mountain spotted fever (wrists/ankles first)","Meningococcemia (rapidly spreading)","ITP/TTP","Viral thrombocytopenia","Endocarditis emboli"],
    urgent_if:"Petechiae + fever = septic until proven otherwise. RMSF: doxycycline empirically. Meningococcemia: ceftriaxone 2g IV stat.",
    workup:"STAT CBC, blood cultures x2, metabolic panel. Peripheral smear for schistocytes (TTP). PT/INR/PTT.",
    differentials:["RMSF","Meningococcemia","ITP","TTP","Viral thrombocytopenia","Fat embolism","Vasculitis"],
    wiki:["Petechia","Meningococcemia","Rocky Mountain spotted fever"],
    color:"#ff4444",
  },
  {
    id:"purpura", name:"Purpura", icon:"◆",
    size:"Non-blanching · >3mm", category:"vascular", urgency:"emergent",
    definition:"Non-blanching red/purple lesion >3mm caused by extravasation of blood. Flat (non-palpable) or palpable (raised).",
    ed_significance:"Palpable purpura = leukocytoclastic vasculitis. Purpura fulminans = DIC from sepsis — immediately life-threatening. Non-palpable purpura = thrombocytopenia, coagulopathy.",
    key_feature:"Bigger than petechiae, still non-blanching. Palpable vs. flat = critical: palpable means vasculitis.",
    ed_examples:["Henoch-Schönlein Purpura (IgA vasculitis)","Meningococcemia","Purpura fulminans / DIC","ITP","Cryoglobulinemia","RMSF (late)"],
    urgent_if:"Purpura fulminans (black/necrotic, rapidly expanding) = disseminated sepsis + DIC. Broad-spectrum antibiotics, FFP, ICU.",
    workup:"CBC, coagulation studies, peripheral smear, BMP, urinalysis. ANA, ANCA, cryoglobulins if vasculitis suspected.",
    differentials:["Meningococcemia","DIC/Purpura fulminans","HSP","ITP","Vasculitis","RMSF (late)"],
    wiki:["Purpura","Henoch–Schönlein purpura","Purpura fulminans"],
    color:"#ff4444",
  },
  {
    id:"ecchymosis", name:"Ecchymosis", icon:"◈",
    size:"Non-blanching · large bruise", category:"vascular", urgency:"common",
    definition:"Large (>1cm) non-blanching discoloration caused by extravasation of blood into subcutaneous tissue. Evolves: red/blue → green → yellow.",
    ed_significance:"Color dating: fresh = red/purple, 3-5 days = blue/green, 5-7 days = yellow. Bilateral periorbital ecchymosis (Raccoon eyes) = basilar skull fracture.",
    key_feature:"Bruise. Ages through color changes — use to date trauma in abuse cases.",
    ed_examples:["Trauma","Anticoagulation","Factor deficiency (hemophilia)","ITP","Raccoon eyes (basilar skull fracture)"],
    urgent_if:"Ecchymoses + no trauma + elderly = consider elder abuse. Bilateral periorbital = basilar skull fracture.",
    workup:"INR/PTT/TT if coagulopathy suspected. Platelet count. Factor levels if hemophilia.",
    differentials:["Trauma","Anticoagulant effect","Coagulopathy","Elder abuse","Vascular EDS","Scurvy"],
    wiki:["Bruise","Raccoon eyes","Ecchymosis"],
    color:"#f5c842",
  },
  {
    id:"erosion", name:"Erosion", icon:"▽",
    size:"Loss of epidermis only", category:"surface", urgency:"urgent",
    definition:"Superficial loss of epidermis only (partial thickness). Moist, red, well-defined base. Heals WITHOUT scarring. Often from ruptured vesicle or bulla.",
    ed_significance:"Painful oral erosions + vesicle history + fever = herpes gingivostomatitis. Multiple mucosal erosions + new drug = SJS — stop all drugs, emergent dermatology.",
    key_feature:"Superficial — only epidermis gone. HEALS WITHOUT SCAR. Base is moist and red.",
    ed_examples:["Post-vesicle/bulla rupture (HSV, VZV)","SJS/TEN (mucosal erosions)","Pemphigus vulgaris","Herpes labialis","Aphthous ulcer"],
    urgent_if:"Mucosal erosions (oral + genital + conjunctival) + drug history = SJS emergency. Extensive erosions + Nikolsky+ = ICU-level emergency.",
    workup:"Tzanck smear. Viral swab PCR. DIF biopsy if autoimmune bullous disease suspected.",
    differentials:["HSV/VZV (post-vesicle)","SJS (mucosal)","Pemphigus","Aphthous stomatitis","Candidal erosion"],
    wiki:["Herpes labialis","Erosion (dermatology)","Aphthous stomatitis"],
    color:"#ff9f43",
  },
  {
    id:"ulcer", name:"Ulcer", icon:"▼",
    size:"Full thickness loss · heals with scar", category:"surface", urgency:"urgent",
    definition:"Loss of epidermis AND dermis (full thickness). Heals WITH scarring. Has a base, walls, and edge. May extend to subcutaneous tissue, fascia, muscle, or bone.",
    ed_significance:"Punched-out painful ulcers = arterial insufficiency. Shallow, irregular, painless = diabetic neuropathic. Rapidly expanding + necrotic + pain out of proportion = Fournier gangrene or NF.",
    key_feature:"Goes through the FULL dermis — will leave a scar. Classify: base, edge, surrounding skin.",
    ed_examples:["Diabetic foot ulcer","Venous stasis ulcer","Arterial ulcer","Pressure ulcer","Pyoderma gangrenosum","Syphilitic chancre"],
    urgent_if:"Rapidly expanding ulcer + fever + pain out of proportion = NF → emergent surgery. Pyoderma gangrenosum: do NOT debride (pathergy worsens it).",
    workup:"Wound culture. Vascular studies (ABI, doppler). Tissue biopsy. Blood cultures if febrile.",
    differentials:["Diabetic/neuropathic ulcer","Venous stasis","Arterial ischemia","Pyoderma gangrenosum","NF","Pressure ulcer"],
    wiki:["Venous ulcer","Pressure ulcer","Pyoderma gangrenosum","Diabetic foot"],
    color:"#ff4444",
  },
  {
    id:"fissure", name:"Fissure", icon:"∥",
    size:"Linear crack through epidermis ± dermis", category:"surface", urgency:"reference",
    definition:"Linear crack or cleft in the skin, extending through epidermis and often into dermis. Painful. Occurs in areas of thick stratum corneum or chronic inflammation.",
    ed_significance:"Anal fissure = most common cause of bright red rectal bleeding with pain. Fissured cheilitis = nutritional deficiency or candida/staph.",
    key_feature:"Linear split — like a crack in dry earth. Look for secondary infection.",
    ed_examples:["Anal fissure","Angular cheilitis (mouth corners)","Heel fissures","Psoriasis (palmoplantar)","Athlete's foot (toe web fissures)"],
    urgent_if:"Infected fissure with surrounding cellulitis needs antibiotics.",
    workup:"KOH prep for tinea if toe web involved. Culture if infected.",
    differentials:["Tinea pedis","Psoriasis","Eczema craquele","Anal fissure","Angular cheilitis from candida"],
    wiki:["Fissure (dermatology)","Angular cheilitis","Anal fissure"],
    color:"#6b9ec8",
  },
  {
    id:"scale", name:"Scale", icon:"≋",
    size:"Flaking stratum corneum", category:"surface", urgency:"reference",
    definition:"Accumulation of desquamated keratinocytes forming flakes on skin surface. May be fine (pityriasiform), lamellar, or thick/adherent.",
    ed_significance:"Fine scale + diffuse = drug reaction. Thick silver scale on plaques = psoriasis. Widespread erythema + scale >90% BSA = erythroderma (emergency).",
    key_feature:"Surface finding — silvery = psoriasis; yellow = seborrheic; fine/white = pityriasis.",
    ed_examples:["Psoriasis (silver scale)","Seborrheic dermatitis (yellow scale)","Tinea capitis (scalp)","Pityriasis rosea","Drug reaction"],
    urgent_if:"Diffuse erythema + widespread scaling + fever = erythroderma — dermatology emergency.",
    workup:"KOH prep (tinea). Skin biopsy for unusual scaling. TSH if ichthyosis acquired in adult.",
    differentials:["Psoriasis","Seborrheic dermatitis","Pityriasis rosea","Tinea corporis","Drug reaction"],
    wiki:["Dandruff","Seborrheic dermatitis","Pityriasis rosea"],
    color:"#82aece",
  },
  {
    id:"crust", name:"Crust", icon:"≈",
    size:"Dried exudate on skin", category:"surface", urgency:"common",
    definition:"Dried serum, blood, or purulent exudate on skin surface. Secondary lesion. Color indicates content: honey = serous/bacterial; hemorrhagic = blood; black = eschar (necrotic).",
    ed_significance:"Honey-colored crusts = impetigo (contagious). Black eschar = cutaneous anthrax, NF, or ecthyma gangrenosum.",
    key_feature:"COLOR TELLS THE CAUSE: Honey = impetigo. Dark red = bloody. Black = necrotic (serious).",
    ed_examples:["Impetigo (honey-colored)","Herpes labialis (healing phase)","Scabies (on burrows)","Black eschar — NF/meningococcemia late"],
    urgent_if:"Black eschar + spreading erythema + fever = NF or ecthyma gangrenosum from Pseudomonas in neutropenic patient.",
    workup:"Wound culture. Gram stain. Punch biopsy of eschar for culture and histology.",
    differentials:["Impetigo","Infected eczema","Herpes (resolving)","Eschar (NF/anthrax/Pseudomonas)"],
    wiki:["Scab","Impetigo","Eschar"],
    color:"#f5c842",
  },
  {
    id:"lichenification", name:"Lichenification", icon:"⊞",
    size:"Thickened · accentuated skin lines", category:"surface", urgency:"reference",
    definition:"Thickening of epidermis with accentuation of normal skin markings ('tree bark' appearance). Caused by chronic rubbing, scratching, or friction.",
    ed_significance:"Lichenification = marker of chronicity. In atopic dermatitis, indicates poor disease control. Localized = lichen simplex chronicus.",
    key_feature:"Looks like tree bark — skin lines exaggerated. Means chronic scratching/rubbing at that site.",
    ed_examples:["Chronic atopic dermatitis","Lichen simplex chronicus (nape, ankle, perianal)","Chronic contact dermatitis","Prurigo nodularis"],
    urgent_if:"Lichenified plaques + fever + oozing = secondary bacterial superinfection.",
    workup:"Bacterial culture if superinfected. Skin biopsy if diagnosis unclear. Patch testing for contact allergen.",
    differentials:["Chronic eczema","Lichen simplex chronicus","Psoriasis","Prurigo nodularis"],
    wiki:["Lichen simplex chronicus","Atopic dermatitis"],
    color:"#82aece",
  },
  {
    id:"atrophy", name:"Atrophy", icon:"▷",
    size:"Thinned skin · shiny", category:"surface", urgency:"reference",
    definition:"Diminution of skin with loss of normal skin markings. May involve epidermis (thin, translucent), dermis (depressed), or subcutaneous fat. Shiny, wrinkled surface.",
    ed_significance:"Steroid atrophy: thinning + telangiectasia + striae after high-potency steroids. Lipodermatosclerosis = chronic venous disease.",
    key_feature:"Thinned skin — you can see veins through it. Wrinkles when pinched. Often telangiectasia nearby.",
    ed_examples:["Steroid-induced atrophy","Striae (stretch marks)","Lipodermatosclerosis","Lichen sclerosus (genital)","Morphea"],
    urgent_if:"Atrophic skin + genital involvement + scarring = lichen sclerosus (cancer risk — needs dermatology).",
    workup:"Skin biopsy. ANA/SCL-70 for systemic sclerosis. Urinalysis for lichen sclerosus workup.",
    differentials:["Steroid atrophy","Lichen sclerosus","Morphea","Systemic sclerosis","Lipodermatosclerosis"],
    wiki:["Striae","Lichen sclerosus","Morphea"],
    color:"#6b9ec8",
  },
  {
    id:"excoriation", name:"Excoriation", icon:"∕∕",
    size:"Linear scratch · epidermis removed", category:"surface", urgency:"reference",
    definition:"Superficial linear or angular erosion caused by scratching or picking. Evidence of pruritus. May become infected.",
    ed_significance:"Multiple excoriations + no primary lesion = pruritus sine materia — rule out systemic cause (CKD, cholestasis, lymphoma, thyroid, iron deficiency).",
    key_feature:"Linear scratches — shows ITCH happened here. Distribution (reachable areas only) suggests self-infliction.",
    ed_examples:["Atopic dermatitis (secondary)","Scabies (burrows + excoriations)","Prurigo nodularis","Neurotic excoriation","Uremia pruritus"],
    urgent_if:"Widespread excoriations + no primary skin disease + systemic symptoms = rule out hematologic malignancy.",
    workup:"Mineral oil scraping for scabies. CBC (eosinophilia). BMP for renal/hepatic pruritus. TSH.",
    differentials:["Scabies","Atopic dermatitis","Prurigo nodularis","Systemic pruritus (uremia, cholestasis, lymphoma)"],
    wiki:["Excoriation (skin)","Scabies","Prurigo nodularis"],
    color:"#82aece",
  },
  {
    id:"comedone", name:"Comedone", icon:"⊛",
    size:"Plugged follicle", category:"primary_solid", urgency:"reference",
    definition:"Dilated hair follicle plugged with sebum and keratin. Open comedone (blackhead): oxidized tip appears black. Closed comedone (whitehead): covered by thin skin.",
    ed_significance:"Multiple closed comedones with inflammatory papules = acne vulgaris. Comedones in occupational exposure = chloracne.",
    key_feature:"Open = blackhead (oxidized melanin, NOT dirt). Closed = whitehead. Both are non-inflammatory.",
    ed_examples:["Acne vulgaris","Chloracne (occupational toxin exposure)","Milia (neonatal or post-trauma)","Epidermal inclusion cyst"],
    urgent_if:"Chloracne in occupational/environmental context suggests significant toxin exposure — occupational medicine evaluation.",
    workup:"Usually clinical diagnosis. If unusual distribution, consider occupational history.",
    differentials:["Acne vulgaris","Milia","Chloracne","Sebaceous hyperplasia","Dilated pore of Winer"],
    wiki:["Comedo","Acne vulgaris","Milia"],
    color:"#82aece",
  },
  {
    id:"cyst", name:"Cyst", icon:"⊃",
    size:"Enclosed sac · fluid/semi-solid", category:"primary_solid", urgency:"reference",
    definition:"Enclosed cavity with epithelial lining containing fluid, keratin, or semi-solid material. True cysts have an epithelial lining. May transilluminate.",
    ed_significance:"Epidermoid cyst: most common. Requires excision (not incision alone) for cure. Infected cyst: I&D + warm soaks (antibiotics only if surrounding cellulitis).",
    key_feature:"Smooth, round, fluctuant, transilluminates. Has a punctum if epidermoid. Mobile under skin.",
    ed_examples:["Epidermoid cyst (most common)","Pilar cyst (scalp)","Ganglion cyst (wrist)","Mucous cyst (lip)","Steatocystoma"],
    urgent_if:"Infected cyst with cellulitis: incise + drain + antibiotics.",
    workup:"Usually clinical. US to confirm cystic nature vs solid. If malignancy concern: excision and pathology.",
    differentials:["Epidermoid cyst","Lipoma","Abscess","Ganglion cyst","Lymph node","Branchial cleft cyst"],
    wiki:["Epidermoid cyst","Ganglion cyst","Milia"],
    color:"#82aece",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function fetchWikiImageMulti(titles) {
  for (const title of titles) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&format=json&origin=*`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      const page = Object.values(data.query?.pages || {})[0];
      if (page?.thumbnail?.source) return page.thumbnail.source;
    } catch {}
  }
  return null;
}

const URGENCY_META = {
  emergent:  { label:"Emergent",  color:"#ff4444", bg:"rgba(255,68,68,.15)",  bd:"rgba(255,68,68,.5)"  },
  urgent:    { label:"Urgent",    color:"#ff9f43", bg:"rgba(255,159,67,.12)", bd:"rgba(255,159,67,.45)" },
  common:    { label:"Common ED", color:"#f5c842", bg:"rgba(245,200,66,.10)", bd:"rgba(245,200,66,.4)"  },
  reference: { label:"Reference", color:"#6b9ec8", bg:"rgba(42,79,122,.2)",   bd:"rgba(42,79,122,.45)" },
};

const CAT_LABELS = {
  primary_solid:  "Primary — Solid",
  primary_fluid:  "Primary — Fluid",
  vascular:       "Vascular / Non-blanching",
  surface:        "Surface Changes",
};

// ─── MORPHOLOGY CARD ──────────────────────────────────────────────────────────
function MorphCard({ m, image, imageLoading, onClick }) {
  const urg = URGENCY_META[m.urgency] || URGENCY_META.reference;
  return (
    <div className="dmr-card dmr-fade"
      style={{ border:`1px solid ${urg.bd}` }}
      onClick={onClick}>
      <div style={{ height:180, position:"relative", background:"rgba(14,37,68,.9)", overflow:"hidden" }}>
        {imageLoading ? (
          <div style={{ height:"100%", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:8 }}>
            <div className="dmr-pulse" style={{ fontFamily:"'Playfair Display',serif",
              fontWeight:900, fontSize:36, color:m.color, opacity:.4 }}>{m.icon}</div>
            <div className="dmr-pulse" style={{ fontFamily:"'JetBrains Mono',monospace",
              fontSize:10, color:"var(--dmr-txt4)" }}>loading image...</div>
          </div>
        ) : image ? (
          <img src={image} alt={m.name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.target.style.display="none"; }} />
        ) : (
          <div style={{ height:"100%", display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:8 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
              fontSize:48, color:m.color, opacity:.35, lineHeight:1 }}>{m.icon}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
              color:"var(--dmr-txt4)", letterSpacing:.5 }}>{m.size}</div>
          </div>
        )}
        <div style={{ position:"absolute", top:8, right:8,
          fontFamily:"'JetBrains Mono',monospace", fontSize:7,
          color:urg.color, background:"rgba(5,15,30,.85)",
          border:`1px solid ${urg.bd}`,
          borderRadius:5, padding:"2px 7px", letterSpacing:.8, textTransform:"uppercase" }}>
          {urg.label}
        </div>
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
          fontSize:15, color:"var(--dmr-txt)", marginBottom:3 }}>
          {m.name}
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
          color:m.color, letterSpacing:.5, marginBottom:5 }}>{m.size}</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
          color:"var(--dmr-txt4)", lineHeight:1.45,
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {m.definition}
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL DRAWER ────────────────────────────────────────────────────────────
function MorphDrawer({ m, image, onClose }) {
  const urg = URGENCY_META[m.urgency] || URGENCY_META.reference;
  const dermUrl = `https://dermnet.com/search?q=${encodeURIComponent(m.name)}`;
  const aadUrl  = `https://www.aad.org/search#q=${encodeURIComponent(m.name)}`;
  return (
    <>
      <div className="dmr-scrim no-print" onClick={onClose} />
      <div className="dmr-drawer">
        <div style={{ height:220, background:"#000", position:"relative", overflow:"hidden" }}>
          {image
            ? <img src={image} alt={m.name}
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
                  fontSize:72, color:m.color, opacity:.2 }}>{m.icon}</span>
              </div>
          }
          <button onClick={onClose}
            style={{ position:"absolute", top:12, right:12, background:"rgba(5,15,30,.8)",
              border:"1px solid rgba(42,79,122,.5)", borderRadius:8, color:"var(--dmr-txt3)",
              cursor:"pointer", padding:"6px 12px", fontFamily:"'JetBrains Mono',monospace",
              fontSize:10 }}>✕ Close</button>
          <div style={{ position:"absolute", bottom:0, left:0, right:0,
            background:"linear-gradient(transparent,rgba(5,15,30,.95))",
            padding:"24px 16px 12px" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900,
              fontSize:22, color:"var(--dmr-txt)" }}>{m.name}</div>
            <div style={{ display:"flex", gap:7, marginTop:4, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:urg.color, background:urg.bg, border:`1px solid ${urg.bd}`,
                borderRadius:5, padding:"2px 8px", letterSpacing:.8, textTransform:"uppercase" }}>
                {urg.label}
              </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-txt4)", background:"rgba(42,79,122,.3)",
                borderRadius:5, padding:"2px 8px" }}>
                {CAT_LABELS[m.category]}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding:"16px" }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--dmr-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
              Definition
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              color:"var(--dmr-txt2)", lineHeight:1.65 }}>{m.definition}</div>
          </div>

          <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:14,
            background:"rgba(0,229,192,.07)", border:"1px solid rgba(0,229,192,.3)" }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--dmr-teal)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
              Key Clinical Feature
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
              fontWeight:600, color:"var(--dmr-txt)", lineHeight:1.5 }}>{m.key_feature}</div>
          </div>

          {m.ed_significance && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-gold)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                ED Significance
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--dmr-txt3)", lineHeight:1.65 }}>{m.ed_significance}</div>
            </div>
          )}

          {m.urgent_if && m.urgency !== "reference" && (
            <div style={{ padding:"9px 12px", borderRadius:8, marginBottom:14,
              background:"rgba(255,68,68,.08)", border:"1px solid rgba(255,68,68,.3)" }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-red)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
                Act If...
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--dmr-coral)", lineHeight:1.65 }}>{m.urgent_if}</div>
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
              color:"var(--dmr-txt4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
              Clinical Examples
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {m.ed_examples.map((ex, i) => (
                <span key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10,
                  color:"var(--dmr-txt3)", background:"rgba(42,79,122,.2)",
                  border:"1px solid rgba(42,79,122,.35)", borderRadius:5,
                  padding:"3px 9px" }}>{ex}</span>
              ))}
            </div>
          </div>

          {m.workup && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-blue)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                Workup
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                color:"var(--dmr-txt3)", lineHeight:1.55 }}>{m.workup}</div>
            </div>
          )}

          {m.differentials?.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-purple)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>
                Key Differentials
              </div>
              {m.differentials.map((d, i) => (
                <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start", marginBottom:3 }}>
                  <span style={{ color:"var(--dmr-purple)", fontSize:7, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11,
                    color:"var(--dmr-txt3)" }}>{d}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {[[`DermNet — ${m.name}`, dermUrl, "var(--dmr-blue)"],
              [`AAD — ${m.name}`, aadUrl, "var(--dmr-purple)"]
            ].map(([lbl,href,c]) => (
              <a key={lbl} href={href} target="_blank" rel="noopener noreferrer"
                style={{ padding:"5px 12px", borderRadius:7,
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                  background:`${c.includes("blue") ? "rgba(59,158,255,.1)" : "rgba(155,109,255,.1)"}`,
                  border:`1px solid ${c.includes("blue") ? "rgba(59,158,255,.3)" : "rgba(155,109,255,.3)"}`,
                  color:c, textDecoration:"none", letterSpacing:.5 }}>
                {lbl}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DermMorphologyRef({ embedded = false, onBack }) {
  const navigate = useNavigate();
  const [images,      setImages]      = useState({});
  const [imgLoading,  setImgLoading]  = useState(new Set());
  const [selected,    setSelected]    = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const ids = new Set(MORPHOLOGIES.map(m => m.id));
    setImgLoading(ids);
    MORPHOLOGIES.forEach(async (m) => {
      const url = await fetchWikiImageMulti(m.wiki || [m.name]);
      setImages(prev => ({ ...prev, [m.id]: url }));
      setImgLoading(prev => { const n = new Set(prev); n.delete(m.id); return n; });
    });
  }, []);

  useEffect(() => {
    const fn = e => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "/" && document.activeElement?.tagName?.toLowerCase() !== "input") {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const filtered = useMemo(() => {
    let list = MORPHOLOGIES;
    if (filter !== "all") {
      if (["emergent","urgent","common","reference"].includes(filter))
        list = list.filter(m => m.urgency === filter);
      else
        list = list.filter(m => m.category === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.definition.toLowerCase().includes(q) ||
        m.ed_examples.some(e => e.toLowerCase().includes(q)) ||
        m.differentials?.some(d => d.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filter, search]);

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  const FILTERS = [
    { id:"all",          label:`All (${MORPHOLOGIES.length})` },
    { id:"emergent",     label:"Emergent" },
    { id:"urgent",       label:"Urgent" },
    { id:"primary_solid",label:"Solid" },
    { id:"primary_fluid",label:"Fluid" },
    { id:"vascular",     label:"Vascular" },
    { id:"surface",      label:"Surface" },
  ];

  const selectedMorph = selected ? MORPHOLOGIES.find(m => m.id === selected) : null;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",
      background:embedded ? "transparent" : "var(--dmr-bg)",
      minHeight:embedded ? "auto" : "100vh", color:"var(--dmr-txt)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto", padding:embedded ? "0" : "0 16px" }}>

        <div style={{ padding: embedded ? "0 0 14px" : "18px 0 14px" }}>
          {!embedded && (
            <button onClick={handleBack}
              style={{ marginBottom:10, display:"inline-flex", alignItems:"center", gap:7,
                fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                background:"rgba(14,37,68,.7)", border:"1px solid rgba(42,79,122,.5)",
                borderRadius:8, padding:"5px 14px", color:"var(--dmr-txt3)", cursor:"pointer" }}>
              ← Dermatology Hub
            </button>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ background:"rgba(5,15,30,.9)", border:"1px solid rgba(42,79,122,.6)",
              borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-teal)", letterSpacing:3 }}>NOTRYA</span>
              <span style={{ color:"var(--dmr-txt4)", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>/</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-txt3)", letterSpacing:2 }}>MORPHOLOGY</span>
            </div>
            <div style={{ height:1, flex:1,
              background:"linear-gradient(90deg,rgba(0,229,192,.5),transparent)" }} />
          </div>
          <h1 className="dmr-shim" style={{ fontFamily:"'Playfair Display',serif",
            fontSize:embedded ? "clamp(18px,3vw,26px)" : "clamp(22px,4vw,38px)",
            fontWeight:900, letterSpacing:-.5, lineHeight:1.1, margin:0 }}>
            Primary Skin Morphology
          </h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12,
            color:"var(--dmr-txt4)", marginTop:4, marginBottom:0 }}>
            {MORPHOLOGIES.length} morphologies · Clinical photos · ED urgency flags · Click any card for full detail
          </p>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
          {Object.entries(URGENCY_META).map(([k, v]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:v.color }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color:"var(--dmr-txt4)", letterSpacing:.5 }}>{v.label}</span>
            </div>
          ))}
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--dmr-txt4)", marginLeft:"auto" }}>
            Press / to search · Esc to close
          </span>
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:1, minWidth:180, maxWidth:280 }}>
            <input ref={searchRef} className="dmr-si" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search morphology, condition..." />
          </div>
          {FILTERS.map(f => (
            <button key={f.id}
              className={`dmr-filter-btn${filter===f.id?" on":""}`}
              onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0",
            fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"var(--dmr-txt4)" }}>
            No morphologies match your filter.
          </div>
        ) : (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))", gap:14, marginBottom:24 }}>
            {filtered.map(m => (
              <MorphCard key={m.id} m={m}
                image={images[m.id]}
                imageLoading={imgLoading.has(m.id)}
                onClick={() => setSelected(m.id)} />
            ))}
          </div>
        )}

        {!embedded && (
          <div style={{ textAlign:"center", padding:"16px 0 24px",
            fontFamily:"'JetBrains Mono',monospace", fontSize:10,
            color:"var(--dmr-txt4)", letterSpacing:1.5 }}>
            NOTRYA MORPHOLOGY REFERENCE · {MORPHOLOGIES.filter(m=>m.urgency==="emergent").length} EMERGENT ·
            {" "}{MORPHOLOGIES.filter(m=>m.urgency==="urgent").length} URGENT ·
            {" "}IMAGES VIA WIKIPEDIA CC · NOT A SUBSTITUTE FOR CLINICAL EVALUATION
          </div>
        )}
      </div>

      {selectedMorph && (
        <MorphDrawer m={selectedMorph} image={images[selectedMorph.id]}
          onClose={() => setSelected(null)} />
      )}
    </div>
  );
}