import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { searchParams } = new URL(req.url);
    
    let query = searchParams.get('q');
    let action = searchParams.get('action');
    let guidelineUrl = searchParams.get('url');

    // If POST with JSON body, extract from there
    if (req.method === 'POST' && !query) {
      const body = await req.json();
      query = body.q || body.query;
      action = body.action;
      guidelineUrl = body.url;
    }

    if (action === 'fetch' && guidelineUrl) {
      return await fetchGuidelineContent(guidelineUrl);
    }

    if (!query) {
      return Response.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    return await searchOpenEvidence(query);
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function searchOpenEvidence(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.openevidence.com/search?q=${encodedQuery}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GuidelinesBot/1.0)',
        'Accept': 'application/json, text/html, */*',
      },
    });

    const html = await response.text();
    const guidelines = parseGuidelinesFromHtml(html);

    return Response.json({
      query,
      totalResults: guidelines.length,
      results: guidelines.slice(0, 10).map((g, i) => ({
        id: i + 1,
        title: g.title,
        url: g.url,
        description: g.description,
        source: 'OpenEvidence',
      })),
    });
  } catch (error) {
    return Response.json({
      error: 'Failed to query OpenEvidence',
      message: error.message,
    }, { status: 500 });
  }
}

function parseGuidelinesFromHtml(html) {
  const results = [];

  // Extract JSON-LD structured data if present
  const jsonLdMatches = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const match of jsonLdMatches) {
    try {
      const json = JSON.parse(match.replace(/<script[^>]*>|<\/script>/gi, ''));
      if (json['@type'] === 'ItemList' && json.itemListElement) {
        json.itemListElement.forEach(item => {
          results.push({
            title: item.name || '',
            url: item.url || '',
            description: item.description || '',
          });
        });
      }
    } catch (e) {}
  }

  // Fallback: extract article/card-style elements
  if (results.length === 0) {
    const cardPattern = /<(?:article|div|li)[^>]*class="[^"]*(?:result|card|item|guideline)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div|li)>/gi;
    let cardMatch;
    while ((cardMatch = cardPattern.exec(html)) !== null && results.length < 20) {
      const card = cardMatch[1];
      const titleMatch = card.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
      const linkMatch = card.match(/href="([^"]+)"/);
      const descMatch = card.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (title) {
        results.push({
          title,
          url: linkMatch ? linkMatch[1] : '',
          description: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '',
        });
      }
    }
  }

  return results;
}

async function fetchGuidelineContent(guidelineUrl) {
  try {
    if (!guidelineUrl.includes('openevidence.com')) {
      throw new Error('Only OpenEvidence URLs are allowed');
    }

    const response = await fetch(guidelineUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GuidelinesBot/1.0)',
      },
    });

    const html = await response.text();

    // Extract main content
    const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                         html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                         html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    const rawContent = contentMatch ? contentMatch[1] : html;
    const textContent = rawContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    return Response.json({
      url: guidelineUrl,
      content: textContent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}