import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Tensai
        </h1>
        <p className="text-zinc-400 text-lg">
          AI-powered developer platform. Connect your GitHub repo, analyze the codebase, and prepare for AI-driven workflows.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/api/auth/github"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 px-6 py-3 font-medium hover:bg-zinc-200 transition"
          >
            Sign in with GitHub
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-600 text-zinc-300 px-6 py-3 font-medium hover:bg-zinc-800 transition"
          >
            Or paste repo URL
          </Link>
        </div>
      </div>
    </main>
  );
}
