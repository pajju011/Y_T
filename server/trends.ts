import { XMLParser } from 'fast-xml-parser';
import { db, LiveTrend } from './db.js';

export interface RawTrendQuery {
  niche?: string;
  keywords?: string[];
  searchQuery?: string;
}

export class TrendDiscoveryService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]*>?/gm, '')
      .trim();
  }

  /**
   * Fetches real-time RSS trend feeds (Google Daily Trends or Google News Search)
   */
  public async discoverTrends(niche: string = 'Tech & AI', keywords: string[] = []): Promise<LiveTrend[]> {
    const isGoogleTrendsDirect = niche === 'all' || niche.toLowerCase().includes('google trends');

    if (isGoogleTrendsDirect) {
      return this.fetchDailyGoogleTrends();
    }

    return this.fetchNicheGoogleNews(niche, keywords);
  }

  /**
   * Scrapes official Google Daily Search Trends RSS feed (US/Global)
   */
  public async fetchDailyGoogleTrends(): Promise<LiveTrend[]> {
    const url = 'https://trends.google.com/trending/rss?geo=US';
    try {
      console.log('[Trend Discovery] Fetching official Google Daily Trends RSS...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Google Trends RSS error ${response.status}`);
      }

      const xmlText = await response.text();
      const jsonObj = this.parser.parse(xmlText);
      const items = jsonObj?.rss?.channel?.item || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      const trends: LiveTrend[] = itemsArray.slice(0, 15).map((item: any, index: number) => {
        const title = this.decodeHtmlEntities(item.title || 'Trending Search');
        const approxTraffic = item['ht:approx_traffic'] || '10K+';
        const newsItems = item['ht:news_item'];
        const firstNews = Array.isArray(newsItems) ? newsItems[0] : newsItems;
        const snippetRaw = firstNews?.['ht:news_item_title'] || item.description || `Search volume spiking at ${approxTraffic} searches today.`;
        const snippet = this.decodeHtmlEntities(snippetRaw);
        const source = firstNews?.['ht:news_item_source'] || item['ht:picture_source'] || 'Google Trends';
        const link = firstNews?.['ht:news_item_url'] || item.link || 'https://trends.google.com';

        return {
          id: 'trend-gtrend-' + Date.now() + '-' + index,
          title: `Trending: ${title} (${approxTraffic})`,
          snippet: snippet.slice(0, 220),
          source: String(source),
          url: link,
          niche: 'Google Daily Trends',
          discoveredAt: new Date().toISOString(),
          relevanceScore: Math.min(99, 90 + Math.floor(Math.random() * 9)),
          generatedClipId: null
        };
      });

      if (trends.length > 0) {
        db.addLiveTrends(trends);
        db.addAuditLog('google_trends_polled', `Polled ${trends.length} daily search trends from Google Trends`);
      }
      return trends;
    } catch (err: any) {
      console.warn('[Trend Discovery] Google Trends RSS failed, falling back to Google News:', err.message);
      return this.fetchNicheGoogleNews('Tech & AI', ['AI', 'Tech', 'Innovation']);
    }
  }

  /**
   * Fetches Google News RSS for any niche & keywords
   */
  public async fetchNicheGoogleNews(niche: string, keywords: string[] = []): Promise<LiveTrend[]> {
    const queryParts = [niche];
    if (keywords && keywords.length > 0) {
      queryParts.push(...keywords.slice(0, 3));
    }
    const query = queryParts.join(' OR ');
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    try {
      console.log(`[Trend Discovery] Fetching Google News RSS feed for "${niche}"...`);
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Google News RSS responded with status ${response.status}`);
      }

      const xmlText = await response.text();
      const jsonObj = this.parser.parse(xmlText);
      const rawItems = jsonObj?.rss?.channel?.item;

      if (!rawItems) {
        console.warn('[Trend Discovery] No items found in RSS response');
        return [];
      }

      const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];
      const trends: LiveTrend[] = itemsArray.slice(0, 15).map((item: any, index: number) => {
        const rawTitle = item.title || 'Untitled Trend';
        const titleParts = rawTitle.split(' - ');
        const source = titleParts.length > 1 ? titleParts.pop() : (item.source || 'Verified News');
        const cleanTitle = this.decodeHtmlEntities(titleParts.join(' - '));

        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const hoursAgo = Math.max(1, (Date.now() - pubDate.getTime()) / (1000 * 60 * 60));
        const relevanceScore = Math.min(98, Math.max(78, Math.round(98 - (hoursAgo * 0.8))));

        const rawSnippet = item.description || cleanTitle;
        const cleanSnippet = this.decodeHtmlEntities(rawSnippet);

        return {
          id: 'trend-news-' + Date.now() + '-' + index,
          title: cleanTitle,
          snippet: cleanSnippet.slice(0, 220),
          source: this.decodeHtmlEntities(String(source)),
          url: item.link || '',
          niche: niche,
          discoveredAt: new Date().toISOString(),
          relevanceScore,
          generatedClipId: null
        };
      });

      db.addLiveTrends(trends);
      db.addAuditLog('trends_discovered', `Discovered ${trends.length} live trends for niche "${niche}"`);
      return trends;
    } catch (err: any) {
      console.error('[Trend Discovery] Failed to fetch live trends:', err);
      return [];
    }
  }

  /**
   * Performs an instant search for arbitrary live topic
   */
  public async searchLiveTopic(topic: string): Promise<LiveTrend[]> {
    return this.fetchNicheGoogleNews(topic, []);
  }
}

export const trendDiscoveryService = new TrendDiscoveryService();
