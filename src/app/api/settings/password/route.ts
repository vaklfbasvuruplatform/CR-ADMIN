import { NextRequest, NextResponse } from 'next/server';
import { updateAdminPassword } from '@/lib/auth';



export async function PUT(request: NextRequest) {
  try {
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalı' },
        { status: 400 }
      );
    }

    // Update password directly without requiring old password
    updateAdminPassword(newPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json({ error: 'Şifre güncellenemedi' }, { status: 500 });
  }
}


