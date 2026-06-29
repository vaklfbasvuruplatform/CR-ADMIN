import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const threshold = Date.now() - 3000;
    
    // 2. Count online visitors (active in last 3 seconds)
    const onlineResult: any = await query(
      'SELECT COUNT(*) as count FROM cevrimici_tablosu WHERE CAST(onlineTimer AS UNSIGNED) >= ?',
      [threshold]
    );
    const onlineCount = onlineResult[0]?.count || 0;
    
    // 3. Count total cart items (total records in table)
    const cartResult: any = await query(
      'SELECT COUNT(*) as count FROM cart_items'
    );
    const cartCount = cartResult[0]?.count || 0;

    return NextResponse.json({
      online: onlineCount,
      cart: cartCount
    });
  } catch (error) {
    console.error('Header stats error:', error);
    // Return 0s on error to prevent breaking UI
    return NextResponse.json({ online: 0, cart: 0 }, { status: 500 });
  }
}
