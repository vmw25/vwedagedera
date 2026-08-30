#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import {
  broadcastContainsArticleUrl,
  buildBroadcastPayload,
  createKitBroadcast,
  findAddedArticleFiles,
  listKitBroadcasts,
  loadPublicArticles,
  waitForRssItem
} from './lib.mjs';

function parsePositiveNumber(value, label, fallback) {
  if (value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be a positive number.`);
  return number;
}

export function parseArguments(argv, environment = process.env) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--dry-run') {
      values.dryRun = true;
      continue;
    }
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`Missing value for ${argument}`);
    values[argument.slice(2)] = next;
    index += 1;
  }

  return {
    before: values.before || environment.BEFORE_SHA,
    after: values.after || environment.AFTER_SHA,
    dryRun: values.dryRun === true || environment.NEWSLETTER_DRY_RUN === 'true',
    rssUrl: values['rss-url'] || environment.NEWSLETTER_RSS_URL || 'https://vidunwedagedera.com/articles/index.xml',
    siteUrl: values['site-url'] || environment.NEWSLETTER_SITE_URL || 'https://vidunwedagedera.com/',
    rssAttempts: parsePositiveNumber(values['rss-attempts'] || environment.NEWSLETTER_RSS_ATTEMPTS, 'rss-attempts', 24),
    rssIntervalMs: parsePositiveNumber(values['rss-interval-ms'] || environment.NEWSLETTER_RSS_INTERVAL_MS, 'rss-interval-ms', 15_000),
    sendDelayMinutes: parsePositiveNumber(values['send-delay-minutes'] || environment.NEWSLETTER_SEND_DELAY_MINUTES, 'send-delay-minutes', 10),
    sendSpacingMinutes: parsePositiveNumber(values['send-spacing-minutes'] || environment.NEWSLETTER_SEND_SPACING_MINUTES, 'send-spacing-minutes', 10)
  };
}

function safePayloadSummary(payload) {
  return {
    subject: payload.subject,
    description: payload.description,
    public: payload.public,
    published_at: payload.published_at,
    send_at: payload.send_at,
    preview_text: payload.preview_text,
    subscriber_filter: payload.subscriber_filter
  };
}

export async function run(options, {
  apiKey = process.env.KIT_API_KEY,
  cwd = process.cwd(),
  now = () => new Date(),
  log = console.log
} = {}) {
  const addedFiles = findAddedArticleFiles({ before: options.before, after: options.after, cwd });
  const articles = loadPublicArticles(addedFiles, { cwd, siteUrl: options.siteUrl, now: now() });

  if (addedFiles.length === 0) {
    log('No newly added article bundles were found; no newsletter will be sent.');
    return { detected: 0, scheduled: 0, skipped: 0 };
  }
  if (articles.length === 0) {
    log(`Found ${addedFiles.length} newly added article bundle(s), but none are public; no newsletter will be sent.`);
    return { detected: addedFiles.length, scheduled: 0, skipped: addedFiles.length };
  }
  if (!options.dryRun && !apiKey) {
    throw new Error('KIT_API_KEY is missing. Add it as a GitHub Actions repository secret before enabling newsletter publishing.');
  }

  log(`Found ${articles.length} newly added public article(s). Waiting for the live RSS feed before publishing.`);
  const broadcasts = apiKey ? await listKitBroadcasts({ apiKey }) : [];
  let scheduled = 0;
  let skipped = 0;
  const baseScheduleTime = now().valueOf() + (options.sendDelayMinutes * 60_000);

  for (let index = 0; index < articles.length; index += 1) {
    const article = articles[index];
    const item = await waitForRssItem(article.expectedUrl, {
      rssUrl: options.rssUrl,
      attempts: options.rssAttempts,
      intervalMs: options.rssIntervalMs,
      onAttempt: ({ attempt, attempts, problem }) => {
        log(`RSS check ${attempt}/${attempts} for ${article.expectedUrl}: ${problem}.`);
      }
    });

    if (broadcasts.some((broadcast) => broadcastContainsArticleUrl(broadcast, item.link))) {
      log(`Skipping ${item.link}; a Kit broadcast already references this article.`);
      skipped += 1;
      continue;
    }

    const intendedTime = baseScheduleTime + (index * options.sendSpacingMinutes * 60_000);
    const minimumSafeTime = now().valueOf() + (2 * 60_000);
    const payload = buildBroadcastPayload(item, {
      sendAt: new Date(Math.max(intendedTime, minimumSafeTime)).toISOString()
    });

    if (options.dryRun) {
      log(`DRY RUN: would schedule ${item.link}`);
      log(JSON.stringify(safePayloadSummary(payload), null, 2));
      scheduled += 1;
      continue;
    }

    const broadcast = await createKitBroadcast(payload, { apiKey });
    broadcasts.push(broadcast);
    scheduled += 1;
    log(`Scheduled Kit broadcast ${broadcast.id} for ${payload.send_at}: ${item.link}`);
  }

  return { detected: articles.length, scheduled, skipped };
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = await run(options);
    console.log(`Newsletter publishing complete: ${result.scheduled} scheduled, ${result.skipped} skipped.`);
  } catch (error) {
    console.error(`Newsletter publishing failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
