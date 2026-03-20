import React from 'react';
import { usePatient } from '@/lib/PatientContext';
import { Link } from 'react-router-dom';
import { X, FileText, Activity, Beaker, User } from 'lucide-react';

export default function PatientSidebar() {
  const { activePatient, clearPatient } = usePatient();

  if (!activePatient) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-slate-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Patient Context</h2>
        <button
          onClick={clearPatient}
          className="p-1 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Patient Info */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{activePatient.patient_name}</p>
            <p className="text-xs text-slate-600 truncate">
              {activePatient.patient_id && `MRN: ${activePatient.patient_id}`}
            </p>
          </div>
        </div>

        {activePatient.date_of_birth && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-600">DOB</p>
              <p className="font-medium text-slate-900">{activePatient.date_of_birth}</p>
            </div>
            {activePatient.gender && (
              <div>
                <p className="text-slate-600">Gender</p>
                <p className="font-medium text-slate-900 capitalize">{activePatient.gender}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Quick Navigation</p>
        <nav className="space-y-2">
          <Link
            to={`/PatientDashboard?patient_id=${activePatient.id}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition text-sm"
          >
            <Activity className="w-4 h-4" />
            Patient Dashboard
          </Link>

          <Link
            to={`/NotesLibrary?patient_id=${activePatient.id}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition text-sm"
          >
            <FileText className="w-4 h-4" />
            Clinical Notes
          </Link>

          <Link
            to={`/Results?patient_id=${activePatient.id}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition text-sm"
          >
            <Beaker className="w-4 h-4" />
            Labs & Results
          </Link>
        </nav>
      </div>

      {/* Patient Details Footer */}
      {(activePatient.contact_number || activePatient.email) && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Contact</p>
          {activePatient.contact_number && (
            <p className="text-xs text-slate-700 break-all">{activePatient.contact_number}</p>
          )}
          {activePatient.email && (
            <p className="text-xs text-slate-700 break-all">{activePatient.email}</p>
          )}
        </div>
      )}
    </div>
  );
}