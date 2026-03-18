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
      `https://api.webz.io/newsApiLite?token=${encodeURIComponent(token)}&q=health&language=english&size=1`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }
    );

    const data = await res.json();

    if (data.errors && data.errors.length > 0) {
      return Response.json({ valid: false, error: data.errors[0] });
    }

    if (!res.ok) {
      return Response.json({ valid: false, error: `HTTP ${res.status}` });
    }

    return Response.json({ valid: true });

  } catch (error) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
});