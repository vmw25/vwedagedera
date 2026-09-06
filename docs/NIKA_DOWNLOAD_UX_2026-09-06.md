# Nika download-first UX

## Scope and source

Only the nika page, its partials and its page-only CSS/JS are changed. The existing Hugo/HugoBlox, GitHub Pages deployment, personal website pages and app-account service remain in place.

The [requested Hacker News discussion](https://news.ycombinator.com/item?id=43348379) and its [original article](https://www.tibinotes.com/p/practical-ux-for-startups-surviving) informed the design: optimise a complete task, use familiar controls and language, explain edge cases at the relevant action and preserve useful conventions. These are design recommendations, not evidence of a measured conversion improvement for nika.

## Implemented journey

- A stable first-screen headline explains the output: editable Anki cards from the user's material. The existing rotating feature demonstration remains below the main action without changing the headline being read.
- Seven paired macOS/Windows entry points: floating navbar, hero, after workflow, after features, after personalisation, after pricing and the closing section.
- A shared release partial supplies every destination. Ready platforms link directly to their installer, with no download modal, OS fingerprinting, signup wall or JavaScript dependency. Pending platforms link to their actual release-status card rather than an inert button. Their label and accessible name make the unavailable state explicit.
- Platform-specific installer types and HTTPS are validated at build time. This is a configuration guard, not proof that a remotely hosted artifact is authentic, signed or safe; release acceptance remains required.
- The download section is near the beginning, with platform requirements/readiness and the same sequence used in the FAQ: install, create/confirm account, sign in, optional preferences, first reviewed cards. Anki/AnkiConnect and export options are explained beside this decision.
- New-user primary actions no longer divert to website signup. Existing sign-in, privacy, terms and support remain available.
- Compact navigation retains How it works, Features, Plans and Downloads through a native Explore disclosure. Sign in and both platform actions remain outside it. Selection, Escape, outside click and focus leaving dismiss the menu when JavaScript is available; native links/disclosure work without it.
- Price/credit summaries precede the full comparison table; a scroll hint and sticky row headings aid narrow-screen comparison. All accounts start Free and paid choices happen later inside the app. No prices, allowances, entitlements or consent defaults changed.
- Technical detail is expandable; capture control, review and optional training choices remain visible. Section spacing is tighter without removing features, FAQs or pricing information.

## Why downloads are still not public

Read-only checks on 6 September 2026 found:

- `launch_ready` is false and both public URLs are empty.
- The current customer Mac 1.5.0/build32 PKG/ZIP exist locally and their hashes verify. They are private candidates: ad-hoc app signature, unsigned installer, no notarisation, and no actual clean-user installer acceptance yet. Apple silicon/macOS 14+ only; not an Intel release.
- No current 1.5.0 Windows installer exists. The successful September 2 CI artifact was a 1.4.1 portable build, not the current installer.
- The app repository is private. Its only release is an unpublished old 1.2.0 draft. Unauthenticated proposed release URLs returned 404.
- Current app CI could not start because GitHub reported failed account payments or a spending-limit issue. No billing settings or spending changed.
- The account API still reports public signup and live payments disabled. A downloaded installer therefore cannot yet deliver the promised public signup journey.

Do not fill the URLs with invented paths, old portable artifacts, private GitHub links or the founder's personal-mode build. Do not make the private source repository public. The future distribution location should contain only reviewed customer binaries and checksums, published with owner approval. Public availability and end-to-end acceptance are not established by this website work.

## Verification and acceptance

- The isolated Hugo fixture suite covers pending, gated-but-populated URLs, one-platform-ready, both-platforms-ready and invalid/non-installer URLs. Synthetic `.invalid` URLs are generated only in temporary test folders, never fetched or served in the preview.
- Existing carousel/video behaviour tests remain, plus compact-navigation dismissal tests.
- The production HTML guard requires all 14 entry points, valid anchors, no duplicate IDs, no enabled unverified installers, no dead release buttons, no fake video and no asset leakage into other pages.
- Frozen-lockfile installation and the Hugo 0.161.1/Pagefind production build pass. The homepage, Sidequests and CS50 HTML hashes remain identical to the pre-change baseline.
- No browser visual/interaction QA was performed. The Sites skill requires an explicit browser-testing request. No real installer or account acceptance is implied by template/unit checks.

Before claiming exceptional UX, observe representative users completing the actual install-to-first-card task. Record hesitation, wrong turns, completion rate and time to first reviewed card, without capturing private study content by default. Test keyboard navigation, small screens, 200% enlargement, poor connectivity, invalid passwords, email confirmation, Anki unavailable and preview recovery. These usability observations are still pending, not fabricated metrics.

The preview continues at `http://127.0.0.1:3101/sidequests/nika/`. Public publication remains pending owner approval under the Sites hosting workflow; use the existing GitHub Pages workflow when approved. This update does not install a desktop build, publish customer binaries, open signup or enable payments.
