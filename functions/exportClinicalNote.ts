import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, format, clinicInfo } = await req.json();

    if (!noteId || !format) {
      return Response.json({ error: 'Missing noteId or format' }, { status: 400 });
    }

    const notes = await base44.asServiceRole.entities.ClinicalNote.list();
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    // Fetch hospital settings for clinic header
    const hospitalSettingsList = await base44.asServiceRole.entities.HospitalSettings.list();
    const hospitalSettings = hospitalSettingsList.length > 0 ? hospitalSettingsList[0] : null;

    if (format === 'text') {
      const textContent = generateTextExport(note, hospitalSettings);
      const filename = `${note.patient_name || 'note'}_${note.date_of_visit || 'Note'}.txt`;
      return new Response(textContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else if (format === 'pdf') {
      const pdfBytes = generatePDFExport(note, hospitalSettings, user);
      const filename = `${note.patient_name || 'note'}_${note.date_of_visit || 'Note'}.pdf`;
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

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

function noteTypeLabel(type) {
  return {
    progress_note: 'Progress Note',
    h_and_p: 'History & Physical',
    discharge_summary: 'Discharge Summary',
    consult: 'Consultation Note',
    procedure_note: 'Procedure Note',
  }[type] || 'Clinical Note';
}

// ──────────────────────────────────────────────
// TEXT EXPORT
// ──────────────────────────────────────────────
function generateTextExport(note, hospital) {
  const lines = [];
  const HR = '═'.repeat(80);
  const hr = '─'.repeat(80);

  lines.push(HR);
  if (hospital?.hospital_name) lines.push(`  ${hospital.hospital_name.toUpperCase()}`);
  if (hospital?.company_name) lines.push(`  ${hospital.company_name}`);
  if (hospital?.address)      lines.push(`  ${hospital.address}`);
  if (hospital?.phone)        lines.push(`  ${hospital.phone}`);
  lines.push(`  ${noteTypeLabel(note.note_type)}`);
  lines.push(HR);
  lines.push('');

  lines.push('PATIENT INFORMATION');
  lines.push(hr);
  lines.push(`Name:           ${note.patient_name || 'N/A'}`);
  if (note.patient_id)   lines.push(`MRN:            ${note.patient_id}`);
  if (note.date_of_birth) lines.push(`Date of Birth:  ${formatDate(note.date_of_birth)}${calcAge(note.date_of_birth) ? ` (Age ${calcAge(note.date_of_birth)})` : ''}`);
  if (note.patient_gender) lines.push(`Gender:         ${note.patient_gender}`);
  if (note.date_of_visit)  lines.push(`Date of Visit:  ${formatDate(note.date_of_visit)}`);
  if (note.time_of_visit)  lines.push(`Time of Visit:  ${note.time_of_visit}`);
  if (note.specialty)      lines.push(`Specialty:      ${note.specialty}`);
  lines.push(`Note Type:      ${noteTypeLabel(note.note_type)}`);
  lines.push(`Status:         ${(note.status || 'draft').toUpperCase()}`);
  lines.push('');

  const sections = [
    ['CHIEF COMPLAINT', note.chief_complaint],
    ['HISTORY OF PRESENT ILLNESS', note.history_of_present_illness],
    ['REVIEW OF SYSTEMS', note.review_of_systems],
    ['MEDICAL HISTORY', note.medical_history],
    ['PHYSICAL EXAMINATION', note.physical_exam],
    ['ASSESSMENT', note.assessment],
    ['PLAN', note.plan],
    ['CLINICAL IMPRESSION', note.clinical_impression],
    ['MDM', note.mdm],
    ['DISCHARGE SUMMARY', note.discharge_summary],
  ];

  for (const [title, content] of sections) {
    if (!content) continue;
    lines.push(title);
    lines.push(hr);
    lines.push(content);
    lines.push('');
  }

  if (note.diagnoses?.length) {
    lines.push('DIAGNOSES / ICD-10 CODES');
    lines.push(hr);
    note.diagnoses.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));
    lines.push('');
  }

  if (note.medications?.length) {
    lines.push('MEDICATIONS');
    lines.push(hr);
    note.medications.forEach((m, i) => lines.push(`  ${i + 1}. ${m}`));
    lines.push('');
  }

  if (note.allergies?.length) {
    lines.push('ALLERGIES');
    lines.push(hr);
    note.allergies.forEach(a => lines.push(`  • ${a}`));
    lines.push('');
  }

  lines.push(HR);
  lines.push(`Generated: ${new Date().toLocaleString()}  |  Electronically generated document`);
  lines.push(HR);

  return lines.join('\n');
}

// ──────────────────────────────────────────────
// PDF EXPORT
// ──────────────────────────────────────────────
function generatePDFExport(note, hospital, user) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const ML = 50, MR = 50;
  const CW = W - ML - MR;
  let y = 0;

  // ── Colors (RGB) ──
  const NAVY   = [5,  15, 30];
  const TEAL   = [0, 168, 150];
  const DARK   = [30, 40, 60];
  const MED    = [80, 100, 130];
  const LIGHT  = [200, 220, 240];
  const WHITE  = [255, 255, 255];
  const GRAY   = [240, 243, 248];
  const RED    = [200, 50, 60];

  function setRGB(arr) { doc.setTextColor(...arr); }
  function setFillRGB(arr) { doc.setFillColor(...arr); }
  function setDrawRGB(arr) { doc.setDrawColor(...arr); }

  function newPageIfNeeded(needed = 60) {
    if (y + needed > H - 60) {
      addFooter();
      doc.addPage();
      y = 50;
      addPageHeader();
    }
  }

  function addFooter() {
    const fy = H - 30;
    setFillRGB([245, 247, 250]);
    doc.rect(0, H - 42, W, 42, 'F');
    setDrawRGB([210, 218, 230]);
    doc.setLineWidth(0.5);
    doc.line(ML, H - 42, W - MR, H - 42);

    doc.setFontSize(7);
    setRGB(MED);
    doc.setFont('helvetica', 'normal');
    const leftTxt = hospital?.hospital_name
      ? `${hospital.hospital_name} — Confidential Medical Record`
      : 'Confidential Medical Record — Notrya AI by MedNu';
    doc.text(leftTxt, ML, fy);
    doc.text(`Generated: ${new Date().toLocaleString()}`, W - MR, fy, { align: 'right' });
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    doc.text(`Page ${pageNum}`, W / 2, fy, { align: 'center' });
  }

  function addPageHeader() {
    // Thin accent bar
    setFillRGB(TEAL);
    doc.rect(0, 0, W, 4, 'F');
    y = 4;

    doc.setFontSize(8);
    setRGB(MED);
    doc.setFont('helvetica', 'normal');
    const headerRight = note.patient_name
      ? `${note.patient_name}${note.patient_id ? '  |  MRN: ' + note.patient_id : ''}  |  ${formatDate(note.date_of_visit)}`
      : formatDate(note.date_of_visit);
    doc.text(headerRight, W - MR, 20, { align: 'right' });
    y = 30;
  }

  // ── PAGE 1: CLINIC HEADER ──
  // Top accent bar
  setFillRGB(NAVY);
  doc.rect(0, 0, W, 90, 'F');
  setFillRGB(TEAL);
  doc.rect(0, 86, W, 4, 'F');

  // Clinic name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  setRGB(WHITE);
  const clinicName = hospital?.hospital_name || hospital?.company_name || 'Notrya AI Clinical Platform';
  doc.text(clinicName, ML, 38);

  // Sub-line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setRGB(LIGHT);
  const subParts = [];
  if (hospital?.address) subParts.push(hospital.address);
  if (hospital?.phone)   subParts.push(hospital.phone);
  if (subParts.length === 0) subParts.push('by MedNu · Clinical Intelligence Platform');
  doc.text(subParts.join('   ·   '), ML, 55);

  // Note type badge
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setRGB(TEAL);
  doc.text(noteTypeLabel(note.note_type).toUpperCase(), ML, 75);

  y = 110;

  // ── PATIENT INFO BOX ──
  setFillRGB(GRAY);
  setDrawRGB([210, 218, 230]);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, 88, 6, 6, 'FD');

  // Section label
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setRGB(TEAL);
  doc.text('PATIENT DEMOGRAPHICS', ML + 14, y + 16);

  // Patient name (large)
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  setRGB(DARK);
  doc.text(note.patient_name || 'Unknown Patient', ML + 14, y + 34);

  // Demographics row
  const demoItems = [];
  if (note.patient_id)     demoItems.push({ label: 'MRN', val: note.patient_id });
  if (note.date_of_birth)  demoItems.push({ label: 'DOB', val: formatDate(note.date_of_birth) + (calcAge(note.date_of_birth) ? ` · Age ${calcAge(note.date_of_birth)}` : '') });
  if (note.patient_gender) demoItems.push({ label: 'Sex', val: note.patient_gender.charAt(0).toUpperCase() + note.patient_gender.slice(1) });
  if (note.date_of_visit)  demoItems.push({ label: 'Visit Date', val: formatDate(note.date_of_visit) });
  if (note.time_of_visit)  demoItems.push({ label: 'Time', val: note.time_of_visit });
  if (note.specialty)      demoItems.push({ label: 'Specialty', val: note.specialty });

  const colW = CW / Math.min(demoItems.length, 4);
  demoItems.slice(0, 8).forEach((item, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const ix = ML + 14 + col * colW;
    const iy = y + 48 + row * 22;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setRGB(MED);
    doc.text(item.label.toUpperCase(), ix, iy);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setRGB(DARK);
    doc.text(item.val, ix, iy + 11);
  });

  y += 100;

  // Status pill
  const statusColor = note.status === 'finalized' ? [30, 160, 80] : note.status === 'amended' ? [200, 130, 0] : [120, 80, 200];
  const statusText = (note.status || 'DRAFT').toUpperCase();
  setFillRGB(statusColor);
  doc.roundedRect(W - MR - 70, y - 88, 70, 20, 4, 4, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setRGB(WHITE);
  doc.text(statusText, W - MR - 35, y - 74, { align: 'center' });

  // ── ALLERGIES BANNER (if any) ──
  if (note.allergies?.length) {
    y += 6;
    setFillRGB([255, 240, 240]);
    setDrawRGB([220, 80, 80]);
    doc.setLineWidth(1);
    doc.roundedRect(ML, y, CW, 26, 4, 4, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setRGB(RED);
    doc.text('⚠  ALLERGIES: ', ML + 12, y + 17);
    doc.setFont('helvetica', 'normal');
    const allergyText = note.allergies.join(', ');
    const afterLabel = ML + 12 + doc.getTextWidth('⚠  ALLERGIES: ');
    const splitAllergy = doc.splitTextToSize(allergyText, CW - afterLabel + ML - 20);
    doc.text(splitAllergy[0], afterLabel, y + 17);
    y += 36;
  }

  y += 14;

  // ── SECTION RENDERER ──
  function addSection(title, content, opts = {}) {
    if (!content || (typeof content === 'string' && !content.trim())) return;
    newPageIfNeeded(80);

    // Section header bar
    setFillRGB(NAVY);
    doc.rect(ML, y, CW, 20, 'F');
    setFillRGB(TEAL);
    doc.rect(ML, y, 4, 20, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setRGB(WHITE);
    doc.text(title, ML + 14, y + 13.5);
    y += 28;

    // Content
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    setRGB(DARK);

    const lines = doc.splitTextToSize(content, CW - 10);
    for (const line of lines) {
      newPageIfNeeded(16);
      doc.text(line, ML + 6, y);
      y += 14;
    }
    y += 8;
  }

  function addListSection(title, items, opts = {}) {
    if (!items?.length) return;
    newPageIfNeeded(60);

    setFillRGB(NAVY);
    doc.rect(ML, y, CW, 20, 'F');
    setFillRGB(TEAL);
    doc.rect(ML, y, 4, 20, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setRGB(WHITE);
    doc.text(title, ML + 14, y + 13.5);
    y += 28;

    items.forEach((item, i) => {
      newPageIfNeeded(18);
      // zebra rows
      if (i % 2 === 0) {
        setFillRGB([248, 250, 253]);
        doc.rect(ML, y - 10, CW, 16, 'F');
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      setRGB(DARK);
      const label = opts.numbered ? `${i + 1}.  ${item}` : `•  ${item}`;
      const split = doc.splitTextToSize(label, CW - 20);
      split.forEach((line, li) => {
        newPageIfNeeded(14);
        doc.text(line, ML + 10, y + (li * 13));
      });
      y += split.length * 13 + 4;
    });
    y += 8;
  }

  // ── CLINICAL SECTIONS ──
  addSection('CHIEF COMPLAINT', note.chief_complaint);
  addSection('HISTORY OF PRESENT ILLNESS', note.history_of_present_illness);
  addSection('REVIEW OF SYSTEMS', note.review_of_systems);
  addSection('MEDICAL HISTORY / PMH', note.medical_history);
  addSection('PHYSICAL EXAMINATION', note.physical_exam);
  addSection('ASSESSMENT', note.assessment);
  addSection('PLAN', note.plan);
  addSection('MEDICAL DECISION MAKING', note.mdm);
  addSection('CLINICAL IMPRESSION', note.clinical_impression);
  addSection('DISPOSITION PLAN', note.disposition_plan);
  addSection('DISCHARGE SUMMARY', note.discharge_summary);

  addListSection('DIAGNOSES / ICD-10 CODES', note.diagnoses, { numbered: true });
  addListSection('MEDICATIONS', note.medications, { numbered: true });

  // ── LAB FINDINGS TABLE ──
  if (note.lab_findings?.length) {
    newPageIfNeeded(80);
    setFillRGB(NAVY);
    doc.rect(ML, y, CW, 20, 'F');
    setFillRGB(TEAL);
    doc.rect(ML, y, 4, 20, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setRGB(WHITE);
    doc.text('LABORATORY RESULTS', ML + 14, y + 13.5);
    y += 28;

    // Table header
    const cols = [['Test', 0.35], ['Result', 0.2], ['Reference', 0.25], ['Status', 0.2]];
    setFillRGB([220, 230, 245]);
    doc.rect(ML, y - 10, CW, 16, 'F');
    let cx = ML + 6;
    cols.forEach(([label, frac]) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      setRGB(NAVY);
      doc.text(label, cx, y);
      cx += CW * frac;
    });
    y += 10;

    note.lab_findings.forEach((f, i) => {
      newPageIfNeeded(18);
      if (i % 2 === 0) {
        setFillRGB([248, 250, 253]);
        doc.rect(ML, y - 10, CW, 16, 'F');
      }
      const statusClr = f.status === 'critical' ? RED : f.status === 'abnormal' ? [180, 100, 0] : [30, 140, 60];
      let cx2 = ML + 6;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      setRGB(DARK);
      doc.text(doc.splitTextToSize(f.test_name || '', CW * 0.35 - 4)[0], cx2, y); cx2 += CW * 0.35;
      doc.text(doc.splitTextToSize(`${f.result || ''}${f.unit ? ' ' + f.unit : ''}`, CW * 0.2 - 4)[0], cx2, y); cx2 += CW * 0.2;
      doc.text(doc.splitTextToSize(f.reference_range || '', CW * 0.25 - 4)[0], cx2, y); cx2 += CW * 0.25;
      setRGB(statusClr);
      doc.setFont('helvetica', 'bold');
      doc.text((f.status || '').toUpperCase(), cx2, y);
      y += 16;
    });
    y += 8;
  }

  // ── IMAGING FINDINGS ──
  if (note.imaging_findings?.length) {
    newPageIfNeeded(80);
    setFillRGB(NAVY);
    doc.rect(ML, y, CW, 20, 'F');
    setFillRGB(TEAL);
    doc.rect(ML, y, 4, 20, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setRGB(WHITE);
    doc.text('IMAGING / RADIOLOGY', ML + 14, y + 13.5);
    y += 28;

    note.imaging_findings.forEach((f, i) => {
      newPageIfNeeded(50);
      if (i % 2 === 0) {
        setFillRGB([248, 250, 253]);
        doc.rect(ML, y - 2, CW, 42, 'F');
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      setRGB(DARK);
      doc.text(`${f.study_type || 'Imaging'} — ${f.location || ''}`, ML + 8, y + 10);
      doc.setFont('helvetica', 'normal');
      setRGB(MED);
      if (f.findings) {
        const fl = doc.splitTextToSize(`Findings: ${f.findings}`, CW - 16);
        doc.text(fl[0], ML + 8, y + 22);
      }
      if (f.impression) {
        setRGB([30, 100, 60]);
        doc.setFont('helvetica', 'bolditalic');
        const il = doc.splitTextToSize(`Impression: ${f.impression}`, CW - 16);
        doc.text(il[0], ML + 8, y + 34);
      }
      y += 50;
    });
    y += 8;
  }

  // ── SIGNATURE BLOCK ──
  newPageIfNeeded(80);
  y += 10;
  setDrawRGB([200, 210, 225]);
  doc.setLineWidth(0.5);
  doc.line(ML, y, W - MR, y);
  y += 16;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setRGB(NAVY);
  doc.text('PROVIDER ATTESTATION', ML, y);
  y += 14;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setRGB(MED);
  const signerName = user?.full_name || 'Provider';
  doc.text(`Authored by: ${signerName}`, ML, y);
  doc.text(`Date / Time: ${new Date().toLocaleString()}`, ML, y + 14);
  doc.text('Electronic signature — This document was generated by Notrya AI and reviewed by the signing clinician.', ML, y + 28);

  // Sig line
  y += 50;
  setDrawRGB([150, 160, 180]);
  doc.line(ML, y, ML + 200, y);
  doc.setFontSize(7.5);
  setRGB(MED);
  doc.text('Signature', ML, y + 10);
  doc.line(ML + 240, y, ML + 440, y);
  doc.text('Date', ML + 240, y + 10);

  // Final footer
  addFooter();

  return doc.output('arraybuffer');
}