# Automatic new-article emails with Kit

This dependency-free Node script runs only after the GitHub Pages deployment succeeds. For each newly added, public `content/articles/<slug>/index.md` file, it:

1. waits until the matching item is visible in the live RSS feed;
2. checks every Kit broadcast for that article URL;
3. skips the article if it has already been used;
4. schedules a short email containing the RSS preview and a link to the full article;
5. targets all subscribers through Kit API v4.

The bridge is disabled by default. It never stores or prints the API key.

## One-time Kit and website setup

1. Create a Kit Form under **Audience growth → Landing Pages & Forms → + New → Form → Inline**.
2. In the Form settings, leave **Auto-confirm new subscribers** off so double opt-in stays enabled, then save and publish the Form.
3. Open **Embed → JavaScript** and copy the Form's public script. Record its `data-uid`, script URL, numeric Form ID, and public subscription action.
4. Put those public values in `newsletter.form_uid`, `newsletter.runtime_url`, `newsletter.form_id`, and `newsletter.form_action` in `config/_default/params.yaml`, then change `newsletter.enabled` to `true`.

The website keeps its own visual design while using Kit's official browser runtime for anti-bot verification, error handling, and the confirmation success message. To protect initial page speed, that runtime loads only when a signup form is near the viewport or a visitor interacts with it. These public Form values can be committed to the site. The private API key must never be pasted into this file or into chat.

## One-time GitHub setup

1. In Kit, verify the sending email address and configure the account's default email template. Kit supplies the unsubscribe footer.
2. In Kit's **Developer** settings, create a v4 API key.
3. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
4. Add a repository **secret** named `KIT_API_KEY` containing the v4 key.
5. Add a repository **variable** named `KIT_NEWSLETTER_ENABLED` with the exact value `true`.

Set `KIT_NEWSLETTER_ENABLED` to `false` at any time to stop automated broadcasts without changing the website.

Kit currently includes API access and unlimited broadcasts on its free plan. A missing verified sender or an account-level restriction still causes the GitHub job to fail clearly without creating an email.

## What triggers an email

The deployment must be a push to `main`, and the commit range must contain a newly added file matching `content/articles/*/index.md`. Draft, private, future-published, and expired articles are ignored. Editing an existing article does not send another email.

The script waits up to six minutes for `https://vidunwedagedera.com/articles/index.xml` to contain the new article. Emails are scheduled ten minutes after the job begins; if several articles are published in one push, they are spaced ten minutes apart.

## Safe local checks

Run the unit tests:

```bash
node --test scripts/newsletter/*.test.mjs
```

Preview a real commit range without creating a Kit broadcast:

```bash
node scripts/newsletter/publish-new-articles.mjs \
  --before <older-commit-sha> \
  --after <newer-commit-sha> \
  --dry-run
```

Dry-run still waits for the article to exist in the live RSS feed. If `KIT_API_KEY` is present, it also performs a read-only deduplication check; without the key it creates no Kit API request.

## Operational notes

- The Kit API key belongs only in GitHub Actions secrets, never in this repository or a command pasted into chat.
- The internal Kit broadcast description includes the public article URL. This is the durable deduplication marker.
- An all-zero `before` SHA is rejected deliberately so an unusual first-push event cannot email every existing article.
- RSS and Kit network failures stop the job with an actionable error. Re-running the workflow is safe because the article URL is checked before a new broadcast is created.
