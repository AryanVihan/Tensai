'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

function ConnectContent() {
  const searchParams = useSearchParams();
  const repoParam = searchParams.get('repo') ?? '';
  const [status, setStatus] = useState<'idle' | 'need-auth' | 'connecting' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!repoParam) {
      setStatus('idle');
      return;
    }
    const check = async () => {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.user) {
        setStatus('need-auth');
        setMessage('Sign in with GitHub to connect this repository.');
        return;
      }
      setStatus('connecting');
      try {
        const connectRes = await fetch('/api/repos/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: repoParam }),
        });
        const connectData = await connectRes.json();
        if (!connectRes.ok) {
          setStatus('error');
          setMessage(connectData.error ?? 'Failed to connect repository.');
          return;
        }
        setStatus('done');
        setMessage('');
      } catch {
        setStatus('error');
        setMessage('Request failed.');
      }
    };
    check();
  }, [repoParam]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">Connect repository</h1>
        {repoParam && (
          <p className="text-zinc-400 text-sm break-all">Repo: {repoParam}</p>
        )}
        {status === 'idle' && !repoParam && (
          <p className="text-zinc-500">Add <code className="text-zinc-400">?repo=owner/repo</code> or use the login page.</p>
        )}
        {status === 'need-auth' && (
          <div>
            <p className="text-zinc-400 mb-4">{message}</p>
            <Link
              href={`/api/auth/github?next=${encodeURIComponent('/connect?repo=' + encodeURIComponent(repoParam))}`}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 px-6 py-3 font-medium hover:bg-zinc-200 transition"
            >
              Sign in with GitHub
            </Link>
          </div>
        )}
        {status === 'connecting' && (
          <p className="text-zinc-400">Connecting…</p>
        )}
        {status === 'done' && (
          <div>
            <p className="text-emerald-400 mb-4">Repository connected.</p>
            <Link href="/dashboard" className="text-emerald-500 hover:underline">Go to dashboard</Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p className="text-red-400 mb-4">{message}</p>
            <Link href="/dashboard" className="text-emerald-500 hover:underline">Dashboard</Link>
          </div>
        )}
        <p className="text-sm text-zinc-500">
          <Link href="/" className="hover:underline">Home</Link>
          {' · '}
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        </p>
      </div>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Loading…</div>}>
      <ConnectContent />
    </Suspense>
  );
}
