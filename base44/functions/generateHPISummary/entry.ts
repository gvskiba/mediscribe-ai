import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { ccLabel, hpiNarrative, fields, patientName, patientAge, patientGender } = await req.json();

  const fieldsSummary = Object.entries(fields || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');

  const prompt = `You are a board-certified emergency medicine physician writing a concise, high-level clinical summary paragraph for a patient chart. Use standard clinical documentation style (third person, past tense, professional medical language).

Patient: ${patientName || 'The patient'}${patientAge ? `, ${patientAge}` : ''}${patientGender ? ` ${patientGender}` : ''}
Chief Complaint: ${ccLabel || 'not specified'}

HPI Narrative:
${hpiNarrative || 'Not documented'}

Structured HPI Fields:
${fieldsSummary || 'Not documented'}

Write a single concise paragraph (4–6 sentences) that:
1. Opens with patient demographics and chief complaint
2. Summarizes the onset, character, and severity of the presenting complaint
3. Notes key associated symptoms and pertinent negatives
4. Mentions relevant modifying factors
5. Ends with a brief clinical impression or risk stratification note

Return ONLY the paragraph, no headings or preamble.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 400,
  });

  const summary = response.choices[0].message.content.trim();
  return Response.json({ summary });
});