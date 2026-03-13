import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PDFUploadPanel({ onTextExtracted, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const C = {
    navy: '#050f1e',
    slate: '#0b1d35',
    panel: '#0d2240',
    border: '#1e3a5f',
    text: '#c8ddf0',
    bright: '#e8f4ff',
    dim: '#4a7299',
    teal: '#00d4bc',
    purple: '#9b6dff',
    red: '#ff5c6c',
    green: '#2ecc71',
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    setError('');
    setStatus('');
    
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Please upload a PDF or image file');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setStatus('Uploading file...');

    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      setUploading(false);
      setExtracting(true);
      setStatus('Extracting text with OCR...');

      // Extract text using OCR via LLM vision
      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all clinical text from this medical document. Return ONLY the raw clinical text content, preserving all medical terminology, patient information, vital signs, diagnoses, and notes exactly as written. Do not add any formatting, headers, or commentary - just the extracted text.`,
        file_urls: [fileUrl]
      });

      setExtracting(false);
      setStatus('Text extracted successfully!');
      
      // Pass extracted text to parent
      if (onTextExtracted) {
        onTextExtracted(extractionResult);
      }

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);

    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file. Please try again.');
      setUploading(false);
      setExtracting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'rgba(5,15,30,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 500, width: '100%', background: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.bright, fontWeight: 600 }}>
              Upload Clinical Document
            </h3>
            <p style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>PDF or image files supported</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X className="w-5 h-5" style={{ color: C.dim }} />
          </button>
        </div>

        {/* Upload Area */}
        <div style={{ padding: 24 }}>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? C.teal : C.border}`,
              borderRadius: 10,
              padding: 40,
              textAlign: 'center',
              background: isDragging ? 'rgba(0,212,188,0.05)' : C.panel,
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: 16
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />

            {uploading || extracting ? (
              <div>
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" style={{ color: C.purple }} />
                <p style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{status}</p>
                {fileName && (
                  <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{fileName}</p>
                )}
              </div>
            ) : status.includes('success') ? (
              <div>
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: C.green }} />
                <p style={{ fontSize: 13, color: C.green, fontWeight: 500 }}>{status}</p>
                <p style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Processing text for coding...</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: C.teal }} />
                <p style={{ fontSize: 14, color: C.bright, fontWeight: 500, marginBottom: 6 }}>
                  Drop your file here or click to browse
                </p>
                <p style={{ fontSize: 11, color: C.dim }}>
                  Supports PDF and image files (JPG, PNG)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: 12, background: 'rgba(255,92,108,0.1)', border: `1px solid rgba(255,92,108,0.3)`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle className="w-4 h-4" style={{ color: C.red }} />
              <p style={{ fontSize: 12, color: C.red }}>{error}</p>
            </div>
          )}

          {/* Info */}
          <div style={{ marginTop: 16, padding: 12, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
              💡 <strong style={{ color: C.text }}>How it works:</strong> Upload a clinical note PDF or image, and our OCR engine will extract the text and automatically generate ICD-10 and CPT code recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}