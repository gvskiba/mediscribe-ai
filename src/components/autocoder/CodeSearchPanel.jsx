import React, { useState } from 'react';
import { Search, ExternalLink, Book, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CodeSearchPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('icd10');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const C = {
    navy: '#050f1e',
    slate: '#0f1829',
    panel: '#1a2332',
    border: 'rgba(148,163,184,0.1)',
    text: '#cbd5e1',
    bright: '#f1f5f9',
    dim: '#64748b',
    muted: '#475569',
    teal: '#00d4bc',
    rose: '#f472b6',
    blue: '#60a5fa',
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const prompt = searchType === 'icd10' 
        ? `Search for ICD-10 diagnosis codes matching: "${searchQuery}". Return up to 8 relevant codes with their full descriptions. Format as JSON array: [{"code": "A00.0", "description": "Cholera due to Vibrio cholerae 01, biovar cholerae"}]. Only include real, verified ICD-10 codes.`
        : `Search for CPT procedure codes matching: "${searchQuery}". Return up to 8 relevant codes with their full descriptions. Format as JSON array: [{"code": "99213", "description": "Office visit, established patient, level 3"}]. Only include real, verified CPT codes.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            codes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      });
      
      setResults(result.codes || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.slate }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Book className="w-4 h-4" style={{ color: C.teal }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.bright, fontWeight: 600 }}>
            Code Lookup
          </h3>
        </div>
        
        {/* Search Type Toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setSearchType('icd10')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              border: `1px solid ${searchType === 'icd10' ? C.teal : C.border}`,
              background: searchType === 'icd10' ? 'rgba(0,212,188,0.1)' : C.panel,
              color: searchType === 'icd10' ? C.teal : C.text,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ICD-10
          </button>
          <button
            onClick={() => setSearchType('cpt')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              border: `1px solid ${searchType === 'cpt' ? C.rose : C.border}`,
              background: searchType === 'cpt' ? 'rgba(244,114,182,0.1)' : C.panel,
              color: searchType === 'cpt' ? C.rose : C.text,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            CPT
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={`Search ${searchType === 'icd10' ? 'diagnosis' : 'procedure'} codes...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '100%',
              padding: '8px 32px 8px 10px',
              fontSize: 12,
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.text,
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 4,
              background: 'transparent',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              color: C.teal,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <p style={{ fontSize: 9, color: C.dim, marginTop: 6 }}>
          Search verified medical codes from clinical databases
        </p>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {results.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: C.dim }}>
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: 11 }}>
              {searchQuery ? 'No codes found' : 'Enter a search term to find codes'}
            </p>
          </div>
        )}

        {results.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px',
              marginBottom: 8,
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.navy;
              e.currentTarget.style.borderColor = searchType === 'icd10' ? C.teal : C.rose;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.panel;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: searchType === 'icd10' ? C.teal : C.rose
                }}
              >
                {item.code}
              </span>
              <ExternalLink className="w-3 h-3" style={{ color: C.dim }} />
            </div>
            <p style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Links */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}` }}>
        <a
          href="https://www.cms.gov/medicare/coding-billing/icd-10-codes"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            color: C.blue,
            textDecoration: 'none',
            marginBottom: 6
          }}
        >
          <ExternalLink className="w-3 h-3" />
          CMS ICD-10 Database
        </a>
        <a
          href="https://www.ama-assn.org/practice-management/cpt"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            color: C.blue,
            textDecoration: 'none'
          }}
        >
          <ExternalLink className="w-3 h-3" />
          AMA CPT Codes
        </a>
      </div>
    </div>
  );
}