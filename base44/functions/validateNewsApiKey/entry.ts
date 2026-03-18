import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}

    const { token } = body;
    if (!token) return Response.json({ valid: false, error: 'No token provided' });

    const res = await fetch(
      `https://api.thenewsapi.com/v1/news/all?api_token=${encodeURIComponent(token)}&search=health&language=en&limit=1`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }
    );

    const data = await res.json();

    if (data?.error) {
      return Response.json({ valid: false, error: data.error.message || 'Invalid API token' });
    }

    return Response.json({ valid: true, plan: data?.meta || {} });

  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});