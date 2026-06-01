import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Refresca el token de Supabase y protege rutas privadas */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isPublic =
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/activate') ||
    url.pathname.startsWith('/forgot') ||
    url.pathname.startsWith('/reset') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/');

  if (!user && !isPublic) {
    const redirect = url.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', url.pathname);
    return NextResponse.redirect(redirect);
  }
  if (user && url.pathname === '/login') {
    const redirect = url.clone(); redirect.pathname = '/dashboard'; redirect.search = '';
    return NextResponse.redirect(redirect);
  }
  return response;
}
