import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RSS_SOURCES = [
  {
    id: "who_news",
    name: "WHO",
    label: "World Health Organization",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    category: "Global Health"
  },
  {
    id: "cdc_news",
    name: "CDC",
    label: "Centers for Disease Control",
    url: "https://tools.cdc.gov/api/v2/resources/media/132608.rss",
    category: "Public Health"
  },
  {
    id: "nih_news",
    name: "NIH",
    label: "National Institutes of Health",
    url: "https://www.nih.gov/news-events/news-releases.rss",
    category: "Research"
  },
  {
    id: "nejm",
    name: "NEJM",
    label: "New England Journal of Medicine",
    url: "https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss",
    category: "Clinical Research"
  },
  {
    id: "medlineplus",
    name: "MedlinePlus",
    label: "NLM MedlinePlus Health News",
    url: "https://medlineplus.gov/xml/mplus_health_news_english.xml",
    category: "Health News"
  },
  {
    id: "lancet",
    name: "Lancet",
    label: "The Lancet",
    url: "https://www.thelancet.com/rssfeed/lancet_online.xml",
    category: "Clinical Research"
  }
];

function parseRSSFeed(xml, sourceId, sourceName, category) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const getTag = (tag) => {
      const patterns = [
        new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
        new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
      ];
      for (const p of patterns) {
        const m = block.match(p);
        if (m && m[1]) return m[1].trim();
      }
      return '';
    };

    // Special handling for <link> which is self-closing or between tags
    const getLinkTag = () => {
      const m1 = block.match(/<link[^>]*>([^<]+)<\/link>/i);
      if (m1) return m1[1].trim();
      // CDATA link
      const m2 = block.match(/<link[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/link>/i);
      if (m2) return m2[1].trim();
      // guid as fallback
      return getTag('guid');
    };

    const title = getTag('title');
    const url = getLinkTag();
    const description = getTag('description');
    const pubDate = getTag('pubDate') || getTag('dc:date') || getTag('pubdate');

    if (title && url && url.startsWith('http')) {
      let publishedAt;
      try {
        publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
      } catch {
        publishedAt = new Date().toISOString();
      }

      items.push({
        sourceId,
        sourceName,
        category,
        title: title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").slice(0, 250),
        url: url.trim(),
        originalDescription: description.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').slice(0, 600),
        publishedAt,
        cachedAt: new Date().toISOString(),
      });
    }
  }

  return items.slice(0, 8);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try { body = await req.json(); } catch { /* no body */ }

    const forceRefresh = body.forceRefresh || false;
    const limit = body.limit || 20;
    const REFRESH_MINUTES = 30;

    // Check cache first (always attempt — NEWSAPI_KEY not required)
    if (!forceRefresh) {
      try {
        const cached = await base44.entities.MedicalNewsCache.list('-publishedAt', limit);
        if (cached && cached.length > 0) {
          const freshCutoff = new Date(Date.now() - REFRESH_MINUTES * 60 * 1000);
          const mostRecent = new Date(cached[0].cachedAt || cached[0].created_date);
          if (mostRecent > freshCutoff) {
            return Response.json({ articles: cached, fromCache: true, fetchedAt: new Date().toISOString() });
          }
        }
      } catch { /* cache miss — continue to fetch */ }
    }

    // Fetch all RSS sources in parallel
    const results = await Promise.allSettled(
      RSS_SOURCES.map(async (src) => {
        const res = await fetch(src.url, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'User-Agent': 'ClinAI-MedicalNews/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) throw new Error(`${src.id} failed: ${res.status}`);
        const xml = await res.text();
        return parseRSSFeed(xml, src.id, src.name, src.category);
      })
    );

    // Also try NewsAPI if key is set (optional — skip silently if not configured)
    let newsApiArticles = [];
    let newsApiKey;
    try { newsApiKey = Deno.env.get("NEWSAPI_KEY"); } catch { newsApiKey = null; }
    if (newsApiKey) {
      try {
        const url = `https://newsapi.org/v2/everything?q=medicine+OR+clinical+OR+"FDA+approval"+OR+"clinical+trial"&language=en&sortBy=publishedAt&pageSize=8&apiKey=${newsApiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          newsApiArticles = (data.articles || [])
            .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
            .map(a => ({
              sourceId: 'newsapi_medical',
              sourceName: a.source?.name || 'NewsAPI',
              category: 'Medical News',
              title: a.title.slice(0, 250),
              url: a.url,
              originalDescription: (a.description || '').replace(/<[^>]+>/g, '').slice(0, 600),
              imageUrl: a.urlToImage || null,
              author: a.author || null,
              publishedAt: a.publishedAt || new Date().toISOString(),
              cachedAt: new Date().toISOString(),
            }));
        }
      } catch { /* skip newsapi */ }
    }

    // Collect successful RSS results
    const rssArticles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Merge + deduplicate by URL
    const allArticles = [...rssArticles, ...newsApiArticles];
    const seen = new Set();
    const unique = allArticles.filter(a => {
      if (!a.url || seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    // Sort by publishedAt desc
    unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const toSave = unique.slice(0, limit);

    // Persist to cache (clear old, insert new) — best effort
    try {
      const existing = await base44.entities.MedicalNewsCache.list('-publishedAt', 100);
      await Promise.all(existing.map(e => base44.entities.MedicalNewsCache.delete(e.id)));
    } catch { /* ignore */ }

    try {
      await Promise.all(toSave.map(a => base44.entities.MedicalNewsCache.create(a)));
    } catch { /* ignore cache write errors */ }

    return Response.json({
      articles: toSave,
      fetchedAt: new Date().toISOString(),
      sourceCount: new Set(toSave.map(a => a.sourceId)).size,
      fromCache: false
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});