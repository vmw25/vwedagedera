# Beginner guide: maintaining this website

This guide is written so you can maintain the website without Codex. You do not need to understand every file before making a small change.

## 1. What Hugo is

Hugo is the program that turns your content files into a finished website. You edit readable Markdown and YAML files; Hugo produces the HTML pages that browsers display.

Do not edit the generated `public/` folder. Hugo replaces it during every build.

## 2. What HugoBlox is

HugoBlox is the design and page-building system used on top of Hugo. The homepage is assembled from blocks such as the project collection and contact section. This repository also contains three small, project-specific HugoBlox blocks for the hero, skills and date-safe experience timeline.

## 3. What GitHub Pages is

GitHub Pages hosts the finished static website. It serves this repository at:

<https://vmw25.github.io/vwedagedera/>

The `/vwedagedera/` part matters because this is a project site rather than an account-root site.

## 4. How the three fit together

You edit content in GitHub → GitHub Actions runs Hugo and HugoBlox → GitHub Pages publishes the finished files.

GitHub Actions is the automated process that builds and publishes the website whenever approved code is merged into `main`.

## 5. Important folders and files

- `content/_index.md`: homepage words, sections, experience entries and configured contact links.
- `content/projects/`: one folder for each project page.
- `content/writing/`: the writing page and draft articles.
- `data/authors/me.yaml`: your name, biography, interests, education and public profile links.
- `assets/media/`: the social-sharing graphic and, later, your photograph.
- `assets/css/custom.css`: the dark visual design.
- `config/_default/`: navigation, site identity, theme and URL configuration.
- `.github/workflows/`: the automated build and deployment instructions.
- `CONTENT_TODO.md`: personal details that are still missing.

## 6. How to edit your biography

In GitHub, open:

Repository → `data` → `authors` → `me.yaml` → pencil icon

Edit only the words below `bio: |`. Keep the two-space indentation at the start of the biography line.

To change the longer About section, open:

Repository → `content` → `_index.md` → pencil icon

Find `id: about` and edit the text below `text: |-` without changing its indentation.

## 7. How to add a project

The safest method is to copy the structure of an existing project folder in `content/projects/`.

Create a short lower-case folder name with hyphens, for example `content/projects/my-new-project/`, and add an `index.md` file inside it.

At the top, include:

```yaml
---
title: 'Project title'
summary: 'One accurate sentence.'
description: 'A short search description.'
weight: 50
tags: ['Research']
tech_stack: ['Evidence review']
status: 'Ongoing'
authors: ['me']
show_date: false
reading_time: false
show_breadcrumb: true
---
```

Write the page below the second `---`. Do not add results, dates or metrics until you have verified them.

## 8. How to add an article

In a Codespace terminal, run this one command:

```bash
hugo new content writing/my-article-title/index.md --kind writing
```

This creates an article from `archetypes/writing/index.md`. Keep `draft: true` while writing. Hugo hides drafts from the public build.

When the article is approved, change `draft: true` to `draft: false`. Add a real date only when you are ready to publish.

## 9. How to replace the monogram with your photograph

Use a clear portrait that you own and approve for public use. A roughly vertical image works best.

In GitHub, go to:

Repository → `assets` → `media` → `authors` → Add file → Upload files

Upload the image with exactly one of these names:

- `me.jpg`
- `me.png`
- `me.webp`

The homepage automatically replaces the VW monogram with that photograph. Hugo crops it to the rounded portrait frame. Do not upload a private or patient-related image.

## 10. How to add LinkedIn

First open `data/authors/me.yaml` and add this item under `links:`:

```yaml
  - icon: brands/linkedin
    url: https://www.linkedin.com/in/YOUR-PUBLIC-PROFILE/
    label: LinkedIn
```

Then open `content/_index.md`, find the Contact section's `social:` list and add the same three lines with the existing indentation.

## 11. How to add your email

Open `data/authors/me.yaml` and add this directly below `role:`:

```yaml
email: your-approved-public-address@example.org
```

Then open `content/_index.md`, find `id: contact`, and add this directly below `username: me`:

