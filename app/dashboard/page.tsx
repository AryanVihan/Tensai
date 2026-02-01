import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: repos } = await supabase
    .from('connected_repositories')
    .select('id, owner, repo, default_branch, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Tensai</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm">{user.email ?? user.id.slice(0, 8)}</span>
          <form action="/api/auth/signout" method="POST" className="inline">
            <button
              type="submit"
              className="rounded-lg border border-zinc-600 text-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/connect"
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition"
          >
            Connect repo
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Connected repositories</h2>
        {!repos?.length ? (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-8 text-center text-zinc-400">
            No repositories connected yet.{' '}
            <Link href="/connect" className="text-emerald-500 hover:underline">Connect one</Link> or{' '}
            <Link href="/login" className="text-emerald-500 hover:underline">paste a repo URL</Link>.
          </div>
        ) : (
          <ul className="space-y-3">
            {repos.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/repos/${r.id}`}
                  className="block rounded-xl border border-zinc-700 bg-zinc-900/50 p-4 hover:border-zinc-600 transition"
                >
                  <span className="font-medium text-zinc-100">{r.owner}/{r.repo}</span>
                  {r.default_branch && (
                    <span className="ml-2 text-zinc-500 text-sm">branch: {r.default_branch}</span>
                  )}
                  {r.metadata && typeof r.metadata === 'object' && 'language' in r.metadata && (
                    <span className="ml-2 text-zinc-500 text-sm">
                      · {(r.metadata as { language?: string }).language ?? '—'}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
