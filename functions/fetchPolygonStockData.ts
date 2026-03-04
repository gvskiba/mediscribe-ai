import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('POLYGON_IO_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Polygon.io API key not configured' }, { status: 500 });
    }

    // Fetch previous day close for each ticker using free-tier /v2/aggs endpoint
    const tickers = ['SPY', 'QQQ', 'DIA', 'AAPL', 'MSFT', 'NVDA'];

    // Get yesterday's date (skip weekends)
    const today = new Date();
    let prevDate = new Date(today);
    prevDate.setDate(prevDate.getDate() - 1);
    // If Sunday, go back to Friday
    if (prevDate.getDay() === 0) prevDate.setDate(prevDate.getDate() - 2);
    // If Saturday, go back to Friday
    if (prevDate.getDay() === 6) prevDate.setDate(prevDate.getDate() - 1);
    const dateStr = prevDate.toISOString().split('T')[0];

    let stocks = [];

    // Fetch each ticker's previous close using /v2/aggs/ticker/{ticker}/prev endpoint
    const stockResults = await Promise.allSettled(
      tickers.map(ticker =>
        fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`)
          .then(r => r.json())
      )
    );

    for (let i = 0; i < tickers.length; i++) {
      const result = stockResults[i];
      if (result.status === 'fulfilled' && result.value?.results?.length > 0) {
        const bar = result.value.results[0];
        const prevClose = bar.o || bar.c;
        const changePercent = prevClose ? ((bar.c - prevClose) / prevClose) * 100 : 0;
        stocks.push({
          ticker: tickers[i],
          name: tickers[i],
          price: bar.c || 0,
          open: bar.o || 0,
          high: bar.h || 0,
          low: bar.l || 0,
          prevClose: prevClose,
          change: bar.c - prevClose,
          changePercent: changePercent,
          volume: bar.v || 0,
        });
      }
    }

    // Fetch market-wide news
    const newsUrl = `https://api.polygon.io/v2/reference/news?query=stock+market+NYSE+NASDAQ&limit=8&apiKey=${apiKey}`;
    const newsRes = await fetch(newsUrl);
    let news = [];
    if (newsRes.ok) {
      const newsData = await newsRes.json();
      news = (newsData.results || []).map(item => ({
        title: item.title,
        description: item.description || '',
        url: item.article_url,
        source: item.publisher?.name || 'Polygon.io',
        published_at: item.published_utc,
        image_url: item.image_url || null,
        tickers: item.tickers || [],
      }));
    }

    return Response.json({ stocks, news });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});