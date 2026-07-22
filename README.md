# Vidun Wedagedera — personal portfolio

A HugoBlox website for Vidun Wedagedera, a University of Cambridge medical student exploring cardiovascular medicine, cardiac electrophysiology, research and health technology.

Live site: <https://vmw25.github.io/vwedagedera/>

## What this repository contains

- A concise one-page homepage with work, about, skills, experience, writing and contact sections.
- Four longer project pages.
- Unpublished writing outlines that stay hidden while `draft: true`.
- A pinned Hugo 0.161.1 GitHub Pages deployment.
- Beginner maintenance instructions in `BEGINNER_GUIDE.md`.
- A list of missing personal details in `CONTENT_TODO.md`.

## Preview locally or in Codespaces

Install the pinned dependencies:

```bash
pnpm install --frozen-lockfile
```

Start the preview:

```bash
pnpm dev
```

Build exactly as the public GitHub Pages project site:

```bash
pnpm run build:production
```

The generated site belongs in `public/`. Do not edit that folder directly; Hugo recreates it from the configuration, content, templates and assets in this repository.

## Publishing

Changes merged into `main` are built and deployed by GitHub Actions. The deployment workflow is `.github/workflows/deploy.yml`; no Jekyll or `gh-pages` branch is used.

For step-by-step maintenance instructions, read `BEGINNER_GUIDE.md`.
