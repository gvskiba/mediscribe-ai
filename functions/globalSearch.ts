import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const query = body.query?.toLowerCase() || '';

    if (!query || query.length < 2) {
      return Response.json({ results: [], query });
    }

    const results = [];

    // Search in Clinical Notes
    try {
      const notes = await base44.entities.ClinicalNote.list('-updated_date', 100);
      const matchedNotes = notes.filter(note =>
        note.patient_name?.toLowerCase().includes(query) ||
        note.chief_complaint?.toLowerCase().includes(query) ||
        note.summary?.toLowerCase().includes(query) ||
        note.diagnoses?.some(d => d.toLowerCase().includes(query)) ||
        note.raw_note?.toLowerCase().includes(query)
      ).slice(0, 10);

      results.push(...matchedNotes.map(note => ({
        id: note.id,
        type: 'clinical_note',
        title: `${note.patient_name} - ${note.chief_complaint || 'Clinical Note'}`,
        description: note.summary || note.chief_complaint || 'No summary available',
        date: note.updated_date,
        url: `/NoteDetail?id=${note.id}`
      })));
    } catch (e) {
      console.log('Error searching notes:', e.message);
    }

    // Search in Guidelines
    try {
      const guidelines = await base44.entities.GuidelineQuery.list('-updated_date', 100);
      const matchedGuidelines = guidelines.filter(g =>
        g.question?.toLowerCase().includes(query) ||
        g.answer?.toLowerCase().includes(query) ||
        g.category?.toLowerCase().includes(query)
      ).slice(0, 10);

      results.push(...matchedGuidelines.map(g => ({
        id: g.id,
        type: 'guideline',
        title: g.question || 'Guideline Query',
        description: g.answer ? g.answer.substring(0, 150) : 'No answer available',
        date: g.updated_date,
        url: `/GuidelineDetail?id=${g.id}`
      })));
    } catch (e) {
      console.log('Error searching guidelines:', e.message);
    }

    // Search in Snippets
    try {
      const snippets = await base44.entities.Snippet.list('-updated_date', 100);
      const matchedSnippets = snippets.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.content?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
      ).slice(0, 10);

      results.push(...matchedSnippets.map(s => ({
        id: s.id,
        type: 'snippet',
        title: s.name || 'Snippet',
        description: s.content ? s.content.substring(0, 150) : 'No content',
        date: s.updated_date,
        url: `/Snippets?snippet=${s.id}`
      })));
    } catch (e) {
      console.log('Error searching snippets:', e.message);
    }

    // Search in Note Templates
    try {
      const templates = await base44.entities.NoteTemplate.list('-updated_date', 100);
      const matchedTemplates = templates.filter(t =>
        t.name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      ).slice(0, 10);

      results.push(...matchedTemplates.map(t => ({
        id: t.id,
        type: 'template',
        title: t.name || 'Template',
        description: t.description || t.category || 'No description',
        date: t.updated_date,
        url: `/NoteTemplates?template=${t.id}`
      })));
    } catch (e) {
      console.log('Error searching templates:', e.message);
    }

    // Sort results by relevance (exact matches first) and then by date
    const sorted = results.sort((a, b) => {
      const aExact = a.title?.toLowerCase().includes(query) ? 0 : 1;
      const bExact = b.title?.toLowerCase().includes(query) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return new Date(b.date) - new Date(a.date);
    });

    return Response.json({
      results: sorted.slice(0, 30),
      query,
      totalResults: sorted.length
    });
  } catch (error) {
    return Response.json({ error: error.message, results: [] }, { status: 500 });
  }
});