# Storyblok Translation Workspace

This monorepo provides a production-ready toolkit for translating Storyblok stories with OpenAI structured outputs and a companion plugin UI for Storyblok editors.

## Packages

- **`packages/contracts`** – Zod schemas and TypeScript types shared across the workspace.
- **`packages/utils`** – Placeholder-safe helpers and deep object utilities.
- **`apps/api`** – Fastify API for running translation jobs, validating LLM output, updating Storyblok stories, and persisting logs with Prisma.
- **`apps/plugin-ui`** – Vite + React UI intended for embedding in a Storyblok plugin to trigger translations.

## Getting started

```bash
pnpm install
pnpm run prisma --filter @storyblok\api migrate deploy
```

> The Prisma command above creates the SQLite database defined in `apps/api/prisma/schema.prisma`.

### Environment variables

Copy the `.env.example` files to `.env` in the corresponding package and update the values.

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Server-side key for the OpenAI Responses API. |
| `STORYBLOK_MANAGEMENT_TOKEN` | Storyblok management API token with write access. |
| `DATABASE_URL` | Prisma connection string (defaults to SQLite file). |

> **Important:** Secrets are only required server-side. Never expose them in the plugin UI.

### Running the services

Run the API and plugin UI in parallel:

```bash
pnpm --filter @storyblok/api dev
pnpm --filter @storyblok/plugin-ui dev
```

The API listens on `http://localhost:4000` by default. The plugin UI runs on `http://localhost:5173` and calls the API using `VITE_API_BASE` (defaults to `http://localhost:4000`).

### Testing

```bash
pnpm test
```

Vitest runs placeholder validation tests and schema guards in the shared packages.

### Building for production

```bash
pnpm build
```

All workspace packages will emit production-ready output (compiled TypeScript, Vite assets).

## Storyblok updates

The API uses the Management API `Update a Story` endpoint. When `publish` is set to `true`, the request appends `?publish=1`. If a `groupId` is provided it is attached as `group_id` to manage alternates. Story content updates respect placeholder validation to prevent broken published pages.

## OpenAI structured outputs

Translations leverage the Responses API with a strict JSON schema. If the LLM returns invalid JSON, the API automatically retries once before surfacing an error.

## Repository scripts

- `pnpm dev` – Run all workspaces in parallel development mode.
- `pnpm build` – Compile every package/app.
- `pnpm test` – Execute the Vitest suites across the workspace.
- `pnpm lint` – Type-check every workspace.
