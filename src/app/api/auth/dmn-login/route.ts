import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

// Bu route Node.js runtime'da çalışır (Edge değil) — jwt kullanabilir
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const dmnCookie = request.cookies.get('dmn')?.value;

  // dmn cookie geçerli değilse login'e yönlendir
  if (dmnCookie !== 'dmn') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // JWT token oluştur
  const token = createToken('dmn');

  // Yönleneceği sayfa — varsayılan: /
  const redirectParam = request.nextUrl.searchParams.get('redirect') || '/';
  const redirectTo = decodeURIComponent(redirectParam);

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 saat
    path: '/',
  });

  return response;
}