```yaml
      email: 'your-approved-public-address@example.org'
```

Use only an address you are comfortable publishing.

## 12. How to upload your CV

Prepare a PDF that contains no private address, telephone number or other information you do not want public.

Upload it through:

Repository → `static` → `uploads` → Add file → Upload files

Name it `cv.pdf`.

Then open `content/_index.md`. In the Contact section's `social:` list, add:

```yaml
        - icon: document-arrow-down
          url: 'uploads/cv.pdf'
          label: 'Download CV'
```

Hugo will include the correct `/vwedagedera/` project path.

To add a verified experience date, open `content/_index.md`, find the relevant item under `id: experience`, and add a `dates:` field below `organisation:`. For example:

```yaml
          dates: '2024–Present'
```

Use only dates you have checked. The optional field replaces the temporary `Present` label. Education dates are recorded in `data/authors/me.yaml`; add them only after confirming the degree dates and the HugoBlox author-data format in use at that time.

## 13. How to preview the site in Codespaces

Create a preview environment through:

Repository → select the `codex/personal-brand-site` branch → Code → Codespaces → Create codespace on branch

Wait for the Codespace to finish preparing. It automatically installs the site dependencies.

Before continuing, check that the terminal prompt names the branch you intended to preview. If both `hugo version` and `pnpm --version` say `command not found`, the development container was not applied. Press `F1`, choose `Codespaces: Rebuild Container`, wait for the rebuild to finish, and then run those two version checks again.

In the terminal, run:

```bash
pnpm dev
```

This starts the preview server. Success looks like a message containing `Web Server is available at` and port `1313`. Leave the command running.

Open the `PORTS` tab at the bottom of Codespaces, find port `1313`, then click the globe icon or `Open in Browser`. The first start may take a short time.

## 14. How to publish an update

The safest process is:

1. Create a branch for the change.
2. Preview and build it.
3. Commit the change.
4. Open a pull request.
5. Review the pull request and its green checks.
6. Merge it into `main`.

A branch is a safe copy of the project. A commit is a named snapshot of changes. A pull request is the review page where a branch is compared with `main` before merging.

## 15. How to inspect GitHub Actions

Open:

Repository → Actions → Deploy website to GitHub Pages

- A yellow circle means the workflow is running.
- A green tick means it succeeded.
- A red cross means it failed.

To inspect a failure, click the failed run, then the red job, then the red step. Copy the first meaningful error—not the entire page—when asking for help.

For a manual deployment, use:

Repository → Actions → Deploy website to GitHub Pages → Run workflow → main → Run workflow

## 16. How to undo a change

If a pull request has not been merged, close it; `main` remains unchanged.

If a pull request was merged, open:

Repository → Pull requests → Closed → the merged pull request → Revert

GitHub creates a new pull request that reverses the earlier changes. Review and merge that revert. This is safer than deleting history.

## 17. Common errors and what they mean

- `YAML parse error`: spacing or punctuation near the named YAML line is invalid. Compare its indentation with nearby entries.
- `page not found`: a link or folder name does not match the real path.
- `failed to render`: Hugo could not turn one content or template file into a page. Read the first file path and line number in the error.
- `SetInMap: assignment to entry in nil map`: a Hugo/HugoBlox compatibility problem previously seen with Hugo 0.162.0. Confirm that `hugoblox.yaml` still pins `0.161.1`.
- `binary "tailwindcss" is not a Node.js script`: the wrong pnpm version created an incompatible command wrapper. Confirm that `package.json` still declares `pnpm@10.14.0`, then reinstall with the frozen lockfile.
- Both `hugo` and `pnpm` say `command not found`: confirm that the terminal is on the intended branch, then press `F1` and run `Codespaces: Rebuild Container`. The repository-owned container installs both tools automatically.
- A page works locally but not on GitHub Pages: look for a root-relative URL that forgot `/vwedagedera/`.
- A draft is visible: confirm its front matter contains `draft: true`, then rebuild.

## Verified build command

Before merging a change, run:

```bash
pnpm run build:production
```

Success ends without an `ERROR` and Pagefind reports that it indexed the generated site.
