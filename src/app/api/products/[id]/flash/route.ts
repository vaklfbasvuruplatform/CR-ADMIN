import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT toggle flash sale (and optionally set stock_limit)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_flash_sale, stock_limit } = body;

    // stock_limit: number (1-60) when flash_sale is on, null when off
    await query(
      'UPDATE products SET is_flash_sale = ?, stock_limit = ? WHERE id = ?',
      [is_flash_sale ? 1 : 0, is_flash_sale ? (stock_limit ?? null) : null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Flash sale toggle error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
