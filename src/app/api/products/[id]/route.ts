import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// GET single product
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const products = await query<any[]>('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(products[0]);
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Ürün yüklenemedi' }, { status: 500 });
  }
}

// PUT update product
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sku, name, slug, description, price, regular_price, brand_name, category_name, image_url, in_stock } = body;

    await query(
      `UPDATE products 
       SET sku = ?, name = ?, slug = ?, description = ?, price = ?, regular_price = ?, brand_name = ?, category_name = ?, image_url = ?, in_stock = ?
       WHERE id = ?`,
      [sku, name, slug, description, price, regular_price || price, brand_name, category_name, image_url, in_stock ? 1 : 0, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Ürün güncellenemedi' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await query('DELETE FROM products WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Ürün silinemedi' }, { status: 500 });
  }
}
