import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  parseRepoUrl,
  createOctokit,
  getRepoMeta,
  getBranches,
  getTree,
  getCommitHistory,
} from '@/lib/github';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = (session as { provider_token?: string }).provider_token;
  if (!token) {
    return NextResponse.json(
      { error: 'GitHub token not found. Sign in again with GitHub.' },
      { status: 400 }
    );
  }

  // Ensure current user exists in public.users (required by connected_repositories FK)
  await supabase.from('users').upsert(
    {
      id: session.user.id,
      email: session.user.email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  let body: { repo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const repoInput = body.repo?.trim();
  if (!repoInput) {
    return NextResponse.json({ error: 'Missing repo (URL or owner/repo)' }, { status: 400 });
  }

  const parsed = parseRepoUrl(repoInput);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid repo URL or owner/repo' }, { status: 400 });
  }

  const owner = parsed.owner;
  const repo = parsed.repo;
  const octokit = createOctokit(token);

  try {
    const meta = await getRepoMeta(octokit, owner, repo);
    const branches = await getBranches(octokit, owner, repo);
    const defaultBranch = meta.defaultBranch;
    let commits: { sha: string; message: string; author: string | null; date: string }[] = [];

    try {
      const ref = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      const treeSha = ref.data.object.sha;
      const commit = await octokit.rest.repos.getCommit({ owner, repo, ref: treeSha });
      const commitTreeSha = commit.data.commit.tree.sha;
      await getTree(octokit, owner, repo, commitTreeSha, true);
      commits = await getCommitHistory(octokit, owner, repo, defaultBranch, 20);
    } catch {
      // branch or tree might not be available
    }

    const { data: existing } = await supabase
      .from('connected_repositories')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('owner', owner)
      .eq('repo', repo)
      .single();

    const metadata = {
      language: meta.language,
      size: meta.size,
      description: meta.description,
      private: meta.private,
      branches: branches.slice(0, 50).map((b) => b.name),
      commitCount: commits.length,
    };

    if (existing) {
      await supabase
        .from('connected_repositories')
        .update({
          default_branch: defaultBranch,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      return NextResponse.json({ repoId: existing.id, owner, repo, defaultBranch, metadata });
    }

    const { data: inserted, error } = await supabase
      .from('connected_repositories')
      .insert({
        user_id: session.user.id,
        owner,
        repo,
        default_branch: defaultBranch,
        metadata,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      repoId: inserted.id,
      owner,
      repo,
      defaultBranch,
      metadata,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
