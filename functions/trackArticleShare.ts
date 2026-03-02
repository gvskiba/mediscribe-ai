import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { article_url, article_title, source_name, share_method } = body;

    if (!article_url || !article_title || !share_method) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validMethods = ['copy_link', 'email', 'twitter', 'facebook', 'linkedin'];
    if (!validMethods.includes(share_method)) {
      return Response.json({ error: 'Invalid share method' }, { status: 400 });
    }

    // Record sharing analytics
    await base44.entities.SharingAnalytics.create({
      article_url,
      article_title,
      source_name: source_name || 'Unknown',
      share_method,
      shared_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});