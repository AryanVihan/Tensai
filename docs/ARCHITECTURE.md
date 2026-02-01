# Tensai Architecture Overview

## Summary

Tensai is an AI-powered developer platform with GitHub-first onboarding. Users connect repositories via GitHub OAuth, analyze codebases, and prepare them for AI-driven workflows. The system is designed for scalability with clear separation between frontend, backend, and future AI agents.

---

## 1. Architecture Diagram (Logical)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Auth (OAuth)│ │ Dashboard   │ │ Repo Connect│ │ Env/Secrets UI       │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘   │
└─────────┼───────────────┼───────────────┼────────────────────┼──────────────┘
          │               │               │                    │
          ▼               ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Next.js API / Server)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Supabase    │ │ GitHub API  │ │ Repo Clone  │ │ Secrets (encrypted)  │   │
│  │ Auth + DB   │ │ (Octokit)   │ │ & Indexing  │ │ never to GitHub      │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘   │
└─────────┼───────────────┼───────────────┼────────────────────┼──────────────┘
          │               │               │                    │
          ▼               ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SUPABASE          │ GITHUB              │ FILESYSTEM (tmp)   │ VAULT / KMS   │
│ - auth.users      │ - OAuth, API        │ - clone workspace  │ - env vars    │
│ - public.*        │ - repo metadata     │ - project detect   │ - API keys    │
└───────────────────┴────────────────────┴────────────────────┴───────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ FUTURE: AI AGENTS                                                             │
│ - Read repo context (from DB + clone)                                        │
│ - Modify files (via backend, never direct)                                    │
│ - Create pull requests (GitHub API)                                          │
│ - Run validations before changes (CI / hooks)                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Auth + Data Flow

### 2.1 GitHub OAuth Flow

1. User clicks **Sign in with GitHub** → redirect to Supabase Auth (GitHub provider) or dedicated `/api/auth/github` that redirects to GitHub OAuth.
2. GitHub redirects back to callback URL with `code`.
3. Backend exchanges `code` for access token; Supabase stores provider tokens; we map `github_id` ↔ Tensai user in `public.users` or `auth.users` metadata.
4. Session is established via Supabase Auth (JWT). All API calls use this session.

### 2.2 Repository Connection Flow

1. User pastes **GitHub repository URL** (or selects from GitHub API list).
2. Frontend calls `POST /api/repos/connect` with `owner/repo` or full URL.
3. Backend checks GitHub token (from session) and fetches:
   - Repository metadata (name, owner, language, size)
   - Branches, file tree, high-level commit history
4. Backend stores minimal metadata in Supabase (`connected_repositories`).
5. Optionally: backend clones repo to secure workspace and runs analysis; results stored in `repo_analysis_results`.

### 2.3 Secrets Flow

1. User enters env vars / API keys only in **Tensai UI** (never from repo `.env`).
2. Frontend sends to `POST /api/secrets` (or Supabase Edge Function with encryption).
3. Backend encrypts (Supabase Vault or application-level encryption) and stores in `user_secrets` or `repo_env_variables` keyed by user + repo.
4. Secrets are **never** committed back to GitHub; only provided at runtime to AI/agents when needed.

---

## 3. API Design (High Level)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/session` | Current user (Supabase session) |
| GET | `/api/auth/github` | Redirect to GitHub OAuth |
| GET | `/api/auth/callback` | OAuth callback; create/update user |
| GET | `/api/repos` | List connected repos for user |
| POST | `/api/repos/connect` | Connect repo (URL or owner/repo); fetch metadata |
| GET | `/api/repos/[id]` | Repo detail + metadata |
| POST | `/api/repos/[id]/analyze` | Clone (if needed), detect stack, generate summary |
| GET | `/api/repos/[id]/analysis` | Get latest analysis result |
| GET | `/api/repos/[id]/tree` | File tree (from GitHub API or clone) |
| POST | `/api/secrets` | Upsert encrypted env/secrets for repo |
| GET | `/api/secrets` | List keys only (no values) for UI |

All API routes require authenticated session (Supabase JWT).

---

## 4. Security Considerations

- **OAuth only**: No PATs; short-lived tokens and refresh via Supabase/GitHub.
- **Secrets**: Never read `.env` from repo into logs or UI; user-provided secrets only; encrypted at rest (Supabase Vault or AES); never in client bundle.
- **Clone workspace**: Use isolated temp dir; delete after analysis; no execution of untrusted code from repo.
- **RLS**: Supabase Row Level Security so users see only their repos and secrets.
- **CORS / CSP**: Restrict API and assets to Tensai origins.
- **AI agents**: Future agents get repo context and secrets only through backend APIs; no direct DB or GitHub access from untrusted code.

---

## 5. Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| **Frontend** | Auth UI, dashboard, repo URL input, analysis display, env/secrets input (values not logged). |
| **Backend** | OAuth callback, GitHub API, clone & indexing, project/stack detection, storing analysis, encrypting/decrypting secrets. |
| **Supabase** | User auth, DB (users, repos, analysis, secrets schema), RLS. |
| **AI agents (future)** | Consume repo context and secrets via backend; propose changes; backend creates PRs and runs validations. |

---

## 6. Database Tables (Supabase)

- **users** (or use `auth.users` + profile): `id`, `github_id`, `email`, `avatar_url`, `created_at`, `updated_at`.
- **connected_repositories**: `id`, `user_id`, `owner`, `repo`, `default_branch`, `metadata` (jsonb), `created_at`.
- **repo_analysis_results**: `id`, `repo_id`, `project_type`, `tech_stack` (jsonb), `entry_points` (jsonb), `summary` (text), `created_at`.
- **repo_secrets**: `id`, `repo_id`, `user_id`, `key_name`, `encrypted_value`, `created_at` (values never in logs).

See `supabase/migrations/` for exact SQL.
