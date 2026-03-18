import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { file_url } = body;

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Fetch audio file
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      return Response.json({ error: 'Failed to fetch audio file' }, { status: 400 });
    }

    const audioBuffer = await fileResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Step 1: Transcribe audio using OpenAI
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: new FormData(await createFormData(audioBuffer)),
    });

    if (!transcriptionResponse.ok) {
      console.error('Transcription failed:', await transcriptionResponse.text());
      return Response.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcript = transcriptionData.text || '';

    if (!transcript.trim()) {
      return Response.json({
        transcript: '',
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      });
    }

    // Step 2: Generate SOAP notes from transcript
    const soapResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a clinical documentation expert. Analyze the following clinical encounter transcript and extract SOAP note segments.

TRANSCRIPT:
${transcript}

Extract and provide ONLY the following four sections in a JSON format with NO additional text:
1. SUBJECTIVE: Chief complaint, history of present illness, medical history, medications, allergies, review of systems
2. OBJECTIVE: Vital signs, physical examination findings, lab results, imaging findings
3. ASSESSMENT: Diagnoses, clinical impression, differential diagnosis
4. PLAN: Treatment plan, medications, follow-up, referrals

If a section cannot be determined from the transcript, leave it empty.`,
      response_json_schema: {
        type: 'object',
        properties: {
          subjective: { type: 'string' },
          objective: { type: 'string' },
          assessment: { type: 'string' },
          plan: { type: 'string' },
        },
      },
    });

    return Response.json({
      transcript: transcript,
      subjective: soapResponse?.subjective || '',
      objective: soapResponse?.objective || '',
      assessment: soapResponse?.assessment || '',
      plan: soapResponse?.plan || '',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper to create FormData from audio buffer
async function createFormData(audioBuffer) {
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-1');
  return formData;
}