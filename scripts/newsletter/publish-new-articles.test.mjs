import assert from 'node:assert/strict';
import test from 'node:test';

import {
  broadcastContainsArticleUrl,
  buildBroadcastPayload,
  expectedArticleUrl,
  findAddedArticleFiles,
  findRssItem,
  isPublicArticle,
  kitRequest,
  listKitBroadcasts,
  loadPublicArticles,
  normalizeArticleUrl,
  parseFrontMatter,
  parseRssItems,
  waitForRssItem
} from './lib.mjs';
import { parseArguments } from './publish-new-articles.mjs';

test('parses the simple article front matter used by the site', () => {
  const values = parseFrontMatter(`---\ntitle: "A useful article"\ndraft: FALSE # publish this\nprivate: true\nslug: 'custom-slug'\n---\n\nBody`);
  assert.deepEqual(values, {
    title: 'A useful article',
    draft: false,
    private: true,
    slug: 'custom-slug'
  });
});

test('filters drafts, private pages, future publish dates, and expired pages', () => {
  const now = new Date('2026-08-30T12:00:00Z');
  assert.equal(isPublicArticle({ draft: false }, now), true);
  assert.equal(isPublicArticle({ draft: true }, now), false);
  assert.equal(isPublicArticle({ private: true }, now), false);
  assert.equal(isPublicArticle({ publishdate: '2026-08-31T00:00:00Z' }, now), false);
  assert.equal(isPublicArticle({ date: '2026-08-31T00:00:00Z' }, now), false);
  assert.equal(isPublicArticle({ expirydate: '2026-08-29T00:00:00Z' }, now), false);
});

test('finds only added article bundle index files', () => {
  const files = findAddedArticleFiles({
    before: 'a'.repeat(40),
    after: 'b'.repeat(40),
    runGit: () => [
      'content/articles/new-one/index.md',
      'content/articles/new-one/featured.jpg',
      'content/articles/nested/path/index.md',
      'content/sidequests/example/index.md',
      ''
    ].join('\n')
  });
  assert.deepEqual(files, ['content/articles/new-one/index.md']);
});

test('refuses an all-zero before SHA to prevent a mass send', () => {
  assert.throws(() => findAddedArticleFiles({
    before: '0'.repeat(40),
    after: 'b'.repeat(40),
    runGit: () => ''
  }), /Refusing to treat every existing article/);
});

test('loads public articles and respects explicit URLs', () => {
  const source = `---\ntitle: Test\ndraft: false\nurl: /articles/better-address/\n---\nBody`;
  const articles = loadPublicArticles(['content/articles/source-folder/index.md'], {
    cwd: '/repo',
    siteUrl: 'https://vidunwedagedera.com/',
    readFile: () => source
  });
  assert.deepEqual(articles, [{
    filePath: 'content/articles/source-folder/index.md',
    title: 'Test',
    expectedUrl: 'https://vidunwedagedera.com/articles/better-address/'
  }]);
});

test('normalises article URLs and derives the default bundle URL', () => {
  assert.equal(
    normalizeArticleUrl('https://VIDUNWEDAGEDERA.com/articles/example/index.html?source=test#top'),
    'https://vidunwedagedera.com/articles/example/'
  );
  assert.equal(
    expectedArticleUrl('content/articles/example/index.md', {}, 'https://vidunwedagedera.com/'),
    'https://vidunwedagedera.com/articles/example/'
  );
});

test('parses RSS items and matches an article URL', () => {
  const xml = `<?xml version="1.0"?><rss><channel><item>
    <title>Learning &amp; memory</title>
    <link>https://vidunwedagedera.com/articles/learning/</link>
    <pubDate>Sun, 30 Aug 2026 10:00:00 +0000</pubDate>
    <description>A short &lt;strong&gt;preview&lt;/strong&gt;&amp;hellip; It&amp;rsquo;s useful.</description>
  </item></channel></rss>`;
  const items = parseRssItems(xml);
  assert.deepEqual(items, [{
    title: 'Learning & memory',
    link: 'https://vidunwedagedera.com/articles/learning/',
    pubDate: 'Sun, 30 Aug 2026 10:00:00 +0000',
    description: 'A short preview… It’s useful.'
  }]);
  assert.equal(findRssItem(items, 'https://vidunwedagedera.com/articles/learning')?.title, 'Learning & memory');
});

