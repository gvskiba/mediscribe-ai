import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SERVER_TOKEN = Deno.env.get("WEBZIO_TOKEN");
const API_BASE = 'https://api.webz.io/newsApiLite';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}

    const { query = 'health medicine medical', page = 0, size = 10, token } = body;
    const resolvedToken = token || SERVER_TOKEN;

    if (!resolvedToken) {
      return Response.json({ error: 'No Webz.io token configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
      token: resolvedToken,
      q: query,
      language: 'english',
      size: String(size),
      from: String(page * size),
      sort: 'published',
    });

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Webz.io API error ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();

    if (data.errors) {
      return Response.json({ error: data.errors[0] || 'Webz.io error' }, { status: 502 });
    }

    // Normalize posts to a common article shape
    const articles = (data.posts || []).map(p => ({
      uuid: p.uuid || p.url,
      title: p.title,
      url: p.url,
      description: p.text ? p.text.slice(0, 300) : '',
      image_url: p.thread?.main_image || null,
      source: p.thread?.site_full || p.thread?.site || 'Webz.io',
      published_at: p.published,
      categories: ['health'],
    }));

    return Response.json({
      articles,
      meta: { total: data.totalResults || 0, page, size },
      fetchedAt: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});