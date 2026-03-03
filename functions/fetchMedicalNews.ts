import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const RSS_SOURCES = [
  // ── Public Health / Gov ──────────────────────────────────────────────────────
  { id: "who_news",    name: "WHO",              url: "https://www.who.int/rss-feeds/news-english.xml",                                           category: "Global Health" },
  { id: "cdc_news",    name: "CDC",              url: "https://tools.cdc.gov/api/v2/resources/media/132608.rss",                                  category: "Public Health" },
  { id: "nih_news",    name: "NIH",              url: "https://www.nih.gov/news-events/news-releases.rss",                                       category: "Research" },
  // ── Clinical Journals (RSS confirmed) ───────────────────────────────────────
  { id: "nejm",        name: "NEJM",             url: "https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss",                         category: "Clinical Research" },
  { id: "lancet",      name: "Lancet",           url: "https://www.thelancet.com/rssfeed/lancet_online.xml",                                     category: "Clinical Research" },
  { id: "bmj",         name: "BMJ",              url: "https://www.bmj.com/rss/current.xml",                                                     category: "Clinical Research" },
  // ── JAMA Network (only main feed has confirmed working RSS) ─────────────────
  { id: "jama",        name: "JAMA",             url: "https://jamanetwork.com/rss/site_3/67.xml",                                               category: "JAMA Network" },
  { id: "jama_open",   name: "JAMA Open",        url: "https://jamanetwork.com/rss/site_214/mostReadArticles.xml",                               category: "JAMA Network" },
  // ── AHA Journals ────────────────────────────────────────────────────────────
  { id: "aha_circ",    name: "Circulation",      url: "https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=circ",                  category: "AHA Journals" },
  { id: "aha_jaha",    name: "JAHA",             url: "https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=jaha",                  category: "AHA Journals" },
  { id: "aha_str",     name: "Stroke (AHA)",     url: "https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=str",                   category: "AHA Journals" },
  { id: "aha_hyp",     name: "Hypertension",     url: "https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=hyp",                   category: "AHA Journals" },
  // ── Medscape (confirmed working feed) ───────────────────────────────────────
  { id: "medscape",    name: "Medscape",         url: "https://www.medscape.com/cx/rssfeeds/2700.xml",                                           category: "Clinical News" },
  // ── Medical News / General ──────────────────────────────────────────────────
  { id: "medlineplus", name: "MedlinePlus",      url: "https://medlineplus.gov/xml/mplus_health_news_english.xml",                              category: "Health News" },
  { id: "medxpress",   name: "Medical Xpress",   url: "https://medicalxpress.com/rss-feed/",                                                     category: "Medical News" },
  { id: "statnews",    name: "STAT News",        url: "https://www.statnews.com/feed/",                                                          category: "Medical News" },
  { id: "healio",      name: "Healio",           url: "https://www.healio.com/sws/feed/news/all",                                               category: "Medical News" },
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

  return items.slice(0, 6);
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
    const limit = body.limit || 60;
    const REFRESH_MINUTES = 30;

    // Check cache first
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
        const parsed = parseRSSFeed(xml, src.id, src.name, src.category);
        if (parsed.length === 0) throw new Error(`${src.id} returned empty feed`);
        return parsed;
      })
    );

    // Optional: PubMed via API key
    const pubmedArticles = [];
    const PUBMED_API_KEY = Deno.env.get("PUBMED_API_KEY");
    if (PUBMED_API_KEY) {
      try {
        const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=medicine[mesh]+AND+clinical+trial[pt]&sort=date&retmax=8&retmode=json&api_key=${PUBMED_API_KEY}`, { signal: AbortSignal.timeout(8000) });
        const searchData = await searchRes.json();
        const pmids = searchData.esearchresult?.idlist ?? [];
        if (pmids.length) {
          const summaryRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json&api_key=${PUBMED_API_KEY}`, { signal: AbortSignal.timeout(8000) });
          const summaryData = await summaryRes.json();
          pmids.forEach(pmid => {
            const art = summaryData.result?.[pmid];
            if (art?.title) pubmedArticles.push({
              sourceId: 'pubmed_latest', sourceName: 'PubMed', category: 'Research',
              title: art.title.slice(0, 250),
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
              originalDescription: `${art.fulljournalname || ''} · ${art.pubdate || ''}`.slice(0, 600),
              publishedAt: art.pubdate ? new Date(art.pubdate).toISOString() : new Date().toISOString(),
              cachedAt: new Date().toISOString(),
            });
          });
        }
      } catch { /* ignore pubmed errors */ }
    }

    // Optional: NewsAPI
    const newsApiArticles = [];
    const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY");
    if (NEWSAPI_KEY) {
      try {
        const res = await fetch(`https://newsapi.org/v2/everything?q=medicine+OR+clinical+OR+drug+approval+OR+FDA&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWSAPI_KEY}`, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        (data.articles || []).forEach(a => {
          if (a.title && a.url && !a.title.includes('[Removed]')) {
            newsApiArticles.push({
              sourceId: 'newsapi_medical', sourceName: a.source?.name || 'NewsAPI', category: 'Medical News',
              title: a.title.slice(0, 250),
              url: a.url,
              originalDescription: (a.description || '').slice(0, 600),
              imageUrl: a.urlToImage || null,
              author: a.author || null,
              publishedAt: a.publishedAt || new Date().toISOString(),
              cachedAt: new Date().toISOString(),
            });
          }
        });
      } catch { /* ignore newsapi errors */ }
    }

    const rssArticles = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
    const allArticles = [...rssArticles, ...pubmedArticles, ...newsApiArticles];

    const seen = new Set();
    const unique = allArticles.filter(a => {
      if (!a.url || seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const toSave = unique.slice(0, limit);

    // Persist to cache
    try {
      const existing = await base44.entities.MedicalNewsCache.list('-publishedAt', 200);
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