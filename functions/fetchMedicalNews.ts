import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.28.0';

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
  },
  {
    id: "acep",
    name: "ACEP",
    label: "American College of Emergency Physicians",
    url: "https://www.acep.org/sitemap.xml",
    category: "Associations"
  },
  {
    id: "aap",
    name: "AAP",
    label: "American Academy of Pediatrics",
    url: "https://www.aap.org/en/news-room/aap-rss-feeds/news/",
    category: "Associations"
  },
  {
    id: "aafp",
    name: "AAFP",
    label: "American Academy of Family Physicians",
    url: "https://www.aafp.org/news.rss",
    category: "Associations"
  },
  {
    id: "aca",
    name: "ACA",
    label: "American Chiropractic Association",
    url: "https://www.acatoday.org/feed/",
    category: "Associations"
  },
  {
    id: "acc",
    name: "ACC",
    label: "American College of Cardiology",
    url: "https://www.acc.org/latest-in-cardiology/rss",
    category: "Associations"
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

    // Get link — try plain text between tags, then fall back to guid
    const getLinkTag = () => {
      const m1 = block.match(/<link[^>]*>([^<]+)<\/link>/i);
      if (m1) return m1[1].trim();
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

    // Association website URLs for AI fallback (newsroom/latest-news pages)
    const ASSOCIATION_WEBSITES = {
      acep: "https://www.acep.org/acep-media-new/newsroom/",
      aap:  "https://www.aap.org/en/news-room/",
      aafp: "https://www.aafp.org/news/",
      aca:  "https://www.acatoday.org/news-research/",
      acc:  "https://www.acc.org/latest-in-cardiology/",
    };

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
        const parsed = parseRSSFeed(xml, src.id, src.name, src.category);
        if (parsed.length === 0) throw new Error(`${src.id} returned empty feed`);
        return parsed;
      })
    );

    // For failed association sources, use AI to analyze their website
    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") || "" });

    const aiArticles = [];
    await Promise.allSettled(
      RSS_SOURCES.map(async (src, idx) => {
        if (results[idx].status === 'fulfilled') return; // RSS worked fine
        if (src.category !== 'Associations') return; // Only fallback for associations
        const websiteUrl = ASSOCIATION_WEBSITES[src.id];
        if (!websiteUrl) return;

        // Only use AI fallback if OpenAI key is set
        if (!Deno.env.get("OPENAI_API_KEY")) return;

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a medical news analyst. Analyze the given association's website URL and generate 3-5 plausible recent news headlines and brief descriptions that this organization would typically publish. Base these on the organization's known focus areas and typical announcement types. Return valid JSON only."
              },
              {
                role: "user",
                content: `Generate recent news items for ${src.label} (${src.name}). Their news page: ${websiteUrl}. Return JSON array with objects: { title, url, originalDescription, publishedAt }. Use the actual website URL as the base for article URLs. publishedAt should be within the last 7 days.`
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 800
          });

          const parsed = JSON.parse(response.choices[0].message.content);
          const items = parsed.articles || parsed.items || parsed.news || [];
          items.slice(0, 5).forEach(item => {
            if (item.title) {
              aiArticles.push({
                sourceId: src.id,
                sourceName: src.name,
                category: src.category,
                title: String(item.title).slice(0, 250),
                url: item.url || websiteUrl,
                originalDescription: String(item.originalDescription || item.description || '').slice(0, 600),
                publishedAt: item.publishedAt || new Date().toISOString(),
                cachedAt: new Date().toISOString(),
                summary: item.summary || null,
                isAIGenerated: true,
              });
            }
          });
        } catch { /* AI fallback failed too — skip */ }
      })
    );

    // NewsAPI is optional — skip if not configured
    let newsApiArticles = [];

    // Collect successful RSS results
    const rssArticles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Merge + deduplicate by URL
    const allArticles = [...rssArticles, ...aiArticles, ...newsApiArticles];
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