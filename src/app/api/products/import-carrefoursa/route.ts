import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { query } from '@/lib/db';

// Windows'ta PowerShell 'curl' alias'ı yerine curl.exe kullan
const CURL_BIN = process.platform === 'win32' ? 'curl.exe' : 'curl';

// ─── curl ile fetch (Node fetch'ten farklı TLS fingerprint → 403'ü aşar) ───
function fetchWithCurl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-s',
      '-L',
      '--max-time', '25',
      '--compressed',
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H', 'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8',
      '-H', 'Referer: https://www.carrefoursa.com/',
      '-H', 'Sec-Fetch-Dest: document',
      '-H', 'Sec-Fetch-Mode: navigate',
      '-H', 'Sec-Fetch-Site: none',
      '-H', 'Sec-Fetch-User: ?1',
      '-H', 'Upgrade-Insecure-Requests: 1',
      url,
    ];

    const curl = spawn(CURL_BIN, curlArgs);
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    curl.stdout.on('data', (d: Buffer) => chunks.push(d));
    curl.stderr.on('data', (d: Buffer) => errChunks.push(d));

    curl.on('error', (err: Error) =>
      reject(new Error(`curl bulunamadi veya calistirilamadi: ${err.message}`))
    );

    curl.on('close', (code: number) => {
      if (code === 0) {
        const html = Buffer.concat(chunks).toString('utf-8');
        if (html.length > 500) {
          resolve(html);
        } else {
          const stderr = Buffer.concat(errChunks).toString();
          reject(new Error(`curl bos icerik dondurdu. Hata: ${stderr}`));
        }
      } else {
        const stderr = Buffer.concat(errChunks).toString();
        reject(new Error(`curl basarisiz (kod: ${code}): ${stderr}`));
      }
    });
  });
}

// ─── HTML'den ürün bilgisi çıkar ───────────────────────────────────────────
interface CarrefoursaProduct {
  id: string; name: string; sku: string; brand: string;
  price: number; regular_price: number;
  category: string; category2: string; category3: string;
  images: string[]; description: string;
  in_stock: boolean; slug: string; source_url: string;
}

