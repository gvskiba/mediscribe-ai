// useVoiceCommand.js — hands-free voice command hook for CommandKit
// Supported commands:
//   "medications" / "meds" / "imaging" / "labs" / "reference" → switch tab
//   "search [term]" → set search query
//   "show [term]" → set search query
//   "dose [drug]" → open meds tab + search drug
//   "guideline [name]" → open reference tab + search
//   "scenario [name]" → activate scenario
//   "weight [number]" → set weight
//   "clear" / "reset" → clear search

import { useEffect, useRef, useState, useCallback } from "react";

const SCENARIO_ALIASES = {
  "acls": "acls", "cardiac arrest": "acls", "code": "acls",
  "sepsis": "sepsis", "infection": "sepsis",
  "trauma": "trauma",
  "stroke": "stroke",
  "tox": "tox", "toxicology": "tox", "overdose": "tox",
  "shock": "shock",
  "peds": "peds", "pediatric": "peds", "pediatrics": "peds",
};

export function useVoiceCommand({ onTab, onSearch, onScenario, onWeight, onOpen }) {
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const parseAndDispatch = useCallback((transcript) => {
    const t = transcript.toLowerCase().trim();
    setLastCommand(transcript);

    // Tab switching
    if (/^(meds|medications|medication)$/.test(t)) { onOpen?.(); onTab("meds"); return; }
    if (/^imaging$/.test(t)) { onOpen?.(); onTab("imaging"); return; }
    if (/^(labs|lab|orders)$/.test(t)) { onOpen?.(); onTab("labs"); return; }
    if (/^(reference|references|guidelines|guideline)$/.test(t)) { onOpen?.(); onTab("reference"); return; }

    // Weight: "weight 75" or "seventy five kilos"
    const wtMatch = t.match(/^weight\s+(\d+(?:\.\d+)?)/);
    if (wtMatch) { onOpen?.(); onWeight?.(wtMatch[1]); return; }

    // Scenario: "scenario sepsis" or just "sepsis scenario"
    const scenMatch = t.match(/^(?:scenario\s+(.+)|(.+)\s+scenario)$/);
    if (scenMatch) {
      const name = (scenMatch[1] || scenMatch[2] || "").trim();
      const id = SCENARIO_ALIASES[name];
      if (id) { onOpen?.(); onScenario?.(id); return; }
    }
    // Plain scenario name
    for (const [alias, id] of Object.entries(SCENARIO_ALIASES)) {
      if (t === alias) { onOpen?.(); onTab("meds"); onScenario?.(id); return; }
    }

    // "dose [drug]"
    const doseMatch = t.match(/^(?:dose|dosage|dose for|dosage of)\s+(.+)$/);
    if (doseMatch) { onOpen?.(); onTab("meds"); onSearch(doseMatch[1]); return; }

    // "guideline [name]"
    const guideMatch = t.match(/^(?:guideline|guidelines|score|criteria)\s+(.+)$/);
    if (guideMatch) { onOpen?.(); onTab("reference"); onSearch(guideMatch[1]); return; }

    // "search [term]" / "show [term]" / "find [term]" / "look up [term]"
    const searchMatch = t.match(/^(?:search|show|find|look up|lookup|pull up)\s+(.+)$/);
    if (searchMatch) { onOpen?.(); onSearch(searchMatch[1]); return; }

    // "clear" / "reset" / "close search"
    if (/^(clear|reset|close search)$/.test(t)) { onSearch(""); return; }

    // Fallback: treat as search if >1 word
    if (t.split(" ").length > 1) { onOpen?.(); onSearch(t); }
  }, [onTab, onSearch, onScenario, onWeight, onOpen]);

  const start = useCallback(() => {
    if (!isSupported || activeRef.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => { setListening(true); setError(null); activeRef.current = true; };
    rec.onend = () => { setListening(false); activeRef.current = false; };
    rec.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Mic permission denied" : e.error);
      setListening(false);
      activeRef.current = false;
    };
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      parseAndDispatch(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isSupported, parseAndDispatch]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { listening, lastCommand, error, isSupported, start, stop };
}