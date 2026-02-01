'use client';

import { useState } from 'react';
import Link from 'next/link';

type Analysis = {
  id: string;
  project_type: string | null;
  tech_stack: unknown;
  entry_points: unknown;
  config_files: unknown;
  summary: string | null;
  created_at: string;
} | null;

type Props = {
  repoId: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  analysis: Analysis;
  secretKeys: string[];
};

export function RepoDetailClient({ repoId, owner, repo, defaultBranch, analysis, secretKeys }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(analysis);
  const [secrets, setSecrets] = useState(secretKeys);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [savingSecret, setSavingSecret] = useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.analysis) setAnalysisResult(data.analysis);
    } finally {
      setAnalyzing(false);
    }
  };

  const addSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSavingSecret(true);
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId, key: newKey.trim(), value: newValue }),
      });
      if (res.ok) {
        setSecrets((prev) => (prev.includes(newKey.trim()) ? prev : [...prev, newKey.trim()]));
        setNewKey('');
        setNewValue('');
      }
    } finally {
      setSavingSecret(false);
    }
  };

  const techStack = (analysisResult?.tech_stack as { name: string }[]) ?? [];
  const entryPoints = (analysisResult?.entry_points as string[]) ?? [];
  const configFiles = (analysisResult?.config_files as string[]) ?? [];

  return (
    <div className="space-y-10">
      {/* Analysis */}
      <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-200">Repo understanding</h2>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition"
          >
            {analyzing ? 'Analyzing…' : 'Run / refresh analysis'}
          </button>
        </div>
        {analysisResult ? (
          <div className="space-y-3 text-sm">
            <p><span className="text-zinc-500">Project type:</span> {analysisResult.project_type ?? '—'}</p>
            {techStack.length > 0 && (
              <p><span className="text-zinc-500">Tech stack:</span> {techStack.map((t) => t.name).join(', ')}</p>
            )}
            {entryPoints.length > 0 && (
              <p><span className="text-zinc-500">Entry points:</span> {entryPoints.join(', ')}</p>
            )}
            {configFiles.length > 0 && (
              <p><span className="text-zinc-500">Config files:</span> {configFiles.join(', ')}</p>
            )}
            {analysisResult.summary && (
              <p className="text-zinc-300 mt-2">{analysisResult.summary}</p>
            )}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">Run analysis to detect project type, tech stack, and generate a summary.</p>
        )}
      </section>

      {/* Environment / Secrets (user-provided only) */}
      <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-zinc-200 mb-2">Environment variables & secrets</h2>
        <p className="text-zinc-500 text-sm mb-4">
          Add keys and values here only. We never read or expose .env from your repo. Stored encrypted.
        </p>
        {secrets.length > 0 && (
          <ul className="mb-4 text-sm text-zinc-400">
            {secrets.map((k) => (
              <li key={k} className="font-mono">{k}</li>
            ))}
          </ul>
        )}
        <form onSubmit={addSecret} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="KEY_NAME"
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none w-40"
          />
          <input
            type="password"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none flex-1 min-w-[120px]"
          />
          <button
            type="submit"
            disabled={savingSecret || !newKey.trim()}
            className="rounded-lg bg-zinc-700 text-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-600 disabled:opacity-50 transition"
          >
            {savingSecret ? 'Saving…' : 'Add'}
          </button>
        </form>
      </section>

      {/* Links */}
      <section className="text-sm text-zinc-500">
        <a
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-500 hover:underline"
        >
          Open on GitHub
        </a>
        {' · '}
        <Link href={`/api/repos/${repoId}/tree?branch=${encodeURIComponent(defaultBranch)}`} className="text-emerald-500 hover:underline" target="_blank">
          File tree (API)
        </Link>
      </section>
    </div>
  );
}
