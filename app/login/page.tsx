'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) return;
    router.push(`/connect?repo=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">Connect a repository</h1>
          <p className="mt-2 text-zinc-400 text-sm">
            Sign in with GitHub first, or paste a public repo URL to get started.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo or owner/repo"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 text-white px-4 py-3 font-medium hover:bg-emerald-500 transition"
          >
            Continue
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="text-emerald-500 hover:underline">Back to home</Link>
        </p>
      </div>
    </main>
  );
}
