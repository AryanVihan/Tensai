import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      scopes: 'repo read:user user:email',
    },
  });

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, baseUrl));
  }
  if (data?.url) {
    return NextResponse.redirect(data.url);
  }
  return NextResponse.redirect(new URL('/', baseUrl));
}
