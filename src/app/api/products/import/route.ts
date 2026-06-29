import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  sku: string;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: string | null;
  position: number;
  product_id: number;
  featured_image: {
    src: string;
  } | null;
}

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
  variant_ids: number[];
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

// POST - Import products from Shopify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, limit = 250 } = body;

    // Shopify URL'den ürünleri çek
    const shopifyUrl = url || `https://stanley-pmi.myshopify.com/products.json?limit=${limit}`;
    
    const response = await fetch(shopifyUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify API hatası: ${response.status}`);
    }

    const data: ShopifyResponse = await response.json();
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const product of data.products) {
      // Her variant için ayrı ürün oluştur
      for (const variant of product.variants) {
        try {
          // SKU yoksa atla
          if (!variant.sku) {
            skipped++;
            continue;
          }

          // Variant için resim bul
          let imageUrl = '';
          if (variant.featured_image?.src) {
            imageUrl = variant.featured_image.src.replace(/\\/g, '');
          } else if (product.images.length > 0) {
            // Variant'a özel resim yoksa, ilk resmi kullan
            imageUrl = product.images[0].src.replace(/\\/g, '');
          }

          // Tüm resimleri JSON array olarak hazırla
          const allImages = product.images.map(img => img.src.replace(/\\/g, ''));

          // Ürün adını variant title ile birleştir
          const productName = variant.title && variant.title !== 'Default Title' 
            ? `${product.title} - ${variant.title}`
            : product.title;

          // Slug oluştur
          const slug = variant.title && variant.title !== 'Default Title'
            ? `${product.handle}-${variant.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
            : product.handle;

          // Fiyatı cent'e çevir (47.00 -> 4700)
          const price = Math.round(parseFloat(variant.price) * 100);
          const regularPrice = variant.compare_at_price 
            ? Math.round(parseFloat(variant.compare_at_price) * 100) 
            : price;

          // İndirim badge'i hesapla
          let discountBadge: string | null = null;
          if (variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price)) {
            const discount = Math.round((1 - parseFloat(variant.price) / parseFloat(variant.compare_at_price)) * 100);
            discountBadge = `%${discount}`;
          }

          // JSON data - orijinal Shopify verisini sakla
          const jsonData = JSON.stringify({
            shopify_product_id: product.id,
            shopify_variant_id: variant.id,
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            tags: product.tags,
            grams: variant.grams,
            position: variant.position
          });

          // Mevcut ürünü kontrol et (SKU'ya göre)
          const existing = await query<any[]>(
            'SELECT id FROM products WHERE sku = ?',
            [variant.sku]
          );

          if (existing && existing.length > 0) {
            // Güncelle
            await query(
              `UPDATE products SET 
                name = ?,
                slug = ?,
                description = ?,
                price = ?,
                regular_price = ?,
                brand_name = ?,
                category_name = ?,
                image_url = ?,
                images = ?,
                in_stock = ?,
                discount_badge = ?,
                json_data = ?,
                updated_at = NOW()
              WHERE sku = ?`,
              [
                productName,
                slug,
                product.body_html || '',
                price,
                regularPrice,
                product.vendor,
                product.product_type,
                imageUrl,
                JSON.stringify(allImages),
                variant.available ? 1 : 0,
                discountBadge,
                jsonData,
                variant.sku
              ]
            );
            updated++;
          } else {
            // Yeni ekle
            await query(
              `INSERT INTO products (
                sku, name, slug, description, price, regular_price, 
                brand_name, category_name, image_url, images, 
                in_stock, discount_badge, json_data, is_flash_sale
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
              [
                variant.sku,
                productName,
                slug,
                product.body_html || '',
                price,
                regularPrice,
                product.vendor,
                product.product_type,
                imageUrl,
                JSON.stringify(allImages),
                variant.available ? 1 : 0,
                discountBadge,
                jsonData
              ]
            );
            imported++;
          }
        } catch (variantError: any) {
          errors.push(`SKU ${variant.sku}: ${variantError.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import tamamlandı`,
      stats: {
        total_products: data.products.length,
        total_variants: data.products.reduce((acc, p) => acc + p.variants.length, 0),
        imported,
        updated,
        skipped,
        errors: errors.length
      },
      errors: errors.slice(0, 10) // İlk 10 hatayı göster
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Import başarısız' 
    }, { status: 500 });
  }
}

// GET - Import işlemini query parameter ile çalıştır
// Kullanım: /api/products/import?run=true&limit=250
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const run = searchParams.get('run');
    const limit = searchParams.get('limit') || '250';

    // Eğer run=true ise import işlemini başlat
    if (run === 'true') {
      const shopifyUrl = `https://stanley-pmi.myshopify.com/products.json?limit=${limit}`;
      
      const response = await fetch(shopifyUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Shopify API hatası: ${response.status}`);
      }

      const data: ShopifyResponse = await response.json();
      
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const product of data.products) {
        for (const variant of product.variants) {
          try {
            if (!variant.sku) {
              skipped++;
              continue;
            }

            let imageUrl = '';
            if (variant.featured_image?.src) {
              imageUrl = variant.featured_image.src.replace(/\\/g, '');
            } else if (product.images.length > 0) {
              imageUrl = product.images[0].src.replace(/\\/g, '');
            }

            const allImages = product.images.map(img => img.src.replace(/\\/g, ''));

            const productName = variant.title && variant.title !== 'Default Title' 
              ? `${product.title} - ${variant.title}`
              : product.title;

            const slug = variant.title && variant.title !== 'Default Title'
              ? `${product.handle}-${variant.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
              : product.handle;

            const price = Math.round(parseFloat(variant.price) * 100);
            const regularPrice = variant.compare_at_price 
              ? Math.round(parseFloat(variant.compare_at_price) * 100) 
              : price;

            let discountBadge: string | null = null;
            if (variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price)) {
              const discount = Math.round((1 - parseFloat(variant.price) / parseFloat(variant.compare_at_price)) * 100);
              discountBadge = `%${discount}`;
            }

            const jsonData = JSON.stringify({
              shopify_product_id: product.id,
              shopify_variant_id: variant.id,
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
              tags: product.tags,
              grams: variant.grams,
              position: variant.position
            });

            const existing = await query<any[]>(
              'SELECT id FROM products WHERE sku = ?',
              [variant.sku]
            );

            if (existing && existing.length > 0) {
              await query(
                `UPDATE products SET 
                  name = ?, slug = ?, description = ?, price = ?, regular_price = ?,
                  brand_name = ?, category_name = ?, image_url = ?, images = ?,
                  in_stock = ?, discount_badge = ?, json_data = ?, updated_at = NOW()
                WHERE sku = ?`,
                [productName, slug, product.body_html || '', price, regularPrice,
                  product.vendor, product.product_type, imageUrl, JSON.stringify(allImages),
                  variant.available ? 1 : 0, discountBadge, jsonData, variant.sku]
              );
              updated++;
            } else {
              await query(
                `INSERT INTO products (sku, name, slug, description, price, regular_price, 
                  brand_name, category_name, image_url, images, in_stock, discount_badge, json_data, is_flash_sale
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                [variant.sku, productName, slug, product.body_html || '', price, regularPrice,
                  product.vendor, product.product_type, imageUrl, JSON.stringify(allImages),
                  variant.available ? 1 : 0, discountBadge, jsonData]
              );
              imported++;
            }
          } catch (variantError: any) {
            errors.push(`SKU ${variant.sku}: ${variantError.message}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Import tamamlandı`,
        stats: { total_products: data.products.length, 
          total_variants: data.products.reduce((acc, p) => acc + p.variants.length, 0),
          imported, updated, skipped, errors: errors.length },
        errors: errors.slice(0, 10)
      });
    }

    // run=true değilse sadece durum bilgisi döndür
    const response = await fetch('https://stanley-pmi.myshopify.com/products.json?limit=1', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify API hatası: ${response.status}`);
    }

    const data: ShopifyResponse = await response.json();
    
    // Veritabanındaki mevcut ürün sayısını al
    const countResult = await query<any[]>('SELECT COUNT(*) as count FROM products');
    const currentCount = countResult[0]?.count || 0;

    return NextResponse.json({
      status: 'ready',
      shopify_sample: {
        products_count: data.products.length,
        first_product: data.products[0] ? {
          id: data.products[0].id,
          title: data.products[0].title,
          variants_count: data.products[0].variants.length
        } : null
      },
      database: {
        current_products_count: currentCount
      },
      usage: {
        description: 'POST isteği ile import başlatın',
        endpoint: '/api/products/import',
        body: {
          url: 'https://stanley-pmi.myshopify.com/products.json?limit=250 (opsiyonel)',
          limit: '250 (varsayılan)'
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 });
  }
}
