import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const onlineResult: any = await query('SELECT * FROM cevrimici_tablosu LIMIT 5');
    const logsResult: any = await query('SELECT ip, tutar, id FROM logs ORDER BY id DESC LIMIT 5');
    const cartItems: any = await query('SELECT * FROM cart_items LIMIT 5');
    
    return NextResponse.json({
      online: onlineResult,
      logs: logsResult,
      cart: cartItems
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
