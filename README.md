# Monty Hall Lab

One Monty Hall simulation engine with three interfaces: an interactive Vue app, a public Hono API, and a Node.js CLI.

The web app runs the shared TypeScript engine locally, so simulations are immediate. The API imports the same package for `curl` and other clients, while the CLI imports it for local terminal use.

## Architecture

```text
packages/simulation  Framework-independent simulation engine
apps/web             Vue 3 + Vite interface
apps/api             Hono API for Cloudflare Workers
apps/cli             Node.js command-line interface
```

## Local development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

The Vue app runs at `http://localhost:5173`.

Run the API separately:

```bash
pnpm dev:api
```

Run the CLI:

```bash
pnpm simulate --trials 10000 --strategy both --seed portfolio
pnpm simulate --trials 100 --json
```

## API

```bash
curl -X POST http://localhost:8787/api/simulate \
  -H 'Content-Type: application/json' \
  -d '{"trials":10000,"strategy":"both","seed":42}'
```

`strategy` accepts `stay`, `switch`, or `both`. Simulations are capped at 1,000,000 trials per request.

## Quality checks

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Deploy

The Worker configuration serves the built Vue app as static assets and runs API requests through Hono. After authenticating Wrangler with a Cloudflare account:

```bash
pnpm deploy
```

This produces a single deployment with the app at `/` and the JSON API at `/api`.
