# Deplogram

A lightweight developer cloud: the marketing site (`/`) and the product app, **Your Galley** (`/dashboard`).

**Using an AI assistant (Claude, ChatGPT…)? Paste [`docs/project-guide-for-ai.md`](docs/project-guide-for-ai.md) first.**
It lists what already exists (the logo, colours, icons, buttons, forms, auth and data hooks), so the AI reuses
them instead of inventing new ones.

## Run it

```bash
bun install
cp .env.example .env.local   # set NEXT_PUBLIC_API_MOCKING=enabled to use the mock API
bun dev                       # http://localhost:3000
```

Bun only — not npm, pnpm or yarn.

## Docs

| File | What's in it |
|---|---|
| [`docs/project-guide-for-ai.md`](docs/project-guide-for-ai.md) | Structure, stack, components to reuse, rules. Start here. |
| [`docs/product-blueprint.md`](docs/product-blueprint.md) | What the product is, naming and tone |
| [`docs/design-system.md`](docs/design-system.md) | Marketing-site design rules |
| [`docs/deplogram-design-system.md`](docs/deplogram-design-system.md) | How the app UI was designed: tokens, motion, patterns |
