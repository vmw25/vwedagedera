import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const output = resolve(process.argv[2] || 'public');
const pages = [
  'index.html', 'portfolio/index.html', 'articles/index.html',
  'school/index.html', 'medical-school/index.html', 'research/index.html',
  'productivity/index.html', 'resources/index.html',
  'resources/school/index.html', 'resources/medical-school/index.html',
  'apps/index.html', 'apps/nika/index.html', '404.html',
  'articles/how-to-learn-and-memorise-as-fast-as-possible-at-medical-school/index.html',
];

for (const page of pages) {
  const html = readFileSync(join(output, page), 'utf8');
  assert.ok(/font-family:["']?Satoshi/i.test(html), `Satoshi font faces missing: ${page}`);
  assert.match(html, /fonts\/satoshi\/Satoshi-Variable\.[a-f0-9]+\.woff2/, `First-party font preload missing: ${page}`);
  assert.match(html, /font-display:swap/, `Non-blocking font display missing: ${page}`);
  assert.doesNotMatch(html, /class=["']?(?:simple-index__eyebrow|simple-category-card__label|simple-project-card__tag|portfolio-eyebrow|portfolio-entry__badge)(?:[\s"'>])/, `Redundant label rendered: ${page}`);
  assert.doesNotMatch(html, /Filter the portfolio, search for a topic, or expand every entry\./);
  assert.doesNotMatch(html, /(?:src|href)=["']?https?:\/\/[^\s"'>]*(?:fontshare|fonts\.googleapis)/, `External runtime font request: ${page}`);
}

const fonts = readdirSync(join(output, 'fonts/satoshi'));
assert.equal(fonts.length, 2, 'Only the two variable webfonts should be published');
for (const file of fonts) {
  const font = readFileSync(join(output, 'fonts/satoshi', file));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2', 'Invalid WOFF2: ' + file);
  assert.ok(font.length < 100_000, 'Unexpected font size: ' + file);
}

const portfolio = readFileSync(join(output, 'portfolio/index.html'), 'utf8');
for (const hook of ['data-portfolio-filter', 'data-portfolio-search', 'data-portfolio-expand', 'data-portfolio-collapse', 'data-portfolio-explorer-toggle']) {
  assert.ok(portfolio.includes(hook), 'Portfolio control missing: ' + hook);
}
assert.match(portfolio, /2022[–&]/, 'Education dates should be preserved');
const home = readFileSync(join(output, 'index.html'), 'utf8');
assert.match(home, /https:\/\/formspree\.io\/f\/xeajeklr/);
assert.match(home, /https:\/\/app\.kit\.com\/forms\/9863151\/subscriptions/);
const article = readFileSync(join(output, pages.at(-1)), 'utf8');
assert.match(article, /editorial-article__toc/);
assert.match(article, /data-pagefind-body/);
console.log(`Typography and uncluttered-heading checks passed on ${pages.length} pages; both first-party variable fonts and existing controls verified.`);
