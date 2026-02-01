import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', baseUrl));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, baseUrl));
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    const provider = data.user.app_metadata?.provider ?? 'github';
    const githubId = data.user.user_metadata?.sub ?? data.user.app_metadata?.provider_id;
    const githubUsername = data.user.user_metadata?.user_name ?? data.user.user_metadata?.login;

    if (profile && (githubId || githubUsername)) {
      await supabase
        .from('users')
        .update({
          github_id: githubId ? parseInt(String(githubId), 10) : null,
          github_username: githubUsername ?? null,
          email: data.user.email ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);
    }
  }

  return NextResponse.redirect(new URL(next, baseUrl));
}
