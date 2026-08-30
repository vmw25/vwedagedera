import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const KIT_API_BASE_URL = 'https://api.kit.com/v4';
export const ARTICLE_PATH_PATTERN = /^content\/articles\/([^/]+)\/index\.md$/;

const XML_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '…',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
  rdquo: '”',
  rsquo: '’'
};

function parseScalar(rawValue) {
  const trimmed = rawValue.trim();
  const value = trimmed.startsWith('"') || trimmed.startsWith("'")
    ? trimmed
    : trimmed.replace(/\s+#.*$/, '').trim();
  const lowerValue = value.toLowerCase();

  if (value === '') return '';
  if (lowerValue === 'true') return true;
  if (lowerValue === 'false') return false;
  if (lowerValue === 'null' || value === '~') return null;

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

export function parseFrontMatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|\s*$)/);
  if (!match) return {};

  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s/.test(line) || /^\s*(?:#|$)/.test(line)) continue;
    const field = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!field) continue;
    values[field[1].toLowerCase()] = parseScalar(field[2]);
  }
  return values;
}

function parseDate(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function isPublicArticle(frontMatter, now = new Date()) {
  if (frontMatter.draft === true || frontMatter.private === true) return false;

  const publishDate = parseDate(frontMatter.publishdate ?? frontMatter.date);
  if (publishDate && publishDate > now) return false;

  const expiryDate = parseDate(frontMatter.expirydate);
  if (expiryDate && expiryDate <= now) return false;

  return true;
}

export function normalizeArticleUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/index\.html$/i, '/');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

export function expectedArticleUrl(filePath, frontMatter, siteUrl) {
  const pathMatch = filePath.match(ARTICLE_PATH_PATTERN);
  if (!pathMatch) throw new Error(`Unsupported article path: ${filePath}`);

  if (typeof frontMatter.url === 'string' && frontMatter.url.trim()) {
    return normalizeArticleUrl(new URL(frontMatter.url, siteUrl).toString());
  }

  const slug = typeof frontMatter.slug === 'string' && frontMatter.slug.trim()
    ? frontMatter.slug.trim()
    : pathMatch[1];

  return normalizeArticleUrl(new URL(`articles/${slug}/`, siteUrl).toString());
}

export function findAddedArticleFiles({ before, after, cwd = process.cwd(), runGit } = {}) {
  if (!before || !after) throw new Error('Both --before and --after commit SHAs are required.');
  if (/^0+$/.test(before)) {
    throw new Error('The before SHA is empty. Refusing to treat every existing article as newly published.');
  }

  const execute = runGit || ((args) => execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }));

  const output = execute([
    'diff',
    '--diff-filter=A',
    '--name-only',
    '--no-renames',
    before,
    after,
    '--',
    ':(glob)content/articles/*/index.md'
  ]);

  return [...new Set(output.split(/\r?\n/).map((entry) => entry.trim()).filter((entry) => ARTICLE_PATH_PATTERN.test(entry)))];
}

export function loadPublicArticles(files, { cwd = process.cwd(), siteUrl, now = new Date(), readFile } = {}) {
  if (!siteUrl) throw new Error('A site URL is required.');
  const load = readFile || ((filePath) => readFileSync(filePath, 'utf8'));

  return files.flatMap((filePath) => {
    const source = load(`${cwd}/${filePath}`);
    const frontMatter = parseFrontMatter(source);
    if (!isPublicArticle(frontMatter, now)) return [];

    return [{
      filePath,
      title: typeof frontMatter.title === 'string' ? frontMatter.title : '',
      expectedUrl: expectedArticleUrl(filePath, frontMatter, siteUrl)
    }];
  });
}

export function decodeXmlEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|hellip|ldquo|lsquo|lt|mdash|nbsp|ndash|quot|rdquo|rsquo);/gi, (entity, code) => {
    if (code[0] === '#') {
      const radix = code[1].toLowerCase() === 'x' ? 16 : 10;
      const digits = radix === 16 ? code.slice(2) : code.slice(1);
      const number = Number.parseInt(digits, radix);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return XML_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function readXmlTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  if (!match) return '';
  const rawValue = match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1');
  return decodeXmlEntities(rawValue).trim();
}

export function stripHtml(value) {
  return decodeXmlEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?…])/g, '$1')
    .trim();
}

export function parseRssItems(xml) {
  if (!/<rss(?:\s|>)/i.test(xml)) throw new Error('The response is not an RSS document.');

  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const link = readXmlTag(match[1], 'link');
    if (!link) return [];

    return [{
      title: stripHtml(readXmlTag(match[1], 'title')),
      link: normalizeArticleUrl(link),
      pubDate: readXmlTag(match[1], 'pubDate'),
      description: stripHtml(readXmlTag(match[1], 'description'))
    }];
  });
}

