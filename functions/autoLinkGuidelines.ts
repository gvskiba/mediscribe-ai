import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
      return Response.json({ error: 'noteId is required' }, { status: 400 });
    }

    // Fetch the note
    const note = await base44.entities.ClinicalNote.list().then(
      notes => notes.find(n => n.id === noteId)
    );

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    // Extract all clinical data that should be linked to guidelines
    const diagnosesToLink = note.diagnoses || [];
    const symptoms = extractSymptoms(note.history_of_present_illness || '');
    const conditions = extractConditions(note.assessment || '');

    // Fetch all available guidelines for this user
    const guidelines = await base44.entities.GuidelineQuery.list();

    // Match note content to guidelines
    const linkedGuidelines = [];
    const linkedGuidelineIds = new Set();

    // Match diagnoses to guidelines
    diagnosesToLink.forEach(diagnosis => {
      const cleanDiagnosis = diagnosis.replace(/\(.*?\)/g, '').trim();
      const matches = guidelines.filter(g => 
        matchText(g.question, cleanDiagnosis) || 
        matchText(g.answer, cleanDiagnosis)
      );

      matches.forEach(match => {
        if (!linkedGuidelineIds.has(match.id)) {
          linkedGuidelines.push({
            guideline_query_id: match.id,
            condition: cleanDiagnosis,
            incorporated: false,
            adherence_notes: `Automatically linked based on diagnosis match`
          });
          linkedGuidelineIds.add(match.id);
        }
      });
    });

    // Match symptoms to guidelines
    symptoms.forEach(symptom => {
      const matches = guidelines.filter(g => 
        matchText(g.question, symptom) || 
        matchText(g.answer, symptom)
      );

      matches.forEach(match => {
        if (!linkedGuidelineIds.has(match.id)) {
          linkedGuidelines.push({
            guideline_query_id: match.id,
            condition: symptom,
            incorporated: false,
            adherence_notes: `Automatically linked based on symptom match`
          });
          linkedGuidelineIds.add(match.id);
        }
      });
    });

    // Match conditions from assessment
    conditions.forEach(condition => {
      const matches = guidelines.filter(g => 
        matchText(g.question, condition) || 
        matchText(g.answer, condition)
      );

      matches.forEach(match => {
        if (!linkedGuidelineIds.has(match.id)) {
          linkedGuidelines.push({
            guideline_query_id: match.id,
            condition: condition,
            incorporated: false,
            adherence_notes: `Automatically linked based on clinical finding`
          });
          linkedGuidelineIds.add(match.id);
        }
      });
    });

    // Update note with linked guidelines
    if (linkedGuidelines.length > 0) {
      const existingLinks = note.linked_guidelines || [];
      const allLinks = [...existingLinks, ...linkedGuidelines];
      
      await base44.entities.ClinicalNote.update(noteId, {
        linked_guidelines: allLinks
      });
    }

    return Response.json({
      success: true,
      linkedCount: linkedGuidelines.length,
      linkedGuidelines: linkedGuidelines
    });
  } catch (error) {
    console.error('Error in autoLinkGuidelines:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractSymptoms(text) {
  const symptoms = [];
  const symptomKeywords = [
    'pain', 'fever', 'cough', 'shortness of breath', 'dyspnea', 'chest', 
    'headache', 'nausea', 'vomiting', 'diarrhea', 'rash', 'fatigue',
    'weakness', 'dizziness', 'palpitations', 'tremor', 'sweating'
  ];

  symptomKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(text)) {
      symptoms.push(keyword);
    }
  });

  return [...new Set(symptoms)];
}

function extractConditions(text) {
  const conditions = [];
  const conditionKeywords = [
    'hypertension', 'diabetes', 'asthma', 'copd', 'heart disease',
    'coronary artery disease', 'heart failure', 'arrhythmia', 'angina',
    'pneumonia', 'bronchitis', 'flu', 'cold', 'infection', 'sepsis',
    'stroke', 'tia', 'anemia', 'thyroid', 'hyperthyroid', 'hypothyroid'
  ];

  conditionKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(text)) {
      conditions.push(keyword);
    }
  });

  return [...new Set(conditions)];
}

function matchText(text1, text2) {
  if (!text1 || !text2) return false;
  const norm1 = text1.toLowerCase().replace(/[^\w\s]/g, '');
  const norm2 = text2.toLowerCase().replace(/[^\w\s]/g, '');
  
  // Check for exact match
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }

  // Check for word overlap (at least 70% of words should match)
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const shortText = words1.length < words2.length ? words1 : words2;
  const longText = words1.length >= words2.length ? words1 : words2;

  const matches = shortText.filter(word => longText.includes(word)).length;
  return (matches / shortText.length) > 0.7;
}