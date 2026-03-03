import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query = 'stock market', limit = 5 } = body;

    const apiKey = Deno.env.get('POLYGON_IO_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Polygon.io API key not configured' }, { status: 500 });
    }

    const url = new URL('https://api.polygon.io/v2/reference/news');
    url.searchParams.append('query', query);
    url.searchParams.append('limit', limit);
    url.searchParams.append('apiKey', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Polygon.io API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();

    const articles = (data.results || []).map(item => ({
      title: item.title,
      description: item.description || item.author || '',
      url: item.article_url,
      image_url: item.image_url,
      source: item.publisher?.name || 'Polygon.io',
      published_at: item.published_utc,
      uuid: item.id || item.title,
      keywords: item.keywords || [],
    }));

    return Response.json({
      articles,
      meta: {
        status: data.status,
        results: (data.results || []).length,
        count: data.count,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});