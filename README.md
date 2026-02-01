# Tensai

AI-powered developer platform with **GitHub-first onboarding**: connect a repository, analyze its structure, understand the codebase with AI, and prepare it for AI-driven workflows.

## Features

- **GitHub Authentication** – Sign in with GitHub (OAuth) or paste a repository URL
- **Repository metadata** – Fetch name, owner, language, size, branches, file tree, commit history
- **Repo cloning & indexing** – Detect project type (frontend, backend, full-stack, ML, etc.), tech stack, entry points, config files; generate a repo understanding summary
- **Secure environment handling** – User-provided env vars and API keys only; stored encrypted; never read from or committed to the repo
- **Supabase** – User auth mapping (GitHub ↔ Tensai), repository metadata, encrypted secrets, RLS
- **Extensibility** – Designed so future AI agents can read repo context, modify files, create PRs, and run validations via backend APIs

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:

- Architecture overview
- Auth and data flow
- API design
- Security considerations
- Separation of frontend, backend, and AI agents

## Setup

### 1. Dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

- **Supabase** – Create a project at [supabase.com](https://supabase.com). Enable GitHub in Authentication → Providers and set your GitHub OAuth App Client ID and Secret in the Supabase dashboard. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- **GitHub OAuth** – Create a [GitHub OAuth App](https://github.com/settings/developers). Set Authorization callback URL to `https://your-app-url/auth/callback` (and for local dev, `http://localhost:3000/auth/callback`). Put Client ID and Secret in Supabase’s GitHub provider (Supabase handles the OAuth flow).
- **App URL** – `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` for dev).
- **Secrets encryption** – For repo env/secrets, set `SECRETS_ENCRYPTION_KEY` to a 32-byte hex string (64 chars). Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### 3. Supabase database

Run the migration:

```bash
npx supabase db push
```

Or apply `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.

In Supabase Dashboard → Authentication → URL Configuration, set:

- **Site URL** – your app URL (e.g. `http://localhost:3000`)
- **Redirect URLs** – add `http://localhost:3000/auth/callback` and your production callback URL

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with GitHub or go to **Or paste repo URL** to connect a repository.

## API (high level)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/session` | Current user |
| GET | `/api/auth/github` | Redirect to GitHub OAuth |
| POST | `/api/auth/signout` | Sign out |
| POST | `/api/repos/connect` | Connect repo (body: `{ "repo": "owner/repo" }`) |
| GET | `/api/repos/[id]/tree?branch=main` | File tree |
| POST | `/api/repos/[id]/analyze` | Run analysis (project type, tech stack, summary) |
| GET | `/api/secrets?repoId=...` | List secret keys (no values) |
| POST | `/api/secrets` | Upsert secret (body: `{ "repoId", "key", "value" }`) |

## Extensibility for AI agents

The system is designed so that future AI agents can:

- **Read repo context** – Via stored analysis (project type, tech stack, entry points) and file tree/contents from GitHub API or backend workspace.
- **Modify files** – Through backend APIs that apply edits (no direct repo access from untrusted code).
- **Create pull requests** – Backend uses GitHub API with the user’s token (or a bot token) to open PRs.
- **Run validations** – Backend runs linters/tests in a sandbox before applying changes or creating PRs.

Secrets are only provided to backend logic; agents receive env keys/values only through secure backend APIs, never from the repo’s `.env`.

## Security

- OAuth only (no PATs).
- User-provided secrets only; never read or expose `.env` from the repo.
- Secrets encrypted at rest (`SECRETS_ENCRYPTION_KEY`); never logged or returned in API responses.
- Supabase RLS so users only see their own repos and secrets.
- Clone/analysis runs in backend; no execution of untrusted repo code.

## License

Private / use as needed.
