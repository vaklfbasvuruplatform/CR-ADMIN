import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: HARD mod durumunu oku
export async function GET() {
  try {
    const result: any = await query(
      "SELECT value FROM site_settings WHERE key_name = 'hard_mode' LIMIT 1"
    );
    const isHard = result?.[0]?.value === '1';
    return NextResponse.json({ hard_mode: isHard });
  } catch {
    return NextResponse.json({ hard_mode: false });
  }
}

// PUT: HARD mod durumunu güncelle
export async function PUT(req: NextRequest) {
  try {
    const { hard_mode } = await req.json();
    const val = hard_mode ? '1' : '0';
    await query(
      `INSERT INTO site_settings (key_name, value) VALUES ('hard_mode', ?)
       ON DUPLICATE KEY UPDATE value = ?`,
      [val, val]
    );
    return NextResponse.json({ success: true, hard_mode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