export function findRssItem(items, articleUrl) {
  const expected = normalizeArticleUrl(articleUrl);
  return items.find((item) => normalizeArticleUrl(item.link) === expected) || null;
}

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitForRssItem(articleUrl, {
  rssUrl,
  attempts = 24,
  intervalMs = 15_000,
  fetchImpl = fetch,
  sleepImpl = sleep,
  onAttempt = () => {}
} = {}) {
  if (!rssUrl) throw new Error('An RSS URL is required.');
  let lastProblem = 'not present in the feed';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(rssUrl, {
        headers: {
          Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
          'User-Agent': 'VidunWedagedera-Newsletter-Publisher/1.0'
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000)
      });

      if (!response.ok) {
        lastProblem = `RSS returned HTTP ${response.status}`;
      } else {
        const item = findRssItem(parseRssItems(await response.text()), articleUrl);
        if (item) return item;
        lastProblem = 'article is not present in the feed yet';
      }
    } catch (error) {
      lastProblem = error instanceof Error ? error.message : String(error);
    }

    onAttempt({ attempt, attempts, problem: lastProblem });
    if (attempt < attempts) await sleepImpl(intervalMs);
  }

  throw new Error(`Timed out waiting for ${articleUrl} in ${rssUrl}: ${lastProblem}`);
}

function requestErrorMessage(status, payload) {
  const details = Array.isArray(payload?.errors) ? payload.errors.join('; ') : '';
  return `Kit API request failed with HTTP ${status}${details ? `: ${details}` : ''}`;
}

export async function kitRequest(path, {
  apiKey,
  method = 'GET',
  body,
  baseUrl = KIT_API_BASE_URL,
  fetchImpl = fetch,
  attempts = 3,
  sleepImpl = sleep
} = {}) {
  if (!apiKey) throw new Error('KIT_API_KEY is required for Kit API requests.');
  const url = new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Kit-Api-Key': apiKey
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20_000)
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === attempts) throw new Error(requestErrorMessage(response.status, payload));
    } catch (error) {
      if (attempt === attempts || (error instanceof Error && error.message.startsWith('Kit API request failed with HTTP 4'))) {
        throw error;
      }
    }

    await sleepImpl(1_000 * (2 ** (attempt - 1)));
  }

  throw new Error('Kit API request failed.');
}

export async function listKitBroadcasts({ apiKey, request = kitRequest } = {}) {
  const broadcasts = [];
  let after = '';

  for (let page = 0; page < 100; page += 1) {
    const query = new URLSearchParams({ per_page: '1000' });
    if (after) query.set('after', after);
    const payload = await request(`/broadcasts?${query}`, { apiKey });
    broadcasts.push(...(Array.isArray(payload.broadcasts) ? payload.broadcasts : []));

    if (!payload.pagination?.has_next_page) return broadcasts;
    after = payload.pagination.end_cursor;
    if (!after) throw new Error('Kit reported another broadcasts page without an end cursor.');
  }

  throw new Error('Kit broadcast pagination exceeded the safety limit.');
}

function urlsInText(value) {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/https?:\/\/[^\s<>"']+/gi)].flatMap((match) => {
    const candidate = decodeXmlEntities(match[0]).replace(/[),.;!?]+$/, '');
    try {
      return [normalizeArticleUrl(candidate)];
    } catch {
      return [];
    }
  });
}

export function broadcastContainsArticleUrl(broadcast, articleUrl) {
  const expected = normalizeArticleUrl(articleUrl);
  const fields = [
    broadcast?.description,
    broadcast?.content,
    broadcast?.preview_text,
    broadcast?.subject,
    broadcast?.public_url
  ];
  return fields.some((value) => urlsInText(value).includes(expected));
}

export function truncateText(value, maximumLength) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maximumLength) return clean;
  return `${clean.slice(0, Math.max(0, maximumLength - 1)).trimEnd()}…`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildBroadcastPayload(item, { sendAt } = {}) {
  if (!item?.title || !item?.link || !item?.description) {
    throw new Error('The RSS item needs a title, link, and description.');
  }
  if (!sendAt || Number.isNaN(new Date(sendAt).valueOf())) throw new Error('A valid sendAt timestamp is required.');

  const title = truncateText(item.title, 120);
  const introduction = truncateText(item.description, 900);
  const link = normalizeArticleUrl(item.link);
  const publishedAt = parseDate(item.pubDate)?.toISOString() || new Date().toISOString();

  return {
    content: [
      '<p>Hi,</p>',
      `<p>I’ve just published a new article: <strong>${escapeHtml(title)}</strong></p>`,
      `<p>${escapeHtml(introduction)}</p>`,
      `<p><a href="${escapeHtml(link)}">Read the full article →</a></p>`,
      '<p>Vidun</p>'
    ].join('\n'),
    description: `Automated article notification | ${link}`,
    public: false,
    published_at: publishedAt,
    send_at: new Date(sendAt).toISOString(),
    preview_text: truncateText(introduction, 150),
    subject: truncateText(`New article: ${title}`, 120),
    subscriber_filter: [{
      all: [{ type: 'all_subscribers' }],
      any: null,
      none: null
    }]
  };
}

export async function createKitBroadcast(payload, { apiKey, request = kitRequest } = {}) {
  const response = await request('/broadcasts', {
    apiKey,
    method: 'POST',
    body: payload
  });
  if (!response.broadcast?.id) throw new Error('Kit created a broadcast but did not return its ID.');
  return response.broadcast;
}
