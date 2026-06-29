import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE() {
  try {
    await query('TRUNCATE TABLE input_logs');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear logs error:', error);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
}
