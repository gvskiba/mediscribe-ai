import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, format } = await req.json();

    if (!noteId || !format) {
      return Response.json({ error: 'Missing noteId or format' }, { status: 400 });
    }

    // Fetch the note
    const notes = await base44.entities.ClinicalNote.list();
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    if (format === 'text') {
      // Generate plain text export
      const textContent = generateTextExport(note);
      const filename = `${note.patient_name}_${note.date_of_visit || 'Note'}.txt`;
      
      return new Response(textContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else if (format === 'pdf') {
      // Generate PDF export
      const pdfBytes = generatePDFExport(note);
      const filename = `${note.patient_name}_${note.date_of_visit || 'Note'}.pdf`;
      
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      return Response.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateTextExport(note) {
  const lines = [];
  
  // Header
  lines.push('═'.repeat(80));
  lines.push('CLINICAL NOTE');
  lines.push('═'.repeat(80));
  lines.push('');
  
  // Patient Information
  lines.push('PATIENT INFORMATION');
  lines.push('─'.repeat(80));
  lines.push(`Patient Name: ${note.patient_name || 'N/A'}`);
  if (note.patient_id) lines.push(`Patient ID: ${note.patient_id}`);
  if (note.date_of_birth) lines.push(`Date of Birth: ${note.date_of_birth}`);
  if (note.date_of_visit) lines.push(`Date of Visit: ${note.date_of_visit}`);
  if (note.time_of_visit) lines.push(`Time of Visit: ${note.time_of_visit}`);
  if (note.specialty) lines.push(`Specialty: ${note.specialty}`);
  lines.push(`Status: ${note.status || 'draft'}`);
  lines.push(`Note Type: ${note.note_type || 'progress_note'}`);
  lines.push('');
  
  // Chief Complaint
  if (note.chief_complaint) {
    lines.push('CHIEF COMPLAINT');
    lines.push('─'.repeat(80));
    lines.push(note.chief_complaint);
    lines.push('');
  }
  
  // History of Present Illness
  if (note.history_of_present_illness) {
    lines.push('HISTORY OF PRESENT ILLNESS');
    lines.push('─'.repeat(80));
    lines.push(note.history_of_present_illness);
    lines.push('');
  }
  
  // Review of Systems
  if (note.review_of_systems) {
    lines.push('REVIEW OF SYSTEMS');
    lines.push('─'.repeat(80));
    lines.push(note.review_of_systems);
    lines.push('');
  }
  
  // Medical History
  if (note.medical_history) {
    lines.push('MEDICAL HISTORY');
    lines.push('─'.repeat(80));
    lines.push(note.medical_history);
    lines.push('');
  }
  
  // Physical Exam
  if (note.physical_exam) {
    lines.push('PHYSICAL EXAMINATION');
    lines.push('─'.repeat(80));
    lines.push(note.physical_exam);
    lines.push('');
  }
  
  // Assessment
  if (note.assessment) {
    lines.push('ASSESSMENT');
    lines.push('─'.repeat(80));
    lines.push(note.assessment);
    lines.push('');
  }
  
  // Plan
  if (note.plan) {
    lines.push('PLAN');
    lines.push('─'.repeat(80));
    lines.push(note.plan);
    lines.push('');
  }
  
  // Clinical Impression
  if (note.clinical_impression) {
    lines.push('CLINICAL IMPRESSION');
    lines.push('─'.repeat(80));
    lines.push(note.clinical_impression);
    lines.push('');
  }
  
  // Diagnoses
  if (note.diagnoses && note.diagnoses.length > 0) {
    lines.push('DIAGNOSES');
    lines.push('─'.repeat(80));
    note.diagnoses.forEach((diagnosis, idx) => {
      lines.push(`${idx + 1}. ${diagnosis}`);
    });
    lines.push('');
  }
  
  // Medications
  if (note.medications && note.medications.length > 0) {
    lines.push('MEDICATIONS');
    lines.push('─'.repeat(80));
    note.medications.forEach((medication, idx) => {
      lines.push(`${idx + 1}. ${medication}`);
    });
    lines.push('');
  }
  
  // Footer
  lines.push('═'.repeat(80));
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`This is an electronically generated document.`);
  lines.push('═'.repeat(80));
  
  return lines.join('\n');
}

function generatePDFExport(note) {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - (margin * 2);
  
  function addSection(title, content) {
    if (!content || content.trim() === '') return;
    
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Section title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 8;
    
    // Section content
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const splitText = doc.splitTextToSize(content, maxWidth);
    doc.text(splitText, margin, yPosition);
    yPosition += (splitText.length * 5) + 5;
  }
  
  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('CLINICAL NOTE', margin, yPosition);
  yPosition += 15;
  
  // Patient Header
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`Patient: ${note.patient_name || 'N/A'}`, margin, yPosition);
  yPosition += 6;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const headerInfo = [];
  if (note.patient_id) headerInfo.push(`MRN: ${note.patient_id}`);
  if (note.date_of_visit) headerInfo.push(`Date: ${note.date_of_visit}`);
  if (note.specialty) headerInfo.push(`Specialty: ${note.specialty}`);
  if (note.note_type) headerInfo.push(`Type: ${note.note_type}`);
  
  const headerText = headerInfo.join(' | ');
  const splitHeader = doc.splitTextToSize(headerText, maxWidth);
  doc.text(splitHeader, margin, yPosition);
  yPosition += (splitHeader.length * 4) + 8;
  
  // Add sections
  addSection('CHIEF COMPLAINT', note.chief_complaint);
  addSection('HISTORY OF PRESENT ILLNESS', note.history_of_present_illness);
  addSection('REVIEW OF SYSTEMS', note.review_of_systems);
  addSection('MEDICAL HISTORY', note.medical_history);
  addSection('PHYSICAL EXAMINATION', note.physical_exam);
  addSection('ASSESSMENT', note.assessment);
  addSection('PLAN', note.plan);
  addSection('CLINICAL IMPRESSION', note.clinical_impression);
  
  // Diagnoses
  if (note.diagnoses && note.diagnoses.length > 0) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DIAGNOSES', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    note.diagnoses.forEach((diagnosis) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      const splitDiagnosis = doc.splitTextToSize(`• ${diagnosis}`, maxWidth - 5);
      doc.text(splitDiagnosis, margin + 5, yPosition);
      yPosition += (splitDiagnosis.length * 5) + 2;
    });
    yPosition += 5;
  }
  
  // Medications
  if (note.medications && note.medications.length > 0) {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('MEDICATIONS', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    note.medications.forEach((medication) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      const splitMed = doc.splitTextToSize(`• ${medication}`, maxWidth - 5);
      doc.text(splitMed, margin + 5, yPosition);
      yPosition += (splitMed.length * 5) + 2;
    });
  }
  
  // Footer on last page
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
  
  return doc.output('arraybuffer');
}