import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all products
export async function GET() {
  try {
    const products = await query(
      'SELECT id, sku, name, slug, description, price, regular_price, brand_name, category_name, image_url, in_stock, is_flash_sale, stock_limit FROM products ORDER BY id DESC'
    );
    return NextResponse.json(products);
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Ürünler yüklenemedi' }, { status: 500 });
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, name, slug, description, price, regular_price, brand_name, category_name, image_url, in_stock } = body;

    await query(
      `INSERT INTO products (sku, name, slug, description, price, regular_price, brand_name, category_name, image_url, in_stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, name, slug, description, price, regular_price || price, brand_name, category_name, image_url, in_stock ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Ürün eklenemedi' }, { status: 500 });
  }
}
