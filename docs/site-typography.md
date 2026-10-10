# Website typography

All website text uses Satoshi, including headings, navigation, article text,
forms and the standalone nena product page. Both body and display font tokens
point to the same family.

The shared `site-fonts.html` partial fetches the official, unmodified variable
WOFF2 files from Fontshare during the Hugo build. Hugo caches and fingerprints
them, and publishes them as first-party website assets. Visitors do not make
font requests to Fontshare. The normal font is preloaded; italics load only when
needed. Both use `font-display: swap`.

Satoshi is supplied by Indian Type Foundry under the
[ITF Free Font Licence](https://www.fontshare.com/licenses/itf-ffl), which permits
self-hosting on the licensee's own website. Font binaries are intentionally not
redistributed in this public source repository. Do not subset, convert or modify
the font files.

To update the font files, obtain the current official URLs from
[Fontshare](https://www.fontshare.com/fonts/satoshi), check the licence, and update
the two URLs in the shared partial.
