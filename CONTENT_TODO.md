# Content still needed from Vidun

This file is internal repository documentation. Hugo does not publish it.

## Contact and identity

- [x] Professional email address approved for public display: `vmw25@cam.ac.uk`.
- [x] LinkedIn profile URL added from the matching public profile; Vidun should confirm it before merging.
- [ ] A real profile photograph that Vidun owns and approves for the website.
- [ ] Current CV as a PDF, approved for public download.

## Dates

- [ ] Verified start date for medical training at the University of Cambridge.
- [ ] Verified dates for the intercalated Biochemistry degree and research project.
- [ ] Verified term of office for Cambridge University MedTech Society.
- [ ] Verified dates for research experiences that can be disclosed publicly.
- [ ] Verified dates for the education venture.

## Projects and writing

- [ ] Approved project screenshots or figures with no confidential information.
- [ ] Confirmation of which research organisations may be named publicly.
- [ ] Approved details from clinician conversations, only after they have genuinely occurred and confidentiality has been considered.
- [ ] Evidence-checked writing ready for publication.
- [ ] Any public project links that should appear on project pages.

## Nika release gates

### nena web migration

- [x] Rebrand the existing `/apps/nika/` landing page and app listing as nena, preserving desktop installer links and account identifiers.
- [x] Add `/apps/nena/` and `/nena/` redirects while the original landing URL remains canonical.
- [ ] Enable `web_beta_ready` only after the actual account workspace at `web_beta_url` is deployed and passes its release checks. It is hidden until then.
- [ ] Replace desktop walkthrough screenshots with verified web captures as the web workflows ship. Current images and installation steps deliberately retain the installed Nika name.
- [ ] Verify any new support address before changing the working `nika@vidunwedagedera.com` contact.
- [ ] Broader learner-profile, knowledge-estimation and clinical-practice features remain a roadmap until individually implemented and evaluated.

- [x] Page-only premium visual redesign and real desktop screenshots with synthetic example data.
- [x] Floating glass navigation, readable product copy, plan comparison table and persistent Sign in access.
- [x] Page-only rotating feature headline and screenshot showcase, with manual selection, pause and reduced-motion support.
- [x] Download-first UX: paired platform actions in seven places, honest per-platform release status, consistent install-first setup, compact navigation and readable plan summaries.
- [ ] Owner-supplied demonstration video. Set `demo_video_url` only after reviewing the actual recording; do not insert a simulated play button.
- [ ] Supply an optional short silent MP4 as `demo_preview_url` and English WebVTT captions as `demo_captions_url` when the full recording contains speech. Preview/full-player controls are implemented but remain hidden without real footage.
- [ ] Approve public publication of the rotating showcase and download-first UX after reviewing the local preview.
- [ ] Resolve the designated Cambridge invitation's Microsoft Defender quarantine and verify fresh confirmation/reset delivery before opening signup.
- [ ] Deploy and verify personalised onboarding before treating the preview's described customer workflow as released.
- [ ] Complete account confirmation/recovery acceptance checks and the remaining legal/billing checks before opening public access.
- [ ] Publish verified customer installers and populate `data/nika.yaml`; keep `launch_ready: false` until all launch gates pass.
- [ ] Complete macOS signing/notarisation or document an approved alternative distribution route; independently verify Windows packaging.
- [ ] Do not publish the founder's personal-mode installer as the account-based customer release.

## Other optional content

- [ ] Preferred public description of the education venture.
- [ ] A short CV summary for the website.
- [ ] A preferred favicon or personal mark, if different from the current default.
