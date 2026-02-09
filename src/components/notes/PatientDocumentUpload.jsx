import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Loader2, FileText, X, Check, AlertCircle } from "lucide-react";

export default function PatientDocumentUpload({ onDataExtracted, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const acceptedFormats = [".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".csv", ".txt", ".docx"];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = async (files) => {
    for (const file of files) {
      // Validate file
      if (!file || !file.name) {
        toast.error("Invalid file");
        continue;
      }

      const extension = "." + file.name.split(".").pop().toLowerCase();
      if (!acceptedFormats.includes(extension)) {
        toast.error(`Unsupported file format: ${file.name}`);
        continue;
      }
      if (file.size > maxFileSize) {
        toast.error(`File too large: ${file.name} (max 10MB)`);
        continue;
      }

      // Add to processing list
      const fileId = Math.random().toString(36).substr(2, 9);
      setUploadedFiles(prev => [...prev, { id: fileId, name: file.name, status: "uploading" }]);

      try {
        // Upload file
        const uploadResponse = await base44.integrations.Core.UploadFile({ file });
        
        if (!uploadResponse?.file_url) {
          throw new Error("File upload failed - no URL returned");
        }

        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "extracting", fileUrl: uploadResponse.file_url } : f));

        // Extract data based on file type
        let extractedData = null;
        
        if ([".pdf", ".png", ".jpg", ".jpeg"].includes(extension)) {
          extractedData = await extractFromDocument(uploadResponse.file_url, file.name);
        } else if ([".xlsx", ".csv"].includes(extension)) {
          extractedData = await extractFromSpreadsheet(uploadResponse.file_url, file.name);
        } else if ([".txt", ".docx"].includes(extension)) {
          extractedData = await extractFromTextDocument(uploadResponse.file_url, file.name);
        }

        if (!extractedData) {
          throw new Error("No data extracted from document");
        }

        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "success", data: extractedData } : f));
        toast.success(`Successfully extracted data from ${file.name}`);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "error", error: error.message } : f));
        toast.error(`Failed to process ${file.name}: ${error.message}`);
      }
    }
  };

  const extractFromDocument = async (fileUrl, fileName) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract clinical information from this document (${fileName}). Identify and extract:
        1. Lab test results with values and reference ranges
        2. Medical diagnoses or findings
        3. Medications mentioned
        4. Vital signs or measurements
        5. Imaging findings or impressions
        6. Dates of tests/procedures
        
        Organize the extracted information by category. Be specific with values, units, and dates.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            document_type: { type: "string", description: "Type of document (lab report, imaging, etc)" },
            date_of_document: { type: "string", description: "Date on document if available" },
            lab_results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  value: { type: "string" },
                  reference_range: { type: "string" },
                  unit: { type: "string" }
                }
              }
            },
            diagnoses: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            vital_signs: {
              type: "object",
              properties: {
                bp: { type: "string" },
                hr: { type: "string" },
                temperature: { type: "string" },
                rr: { type: "string" },
                o2_sat: { type: "string" }
              }
            },
            imaging_findings: { type: "string" },
            raw_extracted_text: { type: "string", description: "Full extracted text from document" }
          }
        }
      });

      return result;
    } catch (error) {
      console.error("Failed to extract from document:", error);
      throw error;
    }
  };

  const extractFromSpreadsheet = async (fileUrl, fileName) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract clinical/lab data from this spreadsheet (${fileName}). Identify:
        1. Column headers and what data they contain
        2. Lab test names and their corresponding values
        3. Dates of tests
        4. Any reference ranges or normal values
        5. Patient information if present
        
        Organize all findings in a structured format.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            columns: { type: "array", items: { type: "string" } },
            lab_results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  value: { type: "string" },
                  date: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      return result;
    } catch (error) {
      console.error("Failed to extract from spreadsheet:", error);
      throw error;
    }
  };

  const extractFromTextDocument = async (fileUrl, fileName) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract clinical information from this text document (${fileName}). Focus on:
        1. Medical history items
        2. Current medications with dosages
        3. Allergies
        4. Recent test results or findings
        5. Clinical assessments or impressions
        6. Treatment recommendations`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            medical_history: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            findings: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });

      return result;
    } catch (error) {
      console.error("Failed to extract from text document:", error);
      throw error;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleApplyData = (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.data) {
      onDataExtracted(file.data, file.name);
      toast.success("Data applied to note");
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Import Patient Documents</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600 mt-1">Upload lab reports, imaging results, or medical records (PDF, images, spreadsheets)</p>
      </div>

      {/* Upload Area */}
      <div className="p-6 space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900">Drag files here or click to browse</p>
          <p className="text-xs text-slate-600 mt-1">PDF, images, spreadsheets, or documents (max 10MB each)</p>
          
          <input
            type="file"
            multiple
            accept={acceptedFormats.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            id="document-upload"
          />
          <label htmlFor="document-upload" className="mt-4 inline-block">
            <Button asChild variant="outline" className="cursor-pointer">
              <span>Browse Files</span>
            </Button>
          </label>
        </div>

        {/* File Processing Status */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Processing Documents</h4>
            {uploadedFiles.map(file => (
              <div key={file.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {file.status === "uploading" && "Uploading..."}
                        {file.status === "extracting" && "Extracting information..."}
                        {file.status === "success" && "Successfully processed"}
                        {file.status === "error" && "Failed to process"}
                      </p>
                    </div>
                  </div>

                  {file.status === "uploading" || file.status === "extracting" ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  ) : file.status === "success" ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                </div>

                {/* Extracted Data Preview */}
                {file.status === "success" && file.data && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-900">Extracted Information:</p>
                    <div className="space-y-1">
                      {file.data.document_type && (
                        <p className="text-xs text-blue-800"><span className="font-medium">Type:</span> {file.data.document_type}</p>
                      )}
                      {file.data.lab_results?.length > 0 && (
                        <p className="text-xs text-blue-800"><span className="font-medium">Lab Results:</span> {file.data.lab_results.length} tests found</p>
                      )}
                      {file.data.diagnoses?.length > 0 && (
                        <p className="text-xs text-blue-800"><span className="font-medium">Diagnoses:</span> {file.data.diagnoses.join(", ")}</p>
                      )}
                      {file.data.medications?.length > 0 && (
                        <p className="text-xs text-blue-800"><span className="font-medium">Medications:</span> {file.data.medications.length} found</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {file.status === "success" && (
                    <>
                      <Button
                        onClick={() => handleApplyData(file.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        Apply to Note
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => handleRemoveFile(file.id)}
                    size="sm"
                    variant="outline"
                    className="text-slate-700 border-slate-300 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Helpful Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <p><strong>Supported Documents:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Lab reports (PDF, images)</li>
            <li>Imaging results and impressions</li>
            <li>Spreadsheet data (Excel, CSV)</li>
            <li>Medical records and summaries</li>
            <li>Scanned documents (with OCR)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}