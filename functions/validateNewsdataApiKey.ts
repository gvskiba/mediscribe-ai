import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await req.json();
    if (!token) return Response.json({ valid: false, error: 'No token provided' });

    const url = `https://newsdata.io/api/1/latest?apikey=${token}&q=medicine&size=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'success') {
      return Response.json({ valid: true });
    } else {
      return Response.json({ valid: false, error: data.results?.message || data.message || 'Invalid API key' });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});