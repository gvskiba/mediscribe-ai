import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const API_TOKEN = Deno.env.get("THENEWSAPI_TOKEN");
const API_BASE  = 'https://api.thenewsapi.com/v1/news/all';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const { query = 'health medicine medical', categories = 'health,science', page = 1, limit = 10, token } = body;

    // Use user-supplied token first, then fall back to server secret
    const resolvedToken = token || API_TOKEN;
    if (!resolvedToken) {
      return Response.json({ error: 'No API token configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
      api_token:  resolvedToken,
      search:     query,
      categories: categories,
      language:   'en',
      limit:      String(limit),
      page:       String(page),
      sort:       'published_at',
    });

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `API error ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();

    if (data.error) {
      return Response.json({ error: data.message || data.error }, { status: 502 });
    }

    return Response.json({
      articles: data.data || [],
      meta: data.meta || {},
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});