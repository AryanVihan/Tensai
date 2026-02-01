import { Octokit } from 'octokit';

export type RepoMeta = {
  name: string;
  owner: string;
  fullName: string;
  defaultBranch: string;
  language: string | null;
  size: number;
  description: string | null;
  private: boolean;
};

export type BranchRef = { name: string; sha: string };

export type TreeEntry = {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
};

export type CommitSummary = {
  sha: string;
  message: string;
  author: string | null;
  date: string;
};

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function getRepoMeta(octokit: Octokit, owner: string, repo: string): Promise<RepoMeta> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    name: data.name,
    owner: data.owner.login,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    language: data.language,
    size: data.size,
    description: data.description ?? null,
    private: data.private,
  };
}

export async function getBranches(octokit: Octokit, owner: string, repo: string): Promise<BranchRef[]> {
  const { data } = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
  return data.map((b) => ({ name: b.name, sha: b.commit.sha }));
}

export async function getTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  treeSha: string,
  recursive = true
): Promise<TreeEntry[]> {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: recursive ? 'true' : undefined,
  });
  return (data.tree ?? []).map((t) => ({
    path: t.path ?? '',
    type: (t.type ?? 'blob') as 'blob' | 'tree',
    sha: t.sha ?? '',
    size: t.size ?? undefined,
  }));
}

export async function getCommitHistory(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  perPage = 30
): Promise<CommitSummary[]> {
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: perPage,
  });
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message?.split('\n')[0] ?? '',
    author: c.commit.author?.name ?? null,
    date: c.commit.author?.date ?? '',
  }));
}

/** Parse owner/repo from URL or "owner/repo" string */
export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/?#]+)(?:\/)?/i
  );
  if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  const slash = trimmed.match(/^([^/]+)\/([^/]+)$/);
  if (slash) return { owner: slash[1], repo: slash[2] };
  return null;
}
