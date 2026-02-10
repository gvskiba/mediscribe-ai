import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Search, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSearchBar() {
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
      const response = await base44.functions.invoke('globalSearch', { query: value });
      setResults(response.data.results.slice(0, 8));
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
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

  const handleViewAllResults = () => {
    if (query.length > 1) {
      navigate(createPageUrl(`Search?q=${encodeURIComponent(query)}`));
      setIsOpen(false);
    }
  };

  const handleResultClick = (result) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const getTypeColor = (type) => {
    const colors = {
      clinical_note: 'bg-blue-50 text-blue-700 border-blue-200',
      guideline: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      snippet: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      template: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[type] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getTypeLabel = (type) => {
    const labels = {
      clinical_note: 'Note',
      guideline: 'Guideline',
      snippet: 'Snippet',
      template: 'Template'
    };
    return labels[type] || type;
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search notes, guidelines, snippets..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  {results.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors mb-1 border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded border ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {result.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleViewAllResults}
                  className="w-full px-4 py-3 border-t border-slate-200 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors rounded-b-xl"
                >
                  View all results →
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">
                {query.length > 1 && !isLoading && 'No results found'}
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