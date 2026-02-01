# Create Tensai Tables in Supabase

The error **"Could not find the table 'public.connected_repositories' in the schema cache"** means the database tables haven’t been created yet. Create them by running the migration in Supabase.

## Option 1: Supabase Dashboard (recommended)

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and select your project.
2. In the left sidebar, go to **SQL Editor**.
3. Click **New query**.
4. Copy the **entire** contents of the file **`supabase/migrations/001_initial_schema.sql`** (in this repo) and paste it into the editor.
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter).
6. You should see “Success. No rows returned.” (creating tables doesn’t return rows).

After this, the tables `public.users`, `public.connected_repositories`, `public.repo_analysis_results`, and `public.repo_secrets` will exist and the app should work.

## Option 2: Supabase CLI

If you use the Supabase CLI and have linked your project:

```bash
npx supabase db push
```

Or, from the project root:

```bash
supabase db push
```

---

**If you get an error** (e.g. “relation already exists”), some objects may already exist. You can run the migration again; it uses `create table if not exists` and `create or replace` where possible, so re-running is usually safe.
