# Heart-led redesign

Vidun approved publishing this redesign on 16 October 2026. Deploy through the
existing GitHub Pages workflow; the domain and hosting configuration stay unchanged.

## Design

Near-black surfaces, white Satoshi typography, native scrolling, generous space
and one large anatomical wireframe heart beside the introduction. The two supplied screen recordings
informed spatial interaction, scale and restraint; no reference-site imagery,
branding, recordings or code has been copied into the public source.

The existing Hugo/HugoBlox site, pinned Hugo version, package manager and GitHub
Pages deployment remain intact. Contact, search, colour-mode toggle and Kit
signup are retained. Newsletter signup is intentionally quiet, without an
automatic robot prompt. Article text, captions, portfolio data, resource files,
product release links and pricing data are unchanged.

## Heart source and licence

Source: [Heart by Innerscene](https://www.innerscene.com/tools/library/3d-parts/heart-e9f72b0e).
The model page and the embedded glTF metadata declare **CC0-1.0**, including
modification and redistribution. It is not patient-derived data. The source GLB
has 18 mesh parts, including myocardium, great vessels and coronary branches.

The published derivative contains only positions, normals and index buffers.
Textures, materials and the GLB loader are not sent to visitors. `data/heart_mesh.json`
records the source and geometry budget. The SVG fallback is projected from the
same geometry. The scene is decorative, not a validated clinical visualisation.

Regenerate the assets with:

```sh
node scripts/prepare-heart.mjs /absolute/path/to/heart.glb
```

Download the source through the model page's official download link first.

The renderer uses native WebGL with no new runtime dependencies. The heart turns
horizontally once every 90 seconds with pointer rotation and local deformation.
There is no pause button. Reduced motion slows the turn and removes floating;
off-screen/background suspension, capped pixel density and a static fallback
avoid unnecessary work. Pointer interaction remains available.

On desktop, the homepage moves within a fixed viewport, eased towards the native
document scroll position. Wheel, touch and keyboard events are not intercepted.
Mobile and reduced-motion visitors use direct scrolling. Centre-weighted text
emphasis, one-time section reveals, line draws and portrait parallax provide the
additional motion. Anchor navigation, keyboard focus and resize are handled by
the small first-party `home-motion.mjs` module. A fixed contact button opens the
existing enquiry dialog on every page. The same reusable enquiry form is also
available in every page's footer; an IntersectionObserver fades the floating
button away while that section is in view and brings it back on leaving.
Both forms retain the existing Formspree endpoint, validation, privacy notice
and inline success/error messages. No new form library is loaded.

The same optimised portrait fills the left/centre hero as a large, quiet background.
A monochrome treatment, soft radial edge mask and 26% opacity keep the text clear.
Absolute positioning keeps the text, heart and every section in their existing geometry.
Only the hero portrait is nudged right (18–32px on desktop, 12px on mobile).
Departure spans 280–480px of scrolling, followed by at least 480px for docking.
Quintic easing softens both ends, and independent frame-rate-aware portrait
damping adds follow-through without slowing the page. The gutter waypoint and
lower portrait position are unchanged. On scroll, the decorative image becomes clear and travels through the
empty left gutter before growing into the
existing introduction portrait. Its bounds are measured only on resize, font
load or content resize; it shares the existing animation frame and uses transforms
and opacity. The softly masked and clear layers reuse the same cached WebP.
Scrolling upwards reverses the transition. The destination remains the accessible
image, and reduced-motion visitors see two stationary images without the flight.

## Empty content

Research, Productivity, GCSEs, A-levels, UCAT, Interviews, Work Experience,
Volunteering and Super-curriculars have no published articles and are marked
draft. The duplicate All School Articles listing is also held as a draft. Their
source is preserved. Taxonomy/term listing pages are disabled; author listings
were already disabled. CS50 and unfinished articles remain drafts.

The live School category, Cambridge Medicine category, Med School, five
published articles, portfolio, nena product, resources and utility pages remain.
To reinstate a held category when articles are ready, remove `draft: true` from
its index and add it back to navigation. The article hub only links categories
containing published articles.

## Checks

Use the declared pnpm version and Hugo 0.161.1. Run a production build and then:

```sh
node scripts/check-site-typography.mjs
node scripts/check-redesign.mjs
node --test scripts/heart-hero.test.mjs
node --test scripts/contact-forms.test.mjs
node scripts/check-nika.mjs
node scripts/check-nika-content.mjs
node scripts/check-nika-walkthrough.mjs
```

Browser checks cover the hero, scrolling stage, navigation, portfolio interaction,
article contents/captions, search, form dialogs and responsive layouts. Do not
submit real enquiries or newsletter subscriptions just for a visual test.
