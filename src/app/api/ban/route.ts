export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all banned IPs
export async function GET() {
  try {
    const bannedIps = await query('SELECT ip FROM cevrimici_tablosu WHERE ban = 1');
    return NextResponse.json(bannedIps);
  } catch (error) {
    console.error('Ban GET error:', error);
    return NextResponse.json({ error: 'Ban listesi yüklenemedi' }, { status: 500 });
  }
}

// PUT unban single IP
export async function PUT(request: Request) {
  try {
    const { ip } = await request.json();
    if (!ip) {
      return NextResponse.json({ error: 'IP gerekli' }, { status: 400 });
    }

    await query('UPDATE cevrimici_tablosu SET ban = NULL WHERE ip = ?', [ip]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unban error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}

// DELETE unban ALL
export async function DELETE() {
  try {
    await query('UPDATE cevrimici_tablosu SET ban = NULL');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unban All error:', error);
    return NextResponse.json({ error: 'Toplu işlem başarısız' }, { status: 500 });
  }
}