function extractProduct(html: string, url: string): CarrefoursaProduct | null {
  try {
    const idMatch = url.match(/-p-(\d+)/);
    const productId = idMatch?.[1] ?? null;

    // ── JSON-LD schema ──────────────────────────────────────────────────────
    let schemaData: any = null;
    const schemaRx =
      html.match(/<script[^>]*id="productSchema"[^>]*>([\s\S]*?)<\/script>/i) ??
      html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (schemaRx) { try { schemaData = JSON.parse(schemaRx[1]); } catch (_) {} }

    // ── DataLayer değerleri ─────────────────────────────────────────────────
    const itemName   = html.match(/"item_name":\s*"([^"]+)"/)     ?.[1] ?? null;
    const itemId     = html.match(/"item_id":\s*"([^"]+)"/)       ?.[1] ?? productId;
    const itemBrand  = html.match(/"item_brand":\s*"([^"]+)"/)    ?.[1] ?? '';
    const price      = parseFloat(html.match(/"price":\s*parseFloat\("([^"]+)"\)/)        ?.[1] ?? '0');
    const firstPrice = parseFloat(html.match(/"first_price"\s*:parseFloat\("([^"]+)"\)/)  ?.[1] ?? String(price));
    const inStock    = html.match(/"in_stock"\s*:\s*"(true|false)"/) ?.[1] === 'true';
    const cat1 = html.match(/var itemCategory = "([^"]+)"/)  ?.[1] ?? '';
    const cat2 = html.match(/var itemCategory2 = "([^"]+)"/) ?.[1] ?? '';
    const cat3 = html.match(/var itemCategory3 = "([^"]+)"/) ?.[1] ?? '';

    // ── Resimler — 4 katmanlı strateji ─────────────────────────────────────
    let images: string[] = [];

    // Strateji 1: JSON-LD schema → doğrudan 600x600 URL'ler
    if (schemaData?.image && Array.isArray(schemaData.image) && schemaData.image.length > 0) {
      images = (schemaData.image as any[])
        .filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
    }

    // Strateji 2: Galeri bölümündeki data-src attribute'ları (600x600 resimler)
    if (images.length === 0 && productId) {
      const seen = new Set<string>();
      // Galeri section'ını izole et: image-gallery div'inden product-details-tab'a kadar
      const galleryMatch = html.match(/class="image-gallery[^"]*"[\s\S]*?(?=<div class="[^"]*product-details-tab)/i);
      const searchArea = galleryMatch ? galleryMatch[0] : html;
      const dataSrcRx = new RegExp(
        `data-src="(https://images\\.csfour\\.com/mnresize/\\d+/\\d+/productimage/${productId}/[^"]+)"`,
        'g'
      );
      let m: RegExpExecArray | null;
      while ((m = dataSrcRx.exec(searchArea)) !== null) {
        const big = m[1].replace(/mnresize\/\d+\/\d+\//, 'mnresize/600/600/');
        if (!seen.has(big)) { seen.add(big); images.push(big); }
      }
    }

    // Strateji 3: Tüm HTML'deki data-src (600x600'e yükselt, benzersizleri al)
    if (images.length === 0 && productId) {
      const seen = new Set<string>();
      const rx = new RegExp(
        `data-src="(https://images\\.csfour\\.com/mnresize/\\d+/\\d+/productimage/${productId}/[^"]+)"`,
        'g'
      );
      let m: RegExpExecArray | null;
      while ((m = rx.exec(html)) !== null) {
        const big = m[1].replace(/mnresize\/\d+\/\d+\//, 'mnresize/600/600/');
        if (!seen.has(big)) { seen.add(big); images.push(big); }
      }
    }

    // Strateji 4: dataLayer imageUrl (son çare — tek resim)
    if (images.length === 0) {
      const imgUrl = html.match(/imageUrl = "([^"]+)"/) ?.[1];
      if (imgUrl) images = [imgUrl.replace(/mnresize\/\d+\/\d+\//, 'mnresize/600/600/')];
    }

    // ── Açıklama — 3 katmanlı strateji ─────────────────────────────────────
    let description = '';

    // Strateji 1: class="product-details-tab tab-details container" div içeriği
    // (class sırası farklı olabilir; tüm kombinasyonları dene)
    const tabPatterns = [
      /class="[^"]*product-details-tab[^"]*tab-details[^"]*container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
      /class="[^"]*product-details-tab[^"]*tab-details[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
      /class="[^"]*tab-details[^"]*container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
      /class="[^"]*tab-details[^"]*"[^>]*>([\s\S]{20,3000}?)<\/div>\s*<\/div>\s*<\/div>/i,
    ];

    for (const pat of tabPatterns) {
      const m = html.match(pat);
      if (m?.[1]) {
        const cleaned = m[1]
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (cleaned.length > 20) {
          description = cleaned;
          break;
        }
      }
    }

    // Strateji 2: dataLayer description değişkeni
    if (!description) {
      const dlDesc = html.match(/var description = `([^`]+)`/) ?.[1];
      if (dlDesc) description = dlDesc.trim();
    }

    // Strateji 3: Meta description — HTML entity decode + boilerplate temizle
    if (!description) {
      const rawDesc = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ?.[1] ?? '';
      description = rawDesc
        // Named HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Turkish specific
        .replace(/&Ccedil;/g, 'Ç').replace(/&ccedil;/g, 'ç')
        .replace(/&Uuml;/g, 'Ü').replace(/&uuml;/g, 'ü')
        .replace(/&Ouml;/g, 'Ö').replace(/&ouml;/g, 'ö')
        .replace(/&Icirc;/g, 'İ').replace(/&icirc;/g, 'î')
        .replace(/&Scedil;/g, 'Ş').replace(/&scedil;/g, 'ş')
        .replace(/&Gcedil;/g, 'Ğ').replace(/&gcedil;/g, 'ğ')
        // Numeric entities
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
        // CarrefourSA boilerplate kalıplarını temizle
        .replace(/^En kaliteli\s+/i, '')
        .replace(/\s*,\s*en uygun fiyatlara CarrefourSA güvencesiyle aynı gün kapınıza teslim\.?$/i, '')
        .trim();
    }

    // ── Slug ve isim ───────────────────────────────────────────────────────
    const slug = (url.match(/carrefoursa\.com\/([^?#]+)/) ?.[1] ?? '').replace(/-p-\d+$/, '');
    const name = itemName ?? schemaData?.name ?? '';

    if (!name || !itemId) return null;

    return {
      id: itemId, name, sku: itemId,
      brand: itemBrand || (typeof schemaData?.brand === 'string' ? schemaData.brand : schemaData?.brand?.name) || '',
      price: Math.round(price * 100),
      regular_price: Math.round(firstPrice * 100),
      category: cat3 || cat2 || cat1 || '',
      category2: cat2, category3: cat3,
      images, description, in_stock: inStock, slug, source_url: url,
    };
  } catch (err) {
    console.error('[carrefoursa] parse hatasi:', err);
    return null;
  }
}

// ─── DB kaydet / güncelle ───────────────────────────────────────────────────
async function saveProduct(p: CarrefoursaProduct) {
  // Products sayfası image_url.split(',') ile okuyor → tüm resimleri virgülle kaydet
  const imageUrlStr   = p.images.join(', ');
  const allImagesJson = JSON.stringify(p.images);
  const jsonData      = JSON.stringify({
    source: 'carrefoursa', source_url: p.source_url,
    carrefoursa_id: p.id, category2: p.category2, category3: p.category3,
  });

  const existing = await query<any[]>('SELECT id FROM products WHERE sku = ?', [p.sku]);

  if (existing?.length > 0) {
    await query(
      `UPDATE products SET name=?,slug=?,description=?,price=?,regular_price=?,
       brand_name=?,category_name=?,image_url=?,images=?,in_stock=?,json_data=?,updated_at=NOW()
       WHERE sku=?`,
      [p.name, p.slug, p.description, p.price, p.regular_price,
       p.brand, p.category, imageUrlStr, allImagesJson, p.in_stock ? 1 : 0, jsonData, p.sku]
    );
    return { action: 'updated', message: `"${p.name}" urunu guncellendi` };
  }

  await query(
    `INSERT INTO products (sku,name,slug,description,price,regular_price,brand_name,
     category_name,image_url,images,in_stock,json_data,is_flash_sale)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
    [p.sku, p.name, p.slug, p.description, p.price, p.regular_price,
     p.brand, p.category, imageUrlStr, allImagesJson, p.in_stock ? 1 : 0, jsonData]
  );
  return { action: 'imported', message: `"${p.name}" urunu basariyla import edildi` };
}

// ─── POST /api/products/import-carrefoursa ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, html: clientHtml } = body as { url: string; html?: string };

    if (!url?.includes('carrefoursa.com')) {
      return NextResponse.json(
        { success: false, error: 'Gecerli bir Carrefoursa urun linki giriniz' },
        { status: 400 }
      );
    }

    let html: string;

    // Mod 1: Tarayıcıdan gelen HTML (öncelikli)
    if (clientHtml && clientHtml.length > 500) {
      console.log('[carrefoursa] Client HTML kullaniliyor, uzunluk:', clientHtml.length);
      html = clientHtml;
    } else {
      // Mod 2: curl ile sunucu tarafı fetch
      console.log('[carrefoursa] curl ile fetch deneniyor...');
      try {
        html = await fetchWithCurl(url);
        console.log('[carrefoursa] curl basarili, HTML uzunlugu:', html.length);
      } catch (curlErr: any) {
        console.error('[carrefoursa] curl hatasi:', curlErr.message);
        return NextResponse.json({
          success: false,
          error: `Urun sayfasina erisilemedi: ${curlErr.message}`,
        }, { status: 503 });
      }
    }

    // HTML parse
    const product = extractProduct(html, url);
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Urun bilgileri sayfa iceriginden cikarilamadi. Lutfen gecerli bir urun detay sayfasi linki girin.',
      }, { status: 422 });
    }

    // Kaydet
    const { action, message } = await saveProduct(product);
    return NextResponse.json({
      success: true, action, message,
      product: {
        sku: product.sku, name: product.name, brand: product.brand,
        price: product.price / 100, regular_price: product.regular_price / 100,
        category: product.category,
        images_count: product.images.length,
        in_stock: product.in_stock,
      },
    });
  } catch (error: any) {
    console.error('[carrefoursa] Import error:', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Import islemi basarisiz' },
      { status: 500 }
    );
  }
}
