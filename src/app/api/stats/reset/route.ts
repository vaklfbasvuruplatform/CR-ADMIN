import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE - reset stats
// ?type=visitors  -> DELETE FROM cevrimici_tablosu
// ?type=cart      -> DELETE FROM cart_items
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'visitors') {
      await query('DELETE FROM cevrimici_tablosu');
      return NextResponse.json({ success: true, message: 'Ziyaretçi sayısı sıfırlandı' });
    } else if (type === 'cart') {
      await query('DELETE FROM cart_items');
      return NextResponse.json({ success: true, message: 'Sepet sayısı sıfırlandı' });
    } else {
      return NextResponse.json({ error: 'Geçersiz tip. "visitors" veya "cart" kullanın.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Stats reset error:', error);
    return NextResponse.json({ error: 'Sıfırlama başarısız' }, { status: 500 });
  }
}
