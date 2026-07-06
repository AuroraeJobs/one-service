# WeChat Official Account Publishing

This directory keeps the planning files for OneAI Daily WeChat publishing.
It is for editorial planning, article drafts, cover/image planning, and release
handoff notes. Runtime API integration lives in the application modules.

## Directory Layout

```text
docs/wechat-official-account/
├── README.md
├── calendar/
│   └── 2026-07.md
├── articles/
│   └── 2026-07/
│       ├── 2026-07-07-oneai-daily.md
│       ├── 2026-07-08-oneai-daily.md
│       ├── 2026-07-09-oneai-daily.md
│       ├── 2026-07-10-oneai-daily.md
│       └── 2026-07-11-oneai-daily.md
├── images/
│   └── 2026-07/
│       ├── 2026-07-07.md
│       ├── 2026-07-08.md
│       ├── 2026-07-09.md
│       ├── 2026-07-10.md
│       └── 2026-07-11.md
└── templates/
    ├── article-template.md
    └── image-plan-template.md
```

## Workflow

1. Add the target date to `calendar/YYYY-MM.md`.
2. Create or update the article file under `articles/YYYY-MM/`.
3. Create or update the image plan under `images/YYYY-MM/`.
4. Keep title, digest, cover image, and article image filenames aligned.
5. Use the app page `/ai/wechat` to render and create a WeChat draft.
6. Use `/ai/wechat/drafts` to verify draft status before publishing manually.

## Naming Rules

- Article draft: `articles/YYYY-MM/YYYY-MM-DD-oneai-daily.md`
- Image plan: `images/YYYY-MM/YYYY-MM-DD.md`
- Real image assets, when checked in later, should use:
  `images/YYYY-MM/YYYY-MM-DD/<sequence>-<slug>.<ext>`

Example:

```text
images/2026-07/2026-07-07/01-ai-policy-cover.png
images/2026-07/2026-07-07/02-enterprise-agent-stack.png
```
