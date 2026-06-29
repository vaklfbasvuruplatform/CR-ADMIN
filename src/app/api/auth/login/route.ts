import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createToken, getAdminPassword } from '@/lib/auth';

// Default admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';


export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Simple authentication check
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = password === getAdminPassword();
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken(username);

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
