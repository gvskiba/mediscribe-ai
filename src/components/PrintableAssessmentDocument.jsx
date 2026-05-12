import React from "react";

export default function PrintableAssessmentDocument({ 
  title,           // Hub title (e.g., "Sepsis Assessment")
  timestamp,       // ISO timestamp or formatted date
  facility,        // Hospital/facility name
  provider,        // Provider name/credentials
  sections,        // Array of { label, content, highlight? }
  recommendations, // Array of recommendation strings
  monitoring,      // Array of monitoring items
  notes            // Additional notes
}) {
  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    : new Date().toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#000', backgroundColor: '#fff', padding: 0, margin: 0 }}>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .doc-container { margin: 0; padding: 0; page-break-after: avoid; }
          .doc-header { page-break-after: avoid; }
          .doc-section { page-break-inside: avoid; }
          .doc-section-content { page-break-inside: avoid; }
          button { display: none; }
          @page { margin: 0.5in; }
        }
        @media screen {
          .doc-container { max-width: 900px; margin: 20px auto; }
        }
      `}</style>

      <div className="doc-container" style={{ padding: '40px', lineHeight: 1.6 }}>
        
        {/* Header */}
        <div className="doc-header" style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: 700, color: '#000' }}>{title}</h1>
              {facility && <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{facility}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px 0', fontSize: '12px', fontWeight: 600, color: '#333' }}>ASSESSMENT DATE</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>{formattedDate}</p>
            </div>
          </div>
          {provider && (
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Provider: <span style={{ fontWeight: 600 }}>{provider}</span></p>
          )}
        </div>

        {/* Assessment Sections */}
        {sections && sections.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            {sections.map((section, idx) => (
              <div key={idx} className="doc-section" style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000', borderBottom: section.highlight ? `3px solid #dc2626` : `1px solid #ddd`, paddingBottom: '8px' }}>
                  {section.label}
                </h3>
                <div className="doc-section-content" style={{ fontSize: '13px', color: '#333', lineHeight: 1.7, marginLeft: section.highlight ? '0' : '0' }}>
                  {typeof section.content === 'string' ? (
                    <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{section.content}</p>
                  ) : Array.isArray(section.content) ? (
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                      {section.content.map((item, i) => (
                        <li key={i} style={{ marginBottom: '4px', color: '#333' }}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>{section.content}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="doc-section" style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
              RECOMMENDATIONS
            </h3>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              {recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '6px', fontSize: '13px', color: '#333', lineHeight: 1.6 }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Monitoring */}
        {monitoring && monitoring.length > 0 && (
          <div className="doc-section" style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
              MONITORING SCHEDULE
            </h3>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              {monitoring.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '6px', fontSize: '13px', color: '#333', lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="doc-section" style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
              CLINICAL NOTES
            </h3>
            <p style={{ margin: '0', fontSize: '13px', color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', marginTop: '40px', fontSize: '11px', color: '#999' }}>
          <p style={{ margin: '0 0 4px 0' }}>This document is for clinical reference only and should not replace professional medical judgment.</p>
          <p style={{ margin: '0' }}>Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Print/Export Controls */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '20px', borderTop: '1px solid #eee', marginTop: '20px' }}>
        <button 
          onClick={() => window.print()} 
          style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #333', background: '#fff', color: '#333', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
          🖨 Print
        </button>
        <button 
          onClick={() => {
            const element = document.querySelector('.doc-container');
            const opt = { margin: 0.5, filename: `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { orientation: 'portrait', unit: 'in', format: 'letter' } };
            // Note: Requires html2pdf library. For now, just offer "Save as PDF" via print dialog
            window.print();
          }}
          style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #333', background: '#333', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
          💾 Save as PDF
        </button>
      </div>
    </div>
  );
}