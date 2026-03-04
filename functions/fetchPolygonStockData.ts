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

    // Fetch snapshot for major market tickers
    const tickers = ['SPY', 'QQQ', 'DIA', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL'];
    const tickerStr = tickers.join(',');

    const snapshotUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickerStr}&apiKey=${apiKey}`;
    const snapshotRes = await fetch(snapshotUrl);

    let stocks = [];
    if (snapshotRes.ok) {
      const snapshotData = await snapshotRes.json();
      stocks = (snapshotData.tickers || []).map(t => ({
        ticker: t.ticker,
        name: t.ticker,
        price: t.day?.c || t.prevDay?.c || 0,
        open: t.day?.o || t.prevDay?.o || 0,
        high: t.day?.h || t.prevDay?.h || 0,
        low: t.day?.l || t.prevDay?.l || 0,
        prevClose: t.prevDay?.c || 0,
        change: t.todaysChange || 0,
        changePercent: t.todaysChangePerc || 0,
        volume: t.day?.v || 0,
      }));
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