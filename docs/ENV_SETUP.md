# How to Get Your Environment Variables (Beginner Guide)

This guide walks you step-by-step through getting every value you need for your `.env.local` file. No prior experience required.

---

## What You’ll End Up With

You will create a file named `.env.local` in your project root with values like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
GITHUB_CLIENT_ID=Iv1.xxxxx
GITHUB_CLIENT_SECRET=xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
SECRETS_ENCRYPTION_KEY=your-32-byte-hex-key
```

Below is how to get each one.

---

## Part 1: Supabase Variables

Supabase hosts your database and handles login. You need three values from one project.

### Step 1: Create a Supabase account and project

1. Go to **[https://supabase.com](https://supabase.com)** and sign up (or log in).
2. Click **“New project”**.
3. Choose your **organization** (or create one).
4. Fill in:
   - **Name**: e.g. `tensai` (anything you like).
   - **Database password**: create a strong password and **save it somewhere safe** (you need it for DB access, not for `.env.local`).
   - **Region**: pick one close to you.
5. Click **“Create new project”** and wait until it says “Project is ready”.

### Step 2: Get your Supabase URL and keys

1. In the left sidebar, click **“Project Settings”** (gear icon at the bottom).
2. In the left menu under **“Project Settings”**, click **“API”**.
3. On the API page you’ll see:
   - **Project URL**  
     → Copy this. It’s your **`NEXT_PUBLIC_SUPABASE_URL`** (e.g. `https://abcdefgh.supabase.co`).
   - **Project API keys**:
     - **anon public**  
       → Copy this. It’s your **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (long string starting with `eyJ...`).
     - **service_role**  
       → Click **“Reveal”** and copy. This is your **`SUPABASE_SERVICE_ROLE_KEY`**.  
       ⚠️ **Important:** Never put this key in frontend code or share it. It bypasses Row Level Security.

Put these three in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Part 2: GitHub OAuth (for “Sign in with GitHub”)

Tensai uses GitHub only via **Supabase’s GitHub provider**. So you create a **GitHub OAuth App**, then paste its Client ID and Secret **into Supabase**, not into `.env.local`. Your app never needs `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` in `.env` unless you add a custom OAuth flow later.

For the **current setup** (Supabase handles GitHub login), do this:

### Step 1: Create a GitHub OAuth App

1. Log in to **GitHub**, then go to **[https://github.com/settings/developers](https://github.com/settings/developers)**.
2. Click **“OAuth Apps”** in the left sidebar, then **“New OAuth App”**.
3. Fill in:
   - **Application name**: e.g. `Tensai` (users will see this on the GitHub consent screen).
   - **Homepage URL**:  
     - Local: `http://localhost:3000`  
     - Later for production: `https://your-domain.com`
   - **Authorization callback URL**:  
     This **must** match what Supabase uses. Supabase’s callback is your app URL + `/auth/callback`.  
     - Local: **`http://localhost:3000/auth/callback`**  
     - Production: **`https://your-domain.com/auth/callback`**  
     You can add multiple callback URLs later in GitHub (one per line in “Callback URL” / app settings).
4. Click **“Register application”**.

### Step 2: Get the Client ID and Client Secret

1. On the new OAuth App page you’ll see **Client ID** (e.g. `Iv1.xxxxx`). Copy it.
2. Click **“Generate a new client secret”**, then copy the secret **once** (GitHub won’t show it again).

You will **paste these into Supabase** in the next part, not into `.env.local` for the default setup.

(If you ever need them in env for a custom flow, they would be:

```env
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Part 3: Connect GitHub to Supabase

1. In **Supabase Dashboard**, go to **“Authentication”** in the left sidebar.
2. Click **“Providers”**.
3. Find **“GitHub”** and turn it **ON**.
4. In the GitHub provider form you’ll see:
   - **Client ID (for OAuth)**  
     → Paste the **Client ID** from your GitHub OAuth App.
   - **Client Secret (for OAuth)**  
     → Paste the **Client Secret** you generated.
5. Click **“Save”**.

Your app will now use Supabase for “Sign in with GitHub”; Supabase uses your GitHub OAuth App in the background.

### Set the redirect URL Supabase uses

1. In Supabase, go to **“Authentication”** → **“URL Configuration”**.
2. Set **Site URL**:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - For production later: `https://your-domain.com/auth/callback`
4. Save.

---

## Part 4: App URL

This is the URL where your app runs.

- **Local development:**  
  Use:

  ```env
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- **Production:**  
  Replace with your real domain, e.g. `https://tensai.example.com`.

---

## Part 5: Secrets encryption key (optional but recommended)

Used to encrypt repo env/secrets in the database. If you skip this, the “add secret” feature will not work until you set it.

**Generate a 32-byte hex key (64 characters):**

- **Option A – Node (recommended)**  
  In a terminal, from your project folder:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  Copy the output (64 hex characters).

- **Option B – PowerShell**  
  You can use an online “random hex generator” set to 64 characters, or any tool that gives you 32 random bytes in hex. Store it somewhere safe.

Then in `.env.local`:

```env
SECRETS_ENCRYPTION_KEY=your-64-character-hex-string-here
```

---

## Final checklist: your `.env.local` file

1. In your project root (same folder as `package.json`), create a file named **`.env.local`** (with the leading dot).
2. Copy the contents from **`.env.example`** into `.env.local`.
3. Replace every placeholder with the values you collected:

| Variable | Where you got it |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (Reveal) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App → Client ID (only if you use them in app code) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App → Client secret (only if you use them in app code) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |
| `SECRETS_ENCRYPTION_KEY` | Generated 32-byte hex (e.g. via Node command above) |

4. Save the file. **Do not commit `.env.local` to Git** (it should already be in `.gitignore`).

---

## Quick reference: minimal `.env.local` for local dev

```env
# From Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Optional: only if your code reads these (Supabase uses them via Dashboard)
# GITHUB_CLIENT_ID=Iv1.xxxxx
# GITHUB_CLIENT_SECRET=xxxxx

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For encrypted repo secrets (generate with the Node command above)
SECRETS_ENCRYPTION_KEY=64-char-hex-here
```

---

## Troubleshooting

- **“Invalid API key”**  
  Double-check that you copied the full anon or service_role key from Supabase (no spaces, no line breaks).

- **GitHub login redirects to wrong URL or fails**  
  - In GitHub OAuth App: Authorization callback URL must be exactly `http://localhost:3000/auth/callback` (for local).  
  - In Supabase: Authentication → URL Configuration → Redirect URLs must include that same URL.

- **“Secrets encryption not configured”**  
  Add `SECRETS_ENCRYPTION_KEY` to `.env.local` (32-byte hex, 64 characters).

- **Changes to `.env.local` not applied**  
  Restart the dev server (`npm run dev`) after editing env variables.
