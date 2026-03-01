import React, { useState } from "react";
import { Search, X, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PatientSearchPanel({ onSelectPatient, selectedPatient }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await base44.entities.Patient.list("-updated_date", 100);
      const filtered = results.filter(p => 
        p.patient_name?.toLowerCase().includes(query.toLowerCase()) || 
        p.patient_id?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
    } catch (error) {
      console.error("Failed to search patients:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 flex flex-col gap-3">
      {/* Header */}
      <h3 className="text-xs font-bold text-[#e8f4ff] uppercase tracking-wider">👤 Select Patient</h3>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#4a7299]" />
        <input
          type="text"
          placeholder="Search by name or MRN…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-[#162d4f] border border-[#1e3a5f] rounded-lg text-[#c8ddf0] placeholder-[#2a4d72] focus:border-[#00d4bc]"
        />
      </div>

      {/* Selected Patient */}
      {selectedPatient && (
        <div className="p-2 rounded-lg bg-[#0b1d35] border border-[#00d4bc] flex items-center justify-between">
          <div className="text-xs">
            <p className="font-semibold text-[#e8f4ff]">{selectedPatient.patient_name}</p>
            <p className="text-[#4a7299]">{selectedPatient.patient_id}</p>
          </div>
          <button
            onClick={() => onSelectPatient(null)}
            className="text-[#4a7299] hover:text-[#e8f4ff]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Results */}
      {isSearching && (
        <p className="text-xs text-[#4a7299] text-center">Searching…</p>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {searchResults.map((patient) => (
            <button
              key={patient.id}
              onClick={() => {
                onSelectPatient(patient);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="w-full text-left p-2 rounded-lg border border-[#1e3a5f] bg-[#0b1d35] hover:border-[#00d4bc] hover:bg-[#162d4f] transition-all"
            >
              <p className="text-xs font-semibold text-[#e8f4ff]">{patient.patient_name}</p>
              <p className="text-xs text-[#4a7299]">MRN: {patient.patient_id}</p>
            </button>
          ))}
        </div>
      )}

      {!isSearching && searchQuery && searchResults.length === 0 && (
        <p className="text-xs text-[#2a4d72] text-center py-4">No patients found</p>
      )}
    </div>
  );
}