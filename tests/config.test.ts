import { describe, it, expect } from 'vitest';
import { loadConfig, parseFeedUrls } from '../src/modules/config.js';

const VALID = {
  BLUESKY_HANDLE: 'bot.bsky.social',
  BLUESKY_APP_PASSWORD: 'xxxx-xxxx-xxxx-xxxx',
  ANTHROPIC_API_KEY: 'sk-ant-test-xxx',
} as const;

describe('loadConfig', () => {
  it('必須 env が無いと例外', () => {
    expect(() => loadConfig({})).toThrowError(/BLUESKY_HANDLE/);
  });

  it('ANTHROPIC_API_KEY が無いと例外', () => {
    expect(() =>
      loadConfig({ BLUESKY_HANDLE: 'a', BLUESKY_APP_PASSWORD: 'b' })
    ).toThrowError(/ANTHROPIC_API_KEY/);
  });

  it('デフォルトのフィードリストが適用される', () => {
    const c = loadConfig({ ...VALID });
    expect(c.feedSources.length).toBeGreaterThanOrEqual(9);
    expect(c.feedSources.map((s) => s.name)).toEqual(
      expect.arrayContaining([
        'NEJM',
        'BMJ',
        'The Lancet',
        'Nature',
        'WHO',
        'Science Daily',
        'STAT News',
        'MedPage Today',
        'CBニュース',
      ])
    );
    expect(c.maxPostsPerRun).toBe(1);
    expect(c.disableKeywordFilter).toBe(false);
  });

  it('MED_FEED_URLS を上書きできる', () => {
    const c = loadConfig({
      ...VALID,
      MED_FEED_URLS:
        'https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss,https://www.bmj.com/rss/recent',
    });
    expect(c.feedSources).toHaveLength(2);
    expect(c.feedSources[0]?.name).toBe('NEJM');
    expect(c.feedSources[1]?.name).toBe('BMJ');
  });

  it('DISABLE_KEYWORD_FILTER=true でフィルタ無効化', () => {
    const c = loadConfig({ ...VALID, DISABLE_KEYWORD_FILTER: 'true' });
    expect(c.disableKeywordFilter).toBe(true);
  });

  it('MAX_STORED_URLS のデフォルトは 1000', () => {
    const c = loadConfig({ ...VALID });
    expect(c.maxStoredUrls).toBe(1000);
  });

  it('MAX_STORED_URLS を上書きできる', () => {
    const c = loadConfig({ ...VALID, MAX_STORED_URLS: '500' });
    expect(c.maxStoredUrls).toBe(500);
  });

  it('MAX_STORED_URLS が不正なら例外', () => {
    expect(() =>
      loadConfig({ ...VALID, MAX_STORED_URLS: 'abc' })
    ).toThrowError(/MAX_STORED_URLS/);
    expect(() =>
      loadConfig({ ...VALID, MAX_STORED_URLS: '0' })
    ).toThrowError(/MAX_STORED_URLS/);
  });
});

describe('parseFeedUrls', () => {
  it('未指定ならデフォルトを使う', () => {
    const sources = parseFeedUrls(undefined);
    expect(sources.length).toBeGreaterThanOrEqual(3);
  });

  it('カンマ区切りでパース', () => {
    const sources = parseFeedUrls(
      'https://example.com/a.rss,https://example.com/b.rss'
    );
    expect(sources).toHaveLength(2);
    expect(sources[0]?.url).toBe('https://example.com/a.rss');
  });

  it('不正な URL は例外', () => {
    expect(() => parseFeedUrls('not a url')).toThrowError(/Invalid/);
  });

  it('http(s) 以外は例外', () => {
    expect(() => parseFeedUrls('ftp://example.com/')).toThrowError(/http/);
  });

  it('既知ホストはきれいな名前にマップ', () => {
    expect(
      parseFeedUrls('https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss')[0]?.name
    ).toBe('NEJM');
    expect(
      parseFeedUrls('https://www.bmj.com/rss/recent')[0]?.name
    ).toBe('BMJ');
    expect(
      parseFeedUrls('https://www.thelancet.com/rssfeed/lancet_online.xml')[0]?.name
    ).toBe('The Lancet');
    expect(
      parseFeedUrls('https://www.who.int/feeds/entity/news/en/rss.xml')[0]?.name
    ).toBe('WHO');
    expect(
      parseFeedUrls('https://www.cbnews.jp/news/rss.xml')[0]?.name
    ).toBe('CBニュース');
  });

  it('未知ホストは hostname をそのまま使う', () => {
    expect(parseFeedUrls('https://random.example.com/feed')[0]?.name).toBe(
      'random.example.com'
    );
  });
});
