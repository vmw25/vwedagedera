# Restored nika switching headline and product story

## What changed and why

The download-first change in `c6ceff3` moved the rotating phrase out of the main
heading and below the first actions. It also put the personalisation and CNN
explanations inside closed disclosures. The carousel code remained, but the
opening screen no longer had the changing headline the owner requested.

This update restores that presentation at the top of the nika page, using the
capability-switching idea from [Anima](https://www.animahealth.com/) with original
nika copy and existing, disclosed example-workspace screenshots. No Anima media,
branding or performance claims were copied.

- The opening heading is “Your cards. Your style.” with a large rotating line.
- Six views cover PDFs/text, images/occlusion, PassMedicine, personal learning,
  review/Anki/export and Insights. Phrase, selected control, copy and image stay
  synchronised every 6.5 seconds.
- All six capabilities also appear as static feature descriptions. They remain
  available without JavaScript or waiting for a carousel to cycle.
- “Anki cards indistinguishable from your own” is presented prominently as the
  product goal, not a measured or guaranteed result.
- Visible technical copy explains the pretrained LLM, ML style ranker and
  PassMedicine CNN. Personalisation uses preferences and reviewed examples; the
  copy does not claim automatic base-model retraining or improved memory scores.
- Personal learning and shared training are separate. This page change does not
  alter consent, settings, app code, source data, billing or release gates.

## Interaction safeguards

The controller now observes the entire hero, so the opening headline can cycle
before the screenshot further down enters view. A zero intersection threshold
also avoids tying motion to a fraction of a potentially very tall mobile hero.
Hover pauses over the feature controls rather than anywhere in the hero. Manual
selection and keyboard focus pause persistently. Reduced-motion, data-saving,
hidden-tab and offscreen safeguards remain.

The visible changing phrase is hidden from assistive technology; the heading
has a stable, complete text alternative. Manual choices announce the chosen
feature, while automatic transitions do not interrupt screen-reader speech.
Invisible, aria-hidden phrase sizers reserve enough space for the longest line
at each width, so a longer phrase does not move the actions. No fake video was
added: real demo footage is still awaiting the owner.

## Source grounding

Checked the current customer app source in `nika-deployment-fix-20260904`:

- `app/ranking/personal_style.py`: loaded style ranker plus profile scoring.
- `app/personalisation.py`: authenticated, eligible reviewed-example retrieval.
- `app/question_banks/passmedicine_cnn.py`: packaged convolutional result model.
- `docs/DEFAULT_PERSONAL_LEARNING_2026-09-06.md`: personal-learning switch and
  selected-deck scope remain separate from optional shared training.

These are implementation checks, not proof of public deployment, a measured
style-indistinguishability rate or real-world memory improvement.

## Verification

- Frozen-lockfile installation passed with pnpm 10.14.0.
- Production Hugo 0.161.1 and Pagefind build passed.
- 25 JavaScript/template tests passed, zero failed or skipped. Includes all six
  transitions and wraparound, hero visibility before screenshots, control hover,
  pause, manual choice, keyboard-focus pause and reduced-motion behaviour.
- Built-page checks passed for 47 links/assets and 37 HTML pages, including
  heading placement, visible ML/CNN copy, unique IDs, no fake footage, no long
  dashes, seven paired download entry points and unavailable-installer gates.
- Personal homepage, Sidequests and CS50 HTML hashes are byte-identical to the
  pre-change production output. Nika assets remain isolated from these pages.
- `git diff --check` passed. No browser visual or interaction QA was performed;
  the Sites skill requires an explicit browser-testing request.

Preview: `http://127.0.0.1:3101/sidequests/nika/`.
The existing draft PR is #49. Public publication requires owner approval and
must use the existing GitHub Pages workflow, not a replacement Sites deployment.
