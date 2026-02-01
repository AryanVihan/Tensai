You are a senior full-stack architect building Tensai, an AI-powered developer platform.
Your task is to design and implement GitHub-first onboarding for the Tensai web application.

Context

Tensai allows users to connect a GitHub repository, analyze its structure, understand the codebase using AI, and prepare it for further AI-driven workflows.

Requirements
1. GitHub Authentication

Use GitHub OAuth (not personal access tokens).

Allow the user to:

Sign in with GitHub or

Paste a GitHub repository URL.

After authentication, securely fetch:

Repository metadata (name, owner, language, size)

Branches

File tree

Commit history (high level)

2. Repository Cloning & Indexing

Once access is granted:

Clone the repository into a secure backend workspace.

Detect:

Project type (frontend, backend, full-stack, ML, etc.)

Tech stack (frameworks, languages, package managers)

Entry points and config files

Generate a repo understanding summary for Tensai.

3. Secure Environment Handling

Do NOT expose secrets from the repository.

Create UI input boxes for:

Environment variables (.env equivalent)

API keys and secrets (user-provided only)

Ensure secrets are stored securely and never committed back to GitHub.

4. Supabase Integration

Connect Supabase for:

User authentication mapping (GitHub ↔ Tensai user)

Repository metadata storage

Encrypted environment variables

Design database tables for:

Users

Connected repositories

Repo analysis results

5. Extensibility

Design the system so future AI agents can:

Read repo context

Modify files

Create pull requests

Run validations before changes

Output Expectations

Architecture overview

Auth + data flow explanation

API design (high level)

Security considerations

Clear separation between frontend, backend, and AI agents

Build this as if Tensai is a scalable startup product, not a demo.