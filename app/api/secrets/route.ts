import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { encryptSecret } from '@/lib/secrets';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const repoId = request.nextUrl.searchParams.get('repoId');
  if (!repoId) {
    return NextResponse.json({ error: 'Missing repoId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('repo_secrets')
    .select('key_name')
    .eq('repo_id', repoId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ keys: (data ?? []).map((r) => r.key_name) });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { repoId?: string; key?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { repoId, key, value } = body;
  if (!repoId || !key?.trim()) {
    return NextResponse.json({ error: 'Missing repoId or key' }, { status: 400 });
  }

  const { data: repo } = await supabase
    .from('connected_repositories')
    .select('id')
    .eq('id', repoId)
    .eq('user_id', user.id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
  }

  let encrypted: string;
  try {
    encrypted = encryptSecret(value ?? '');
  } catch (e) {
    return NextResponse.json(
      { error: 'Secrets encryption not configured. Set SECRETS_ENCRYPTION_KEY.' },
      { status: 503 }
    );
  }

  const { error: upsertError } = await supabase
    .from('repo_secrets')
    .upsert(
      {
        repo_id: repoId,
        user_id: user.id,
        key_name: key.trim(),
        encrypted_value: encrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'repo_id,key_name' }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
