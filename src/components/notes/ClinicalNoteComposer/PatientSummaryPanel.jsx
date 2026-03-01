import React from "react";
import { AlertCircle } from "lucide-react";

export default function PatientSummaryPanel({ patient }) {
  if (!patient) {
    return (
      <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3">
        <p className="text-xs text-[#4a7299] text-center py-4">Select a patient to view summary</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0e2340] p-3 space-y-3">
      {/* Patient Header */}
      <div className="pb-3 border-b border-[#1e3a5f]">
        <h3 className="text-sm font-bold text-[#e8f4ff]">{patient.patient_name}</h3>
        <p className="text-xs text-[#4a7299] mt-1">
          {patient.patient_id && `MRN: ${patient.patient_id}`}
        </p>
      </div>

      {/* Demographics */}
      <div className="space-y-1.5 text-xs">
        {patient.gender && (
          <div className="flex justify-between">
            <span className="text-[#4a7299]">Gender:</span>
            <span className="text-[#e8f4ff] font-medium capitalize">{patient.gender}</span>
          </div>
        )}
        {patient.date_of_birth && (
          <div className="flex justify-between">
            <span className="text-[#4a7299]">DOB:</span>
            <span className="text-[#e8f4ff] font-medium">{patient.date_of_birth}</span>
          </div>
        )}
        {patient.contact_number && (
          <div className="flex justify-between">
            <span className="text-[#4a7299]">Phone:</span>
            <span className="text-[#e8f4ff] font-medium">{patient.contact_number}</span>
          </div>
        )}
      </div>

      {/* Allergies */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="pt-2 border-t border-[#1e3a5f]">
          <p className="text-xs font-semibold text-[#fbbf24] mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Allergies
          </p>
          <div className="flex flex-wrap gap-1">
            {patient.allergies.map((allergy, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-[#162d4f] text-[#fbbf24] rounded border border-[#1e3a5f]">
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chronic Conditions */}
      {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
        <div className="pt-2 border-t border-[#1e3a5f]">
          <p className="text-xs font-semibold text-[#00d4bc] mb-1">Chronic Conditions</p>
          <div className="space-y-1">
            {patient.chronic_conditions.map((condition, idx) => (
              <div key={idx} className="text-xs text-[#4a7299]">• {condition}</div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance */}
      {patient.insurance_provider && (
        <div className="pt-2 border-t border-[#1e3a5f]">
          <p className="text-xs font-semibold text-[#4a7299] mb-1">Insurance</p>
          <p className="text-xs text-[#c8ddf0]">{patient.insurance_provider}</p>
          {patient.insurance_id && (
            <p className="text-xs text-[#4a7299] mt-0.5">ID: {patient.insurance_id}</p>
          )}
        </div>
      )}
    </div>
  );
}