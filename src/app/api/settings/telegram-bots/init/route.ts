import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS telegram_bots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bot_token VARCHAR(255) NOT NULL,
        chat_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    return NextResponse.json({ success: true, message: 'Telegram bots table created successfully' });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
