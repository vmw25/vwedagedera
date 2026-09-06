# Nika rotating showcase and demo treatment

The update is limited to the nika page and its own assets. Existing Hugo/HugoBlox, GitHub Pages, floating glass navigation, pricing, account links, legal text and disabled public-download gates are preserved. No changes to the desktop app or cloud-backup decisions are included.

## Design

The reference was [Anima's homepage](https://www.animahealth.com/): a stable product headline paired with changing capability statements and a prominent product demonstration. This adapts that presentation idea using nika's own colour palette, copy and existing real-interface screenshots. No Anima branding, footage or customer claims were reused.

The hero cycles every 6.5 seconds between Create cards, PassMedicine, Your style and Insights. The phrase, feature description and screenshot change together. Visitors can select a feature or pause. Manual selection and keyboard focus stop automatic cycling; hover pauses temporarily. Hidden tabs, offscreen content, reduced-motion and supported data-saving settings suspend automatic motion. A screen reader receives a stable headline and only the active slide; manual selections receive a concise announcement. No analytics or browser storage was added.

## Demo video, awaiting the owner

No real demo recording was present in the website files at implementation time. No video or dead Watch button is rendered while `data/nika.yaml` has an empty `demo_video_url`. Existing screenshots are clearly disclosed as example workspaces, not measured customer results.

When the approved footage is available:

1. Review the recording for private accounts, personal notes, patient information, keys and other confidential material. Do not publish a founder recording containing private history. Use an agreed example workspace.
2. Set `demo_video_url` to the approved full MP4, using a public HTTPS or same-site path. Prefer a short, compressed web export rather than a large raw screen capture. Actual file playback, loading and accessibility acceptance remain necessary when it arrives.
3. Optionally set `demo_preview_url` to a shorter silent MP4. Otherwise the full clip is reused for the muted inline preview. The script only attaches a source for eligible visible autoplay or an explicit viewing action. No third-party iframe or video platform is loaded.
4. Supply reviewed English WebVTT captions with `demo_captions_url` for spoken/meaningful audio. The preview is always muted; the full video uses native player controls inside a labelled native dialog, with Close/Escape behaviour and focus return.
5. Verify the actual clip on desktop/mobile browsers, reduced motion, save-data where supported, blocked autoplay, slow loading and keyboard playback. Do not treat the synthetic template checks as real footage acceptance.

The preview pauses when it leaves the viewport or the browser tab is hidden. Explicit pause is preserved. Opening the full player stops the preview; closing it stops full playback and returns focus to Watch. Autoplay rejection leaves a usable watch action and message rather than a retry loop. Reduced-motion/data-saving users can explicitly choose playback.

## Verification

- Frozen-lockfile dependency install and production Hugo 0.161.1/Pagefind build passed.
- 13 isolated JavaScript behaviour tests passed, including focus/pointer pause semantics, manual selection, preference changes, hidden-page behaviour, rejected and racing playback, modal close/focus return and deferred media loading.
- Nika build checks passed for 31 links/assets and 37 HTML files, with no nika CSS/JS leakage into the other page templates, no local/test URLs and no enabled unverified download buttons.
- A separate baseline build of the unchanged main branch produced byte-identical homepage, Sidequests and CS50 HTML to the updated production build.
- A private temporary build with clearly synthetic `.invalid` MP4/VTT URLs exercised the conditional video template. It rendered two deferred players, native dialog, captions and no unconditional autoplay attribute. No media was fetched; these fixture URLs were never added to the actual site data or served preview.
- Independent read-only interaction-code review found no actionable issues. No browser interaction or visual QA was performed, as it was not explicitly requested.

The in-app preview reuses the existing local server at `http://127.0.0.1:3101/sidequests/nika/`. Public publishing remains pending owner approval under the hosting workflow. The existing GitHub Pages deployment architecture must be used; do not register a replacement Sites deployment or change hosting.

Accessibility references: [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), [WAI pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [WAI modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
