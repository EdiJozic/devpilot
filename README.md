# DevPilot

DevPilot is a dark-first developer workspace for projects, tasks, bugs, analytics, GitHub activity, and an AI development assistant. It is built with Next.js App Router, TypeScript, Tailwind CSS, Lucide, Recharts, Zod, React Hook Form dependencies, and Supabase-ready authentication/database scaffolding.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without credentials, the app opens in demo mode. Projects, tasks, and bugs are fully interactive and persist in this browser's local storage. Demo workspace data is not shared across browsers or accounts.

## Configure Supabase

1. Create a Supabase project and copy its project URL and public anon key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Apply [`supabase/migrations/202611020001_initial_schema.sql`](./supabase/migrations/202611020001_initial_schema.sql) in the Supabase SQL editor or with the Supabase CLI.
3. Configure the Supabase Auth email provider and redirect URLs for your local and deployed origins.
4. Visit `/login` to sign up, sign in, or request a password reset. The migration creates owner-scoped tables and row-level security policies.

Do not expose a Supabase service-role key in client code. The local demo CRUD remains browser-local; production data persistence should use the Supabase tables with the included ownership policies before enabling multi-user workspaces.

## Configure the AI assistant

Add `OPENAI_API_KEY` to `.env.local` to enable the server-side chat-completions integration. The key is read only by the API route and is never sent to the browser. `OPENAI_API_URL` and `OPENAI_MODEL` can be overridden for a compatible provider. Without a key, the assistant returns deterministic responses based on the submitted workspace context.

Requests are validated with Zod, bounded in size, and sent with a server-side timeout. Provider errors are returned explicitly rather than hidden behind demo responses.

## Configure GitHub OAuth

1. Create a GitHub OAuth App and set its callback URL to `http://localhost:3000/api/github/callback` (or your deployed callback URL).
2. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL` on the server.
3. Use **GitHub → Connect GitHub** in DevPilot. OAuth state is validated and the access token is stored in a short-lived HttpOnly, SameSite cookie scoped to the GitHub API routes.

The connected repositories endpoint calls GitHub's official REST API from the server. Never add OAuth client secrets or access tokens to `NEXT_PUBLIC_*` variables. For production token persistence, use encrypted server-side storage (the migration provides an encrypted-token column and owner-scoped connection table).

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test:e2e
npm start
```

The Playwright suite covers the demo sign-in, project creation, Kanban drag-and-drop, bug resolution, analytics view, sign-out, and assistant input validation. Install the browser once with `npx playwright install chromium` if it is not already available.

## Deployment

Deploy the app to Vercel by importing the project directory and adding the server and public environment variables above. Set the production GitHub OAuth callback to `https://YOUR_DOMAIN/api/github/callback`, configure the same URL in GitHub, and add production redirect URLs in Supabase Auth. Apply database migrations before enabling accounts. No integration is considered connected until its credentials are configured and the OAuth/database flow completes successfully.

## Current integration boundaries

- **Available now:** responsive workspace UI, interactive local CRUD, native drag-and-drop task board, status and priority filters, charts, demo assistant, Supabase Auth flows when credentials exist, server-side GitHub OAuth with repository, commit, branch, and pull-request views when configured, and Playwright E2E coverage.
- **Requires configuration / further production wiring:** Supabase-backed persistence for workspace entities, encrypted durable GitHub-token storage, provider-specific AI model selection, and deployment credentials.
# devpilot
