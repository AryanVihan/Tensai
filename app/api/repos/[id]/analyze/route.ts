import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createOctokit, getTree } from '@/lib/github';
import { analyzeFromTree } from '@/lib/analyzer';
import type { TreeEntry } from '@/lib/github';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: { params: RouteParams['params'] }) {
  const { id: repoId } = await context.params;
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

  const { data: repo } = await supabase
    .from('connected_repositories')
    .select('id, owner, repo, default_branch')
    .eq('id', repoId)
    .eq('user_id', session.user.id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  const octokit = createOctokit(token);
  const owner = repo.owner;
  const repoName = repo.repo;
  const branch = repo.default_branch ?? 'main';

  try {
    const ref = await octokit.rest.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${branch}`,
    });
    const commitRes = await octokit.rest.repos.getCommit({
      owner,
      repo: repoName,
      ref: ref.data.object.sha,
    });
    const treeSha = commitRes.data.commit.tree.sha;
    const rawTree = await getTree(octokit, owner, repoName, treeSha, true);
    const treeEntries: TreeEntry[] = rawTree.map((t) => ({
      path: t.path,
      type: t.type,
      sha: t.sha,
      size: t.size,
    }));
    const analysis = analyzeFromTree(treeEntries);

    const { data: inserted, error } = await supabase
      .from('repo_analysis_results')
      .insert({
        repo_id: repoId,
        project_type: analysis.projectType,
        tech_stack: analysis.techStack,
        entry_points: analysis.entryPoints,
        config_files: analysis.configFiles,
        summary: analysis.summary,
        raw_tree: rawTree.slice(0, 500),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ analysis: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
