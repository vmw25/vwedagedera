# Persistent instructions for Codex

## Project purpose

This repository is Vidun Wedagedera's personal-brand website for healthtech networking, research opportunities, elective and internship applications, founder conversations, project work and thoughtful writing.

## Non-negotiable technical constraints

- Keep the site as Hugo and HugoBlox. Do not replace it with React, Next.js, Astro, Jekyll or plain static HTML.
- Preserve the existing GitHub Actions Pages architecture.
- The production URL is `https://vmw25.github.io/vwedagedera/`. This is a GitHub Pages project site, so every internal asset and link must work beneath `/vwedagedera/`.
- Keep Hugo pinned to `0.161.1` in `hugoblox.yaml`, Codespaces and any hosting configuration unless a proposed version passes local, production-base-URL and GitHub Actions builds.
- Preserve the package manager and lockfile. Use the `packageManager` version declared in `package.json`.
- Do not introduce a second deployment workflow, a `gh-pages` branch or a Jekyll workflow.

## Content rules

- Use British English.
- Keep the tone intelligent, clear, thoughtful, direct and evidence-led.
- Never invent dates, metrics, employment, publications, interviews, clinical findings, users, revenue, awards or project results.
- Never describe Vidun as a software engineer, full-stack developer, AI expert, cardiac electrophysiologist, practising cardiologist, successful healthtech founder or serial entrepreneur.
- Present C, Git, GitHub, Hugo and web-development skills as developing.
- Do not include confidential research information, patient-level data, compound names, proprietary models or unpublished results.
- Hide incomplete public links. Track missing details in `CONTENT_TODO.md` and in internal comments.

## URL rules

- Prefer Hugo helpers and generated permalinks.
- Test navigation from both the homepage and inner pages.
- Do not add hard-coded root-relative links that escape `/vwedagedera/`.
- Canonical, Open Graph, sitemap, robots and 404 URLs must use the project path.

## Required validation

Run these checks before publishing:

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm run build:production
```

Then confirm that `public/` contains no sample identity, `example.com`, `localhost`, template projects or root-path asset mistakes. Draft writing must not be generated.
