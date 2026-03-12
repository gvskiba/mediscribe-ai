import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Search, X, Loader2, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientSearchBar({ variant = 'light' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleSearch = async (value) => {
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const patients = await base44.entities.Patient.list();
      const filtered = patients.filter(p => 
        p.patient_name?.toLowerCase().includes(value.toLowerCase()) ||
        p.patient_id?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setResults(filtered);
      setIsOpen(true);
    } catch (error) {
      console.error('Patient search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleResultClick = async (patient) => {
    // Find or create a clinical note for this patient
    const notes = await base44.entities.ClinicalNote.list();
    const patientNotes = notes.filter(n => n.patient_id === patient.patient_id);
    
    if (patientNotes.length > 0) {
      // Navigate to the most recent note
      const latestNote = patientNotes.sort((a, b) => 
        new Date(b.updated_date) - new Date(a.updated_date)
      )[0];
      navigate(createPageUrl(`ClinicalNoteStudio?noteId=${latestNote.id}`));
    } else {
      // Create a new note for this patient
      const newNote = await base44.entities.ClinicalNote.create({
        patient_name: patient.patient_name,
        patient_id: patient.patient_id,
        patient_age: patient.age,
        patient_gender: patient.gender,
        date_of_birth: patient.date_of_birth,
        raw_note: '',
        status: 'draft'
      });
      navigate(createPageUrl(`ClinicalNoteStudio?noteId=${newNote.id}`));
    }
    
    setIsOpen(false);
    setQuery('');
  };

  const isDark = variant === 'dark';

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search patients by name or MRN..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          style={isDark ? {
            background: '#162d4f',
            border: '1px solid #1e3a5f',
            color: '#c8ddf0'
          } : {}}
          className={`w-full ${isDark ? '' : 'bg-white border border-slate-300'} rounded-xl pl-10 pr-10 py-2.5 text-sm ${isDark ? 'placeholder-slate-500' : 'placeholder:text-slate-500'} ${isDark ? 'focus:border-teal-500' : 'focus:border-blue-500'} focus:ring-2 ${isDark ? 'focus:ring-teal-500/20' : 'focus:ring-blue-100'} transition-all`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-teal-500' : 'text-blue-500'} animate-spin`} />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={isDark ? {
              background: '#0e2340',
              borderColor: '#1e3a5f'
            } : {}}
            className={`absolute top-full left-0 right-0 mt-2 ${isDark ? '' : 'bg-white'} rounded-xl border ${isDark ? '' : 'border-slate-200'} shadow-lg z-50`}
            onClick={(e) => e.stopPropagation()}
          >
            {results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  {results.map((patient, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(patient)}
                      style={isDark ? {
                        background: 'transparent',
                        borderColor: 'transparent'
                      } : {}}
                      className={`w-full text-left p-3 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors mb-1 border ${isDark ? 'hover:border-teal-500/30' : 'hover:border-slate-200'}`}
                      onMouseEnter={(e) => {
                        if (isDark) {
                          e.currentTarget.style.background = 'rgba(0,212,188,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(0,212,188,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isDark) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div style={isDark ? {
                          background: 'rgba(155,109,255,0.2)',
                          borderColor: 'rgba(155,109,255,0.4)'
                        } : {}}
                          className={`w-8 h-8 rounded-full ${isDark ? '' : 'bg-blue-50'} border ${isDark ? '' : 'border-blue-200'} flex items-center justify-center flex-shrink-0`}
                        >
                          <User className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={isDark ? { color: '#e8f4ff' } : {}} className={`text-sm font-medium ${isDark ? '' : 'text-slate-900'} truncate`}>
                            {patient.patient_name}
                          </p>
                          <p style={isDark ? { color: '#4a7299' } : {}} className={`text-xs ${isDark ? '' : 'text-slate-500'} mt-0.5`}>
                            MRN: {patient.patient_id} {patient.date_of_birth && `• DOB: ${patient.date_of_birth}`}
                          </p>
                          {patient.chronic_conditions?.length > 0 && (
                            <p style={isDark ? { color: '#2a4d72' } : {}} className={`text-xs ${isDark ? '' : 'text-slate-400'} mt-1`}>
                              {patient.chronic_conditions.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`p-6 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'} text-sm`}>
                {query.length > 1 && !isLoading && 'No patients found'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}