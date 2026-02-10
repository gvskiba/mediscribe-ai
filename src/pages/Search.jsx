import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Search, ArrowLeft, Calendar, FileText, BookOpen, Code2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function SearchPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  const typeIcons = {
    clinical_note: FileText,
    guideline: BookOpen,
    snippet: Code2,
    template: FileText
  };

  const typeColors = {
    clinical_note: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100'
    },
    guideline: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100'
    },
    snippet: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100'
    },
    template: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100'
    }
  };

  useEffect(() => {
    if (query.length > 1) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('globalSearch', { query });
      setResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(r => r.type === selectedType);

  const getTypeLabel = (type) => {
    const labels = {
      clinical_note: 'Clinical Note',
      guideline: 'Guideline',
      snippet: 'Snippet',
      template: 'Template'
    };
    return labels[type] || type;
  };

  const handleResultClick = (result) => {
    navigate(result.url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all content..."
            className="w-full bg-white border border-slate-300 rounded-2xl pl-12 pr-4 py-3 text-lg placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Results ({results.length})
          </button>
          {['clinical_note', 'guideline', 'snippet', 'template'].map(type => {
            const count = results.filter(r => r.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {getTypeLabel(type)} ({count})
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600">Searching...</p>
          </div>
        </div>
      ) : filteredResults.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filteredResults.map((result, idx) => {
            const Icon = typeIcons[result.type];
            const colors = typeColors[result.type];

            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left p-6 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colors.badge}`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                        {result.title}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${colors.badge} ${colors.text}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>

                    <p className="text-slate-600 line-clamp-2 mb-3">
                      {result.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(result.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-blue-600">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      ) : query.length > 1 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
          <p className="text-slate-600">
            Try searching with different keywords or browse all content
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Start searching</h3>
          <p className="text-slate-600">
            Enter a search term to find notes, guidelines, snippets, and templates
          </p>
        </motion.div>
      )}
    </div>
  );
}