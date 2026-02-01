import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RepoDetailClient } from './RepoDetailClient';

type Params = { params: Promise<{ id: string }> };

export default async function RepoPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: repo } = await supabase
    .from('connected_repositories')
    .select('id, owner, repo, default_branch, metadata')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!repo) notFound();

  const { data: analysis } = await supabase
    .from('repo_analysis_results')
    .select('id, project_type, tech_stack, entry_points, config_files, summary, created_at')
    .eq('repo_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: secretKeys } = await supabase
    .from('repo_secrets')
    .select('key_name')
    .eq('repo_id', id)
    .eq('user_id', user.id);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-8">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm mb-2 inline-block">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">{repo.owner}/{repo.repo}</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Branch: {repo.default_branch ?? 'main'} · {(repo.metadata as { language?: string })?.language ?? '—'}
        </p>
      </header>

      <RepoDetailClient
        repoId={repo.id}
        owner={repo.owner}
        repo={repo.repo}
        defaultBranch={repo.default_branch ?? 'main'}
        analysis={analysis ?? null}
        secretKeys={secretKeys?.map((s) => s.key_name) ?? []}
      />
    </main>
  );
}