test('waits for the live RSS item without sleeping after a successful retry', async () => {
  const responses = [
    '<rss><channel></channel></rss>',
    '<rss><channel><item><title>Ready</title><link>https://vidunwedagedera.com/articles/ready/</link><description>Preview</description></item></channel></rss>'
  ];
  let fetches = 0;
  let sleeps = 0;
  const item = await waitForRssItem('https://vidunwedagedera.com/articles/ready/', {
    rssUrl: 'https://vidunwedagedera.com/articles/index.xml',
    attempts: 2,
    intervalMs: 1,
    fetchImpl: async () => ({ ok: true, text: async () => responses[fetches++] }),
    sleepImpl: async () => { sleeps += 1; }
  });
  assert.equal(item.title, 'Ready');
  assert.equal(fetches, 2);
  assert.equal(sleeps, 1);
});

test('paginates through Kit broadcasts with cursor pagination', async () => {
  const paths = [];
  const broadcasts = await listKitBroadcasts({
    apiKey: 'test-key',
    request: async (path) => {
      paths.push(path);
      if (paths.length === 1) {
        return {
          broadcasts: [{ id: 2 }],
          pagination: { has_next_page: true, end_cursor: 'next==' }
        };
      }
      return {
        broadcasts: [{ id: 1 }],
        pagination: { has_next_page: false }
      };
    }
  });
  assert.deepEqual(broadcasts.map(({ id }) => id), [2, 1]);
  assert.match(paths[1], /after=next%3D%3D/);
});

test('Kit requests authenticate by header and retry transient network failures', async () => {
  const requests = [];
  let sleeps = 0;
  const payload = await kitRequest('/broadcasts', {
    apiKey: 'not-a-real-key',
    attempts: 2,
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      if (requests.length === 1) throw new Error('temporary network failure');
      return { ok: true, status: 200, json: async () => ({ broadcasts: [] }) };
    },
    sleepImpl: async () => { sleeps += 1; }
  });
  assert.deepEqual(payload, { broadcasts: [] });
  assert.equal(requests[1].options.headers['X-Kit-Api-Key'], 'not-a-real-key');
  assert.doesNotMatch(requests[1].url, /not-a-real-key/);
  assert.equal(sleeps, 1);
});

test('deduplicates broadcasts by the article URL in description or content', () => {
  const url = 'https://vidunwedagedera.com/articles/example/';
  assert.equal(broadcastContainsArticleUrl({ description: `Automated | ${url}` }, url), true);
  assert.equal(broadcastContainsArticleUrl({ content: `<a href="${url}">Read</a>` }, url), true);
  assert.equal(broadcastContainsArticleUrl({ description: 'A different article' }, url), false);
});

test('builds a concise all-subscriber scheduled broadcast and escapes content', () => {
  const payload = buildBroadcastPayload({
    title: 'Learning <quickly>',
    link: 'https://vidunwedagedera.com/articles/learning/',
    pubDate: 'Sun, 30 Aug 2026 10:00:00 +0000',
    description: 'Use recall & feedback.'
  }, { sendAt: '2026-08-30T12:30:00Z' });

  assert.equal(payload.public, false);
  assert.equal(payload.send_at, '2026-08-30T12:30:00.000Z');
  assert.deepEqual(payload.subscriber_filter, [{ all: [{ type: 'all_subscribers' }], any: null, none: null }]);
  assert.match(payload.description, /https:\/\/vidunwedagedera\.com\/articles\/learning\//);
  assert.match(payload.content, /Learning &lt;quickly&gt;/);
  assert.match(payload.content, /Use recall &amp; feedback\./);
});

test('parses CLI and environment settings without exposing an API key', () => {
  const options = parseArguments(['--before', 'a', '--after', 'b', '--dry-run'], {
    NEWSLETTER_SEND_DELAY_MINUTES: '12'
  });
  assert.equal(options.before, 'a');
  assert.equal(options.after, 'b');
  assert.equal(options.dryRun, true);
  assert.equal(options.sendDelayMinutes, 12);
});
