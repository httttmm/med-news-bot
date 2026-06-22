import Parser from 'rss-parser';
import type { FeedSource, MedArticle } from '../types/index.js';
import { detectLanguage } from './languageDetect.js';

interface FeedItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  guid?: string;
}

export interface RssFetcherOptions {
  timeoutMs?: number;
  /** テスト用に差し替え可能 */
  parser?: Pick<Parser<unknown, FeedItem>, 'parseURL'>;
}

export interface RssFetcher {
  /**
   * 全ソースを並列に取得・マージし、新着順に並べた MedArticle[] を返す。
   * 一部ソースがエラーでも他のソースは取得される (Promise.allSettled)。
   */
  fetchAll(sources: FeedSource[]): Promise<MedArticle[]>;
}

/**
 * 複数の RSS フィードを並列取得して 1 本にマージするフェッチャー。
 */
export function createRssFetcher(options: RssFetcherOptions = {}): RssFetcher {
  const timeoutMs = options.timeoutMs ?? 15000;
  const parser: Pick<Parser<unknown, FeedItem>, 'parseURL'> =
    options.parser ??
    new Parser<unknown, FeedItem>({
      timeout: timeoutMs,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; med-news-bot/0.1; +https://github.com/httttmm/med-news-bot)',
      },
    });

  return {
    async fetchAll(sources: FeedSource[]): Promise<MedArticle[]> {
      const results = await Promise.allSettled(
        sources.map(async (source) => {
          const feed = await parser.parseURL(source.url);
          const items = feed.items ?? [];
          return items
            .map((item) => itemToArticle(item, source))
            .filter((a): a is MedArticle => a !== null);
        })
      );

      const all: MedArticle[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          all.push(...r.value);
        }
      }
      return sortByDateDesc(dedupeByUrl(all));
    },
  };
}

function itemToArticle(item: FeedItem, source: FeedSource): MedArticle | null {
  const link = (item.link ?? '').trim();
  const title = (item.title ?? '').trim();
  if (!link || !title) return null;
  const url = normalizeUrl(link);
  if (!url) return null;
  const contentSnippet = (item.contentSnippet ?? '').trim() || undefined;
  const language = detectLanguage(`${title} ${contentSnippet ?? ''}`);
  return {
    title,
    url,
    contentSnippet,
    isoDate: item.isoDate,
    source,
    language,
  };
}

export function normalizeUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    u.hash = '';
    const keysToDelete: string[] = [];
    u.searchParams.forEach((_v, k) => {
      if (k.toLowerCase().startsWith('utm_')) {
        keysToDelete.push(k);
      }
    });
    for (const k of keysToDelete) {
      u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return null;
  }
}

function dedupeByUrl(articles: MedArticle[]): MedArticle[] {
  const seen = new Set<string>();
  const out: MedArticle[] = [];
  for (const a of articles) {
    if (seen.has(a.url)) continue;
    seen.add(a.url);
    out.push(a);
  }
  return out;
}

function sortByDateDesc(articles: MedArticle[]): MedArticle[] {
  return [...articles].sort((a, b) => {
    const ta = a.isoDate ? Date.parse(a.isoDate) : 0;
    const tb = b.isoDate ? Date.parse(b.isoDate) : 0;
    return tb - ta;
  });
}
