import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// DELETE log
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await query('DELETE FROM logs WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log DELETE error:', error);
    return NextResponse.json({ error: 'Log silinemedi' }, { status: 500 });
  }
}
