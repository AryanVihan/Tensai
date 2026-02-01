import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createOctokit, getTree } from '@/lib/github';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: repoId } = await params;
  const branch = request.nextUrl.searchParams.get('branch') ?? 'main';
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = (session as { provider_token?: string }).provider_token;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 });
  }

  const { data: repo } = await supabase
    .from('connected_repositories')
    .select('owner, repo')
    .eq('id', repoId)
    .eq('user_id', session.user.id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  const octokit = createOctokit(token);
  try {
    const ref = await octokit.rest.git.getRef({
      owner: repo.owner,
      repo: repo.repo,
      ref: `heads/${branch}`,
    });
    const commitRes = await octokit.rest.repos.getCommit({
      owner: repo.owner,
      repo: repo.repo,
      ref: ref.data.object.sha,
    });
    const treeSha = commitRes.data.commit.tree.sha;
    const tree = await getTree(octokit, repo.owner, repo.repo, treeSha, true);
    return NextResponse.json({ branch, tree });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tree';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
