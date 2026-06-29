import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { query } from '@/lib/db';

const CURL_BIN = process.platform === 'win32' ? 'curl.exe' : 'curl';

// ── curl fetch ───────────────────────────────────────────────────────────────
function fetchWithCurl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-s', '-L', '--max-time', '25', '--compressed',
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H', 'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8',
      '-H', 'Referer: https://www.sokmarket.com.tr/',
      '-H', 'Sec-Fetch-Dest: document',
      '-H', 'Sec-Fetch-Mode: navigate',
      '-H', 'Sec-Fetch-Site: none',
      '-H', 'Sec-Fetch-User: ?1',
      '-H', 'Upgrade-Insecure-Requests: 1',
      url,
    ];
    const curl = spawn(CURL_BIN, args);
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    curl.stdout.on('data', (d: Buffer) => out.push(d));
    curl.stderr.on('data', (d: Buffer) => err.push(d));
    curl.on('error', (e: Error) => reject(new Error(`curl hatasi: ${e.message}`)));
    curl.on('close', (code: number) => {
      if (code === 0) {
        const html = Buffer.concat(out).toString('utf-8');
        html.length > 500 ? resolve(html) : reject(new Error('Bos icerik'));
      } else {
        reject(new Error(`curl bitti kod=${code}: ${Buffer.concat(err)}`));
      }
    });
  });
}

// ── Şok ürün parse ───────────────────────────────────────────────────────────
interface SokProduct {
  name: string; sku: string; brand: string;
  price: number; regular_price: number;
  category: string; images: string[];
  description: string; in_stock: boolean;
  slug: string; source_url: string;
}

function extractSokProduct(html: string, url: string): SokProduct | null {
  try {
    // Şok Market Next.js RSC: self.__next_f.push([1,"..."]) blokları
    // JSON verisi bu bloklarda escaped string olarak bulunur
    // Tüm blokları birleştir ve JSON objelerini çıkar
    const rscBlocks: string[] = [];
    const rscRx = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
    let m: RegExpExecArray | null;
    while ((m = rscRx.exec(html)) !== null) {
      try {
        // Escaped JSON string'i decode et
        const decoded = m[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\');
        rscBlocks.push(decoded);
      } catch (_) {}
    }
    const fullRsc = rscBlocks.join('\n');

    // Ürün slug'ı URL'den çıkar: /urun-adi-pdp-123
    const slugMatch = url.match(/sokmarket\.com\.tr\/([^?#]+)/);
    const slug = slugMatch?.[1] ?? '';
    const pdpIdMatch = url.match(/-pdp-(\d+)/);
    const pdpId = pdpIdMatch?.[1] ?? '';

    // RSC'den ürün verisi çıkar
    // salePrice, listPrice, name, images, sku gibi alanlar JSON objelerinde
    let name = '';
    let salePrice = 0;
    let listPrice = 0;
    let brand = '';
    let category = '';
    let images: string[] = [];
    let description = '';
    let inStock = true;
    let sku = pdpId;

    // JSON-LD schema.org Product (bazı sayfalarda mevcut)
    const schemaRx = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (schemaRx) {
      for (const block of schemaRx) {
        const content = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const obj = JSON.parse(content);
          const product = obj['@type'] === 'Product' ? obj
            : obj['@graph']?.find?.((x: any) => x['@type'] === 'Product');
          if (product) {
            name = product.name || name;
            description = product.description || description;
            brand = typeof product.brand === 'string' ? product.brand : product.brand?.name || brand;
            category = typeof product.category === 'string' ? product.category : product.category?.name || category;
            salePrice = parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || salePrice;
            sku = product.sku || product.mpn || sku;
            if (Array.isArray(product.image)) images = [...product.image, ...images];
            else if (product.image) images = [product.image, ...images];
          }
        } catch (_) {}
      }
    }

    // RSC payload'dan ürün alanları çıkar (JSON-LD yoksa veya eksikse)
    if (!name) {
      const nameRx = /"(?:productName|name)":"([^"]{3,200})"/g;
      let nm: RegExpExecArray | null;
      while ((nm = nameRx.exec(fullRsc)) !== null) {
        const candidate = nm[1];
        // Şok ürün adları genellikle 5+ karakter
        if (candidate.length >= 5 && !candidate.startsWith('http') && !candidate.includes('/')) {
          name = candidate;
          break;
        }
      }
    }

    if (salePrice === 0) {
      const salePriceRx = /"salePrice":(\d+\.?\d*)/;
      const sp = fullRsc.match(salePriceRx);
      if (sp) salePrice = parseFloat(sp[1]);
    }

    if (listPrice === 0) {
      const listPriceRx = /"listPrice":(\d+\.?\d*)/;
      const lp = fullRsc.match(listPriceRx);
      if (lp) listPrice = parseFloat(lp[1]);
    }
    if (listPrice === 0) listPrice = salePrice;

    // Resimler — Şok CDN pattern: images.ceptesok.com
    if (images.length === 0) {
      const imgHostRx = /"host":"(https:\/\/images\.ceptesok\.com)","path":"([^"]+)"/g;
      const seen = new Set<string>();
      let im: RegExpExecArray | null;
      while ((im = imgHostRx.exec(fullRsc)) !== null) {
        const imgUrl = `${im[1]}/${im[2]}`;
        if (!seen.has(imgUrl) && !imgUrl.includes('cms-assets')) {
          seen.add(imgUrl);
          images.push(imgUrl);
        }
      }
    }

    // RSC'deki tüm ceptesok.com resim URL'leri (fallback)
    if (images.length === 0) {
      const imgUrlRx = /https:\/\/images\.ceptesok\.com\/(?!cms-assets)[^"'\s\\]+/g;
      const seen = new Set<string>();
      let im: RegExpExecArray | null;
      while ((im = imgUrlRx.exec(fullRsc)) !== null) {
        const url2 = im[0].replace(/\\/g, '');
        if (!seen.has(url2)) { seen.add(url2); images.push(url2); }
      }
    }

    // SKU
    if (sku === pdpId || !sku) {
      const skuRx = /"(?:sku|barcode|productCode)":"([^"]+)"/;
      const sm = fullRsc.match(skuRx);
      if (sm) sku = sm[1];
    }

    // Stok durumu
    const stockRx = /"(?:inStock|stockStatus|available)"\s*:\s*(true|false|"InStock"|"OutOfStock")/i;
    const stockM = fullRsc.match(stockRx);
    if (stockM) {
      const v = stockM[1].toLowerCase();
      inStock = v === 'true' || v === '"instock"';
    }

    // Brand
    if (!brand) {
      const brandRx = /"(?:brand|brandName)":"([^"]{2,80})"/;
      const bm = fullRsc.match(brandRx);
      if (bm) brand = bm[1];
    }

    // Description — açıklama alanı
    if (!description) {
      const descRx = /"(?:description|longDescription)":"([^"]{10,2000})"/;
      const dm = fullRsc.match(descRx);
      if (dm) description = dm[1].replace(/\\n/g, '\n').replace(/\\t/g, ' ');
    }
    if (!description) {
      // Meta description fallback
      description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ?? '';
    }

    // Category
    if (!category) {
      const catRx = /"(?:categoryName|category)":"([^"]{2,100})"/;
      const cm = fullRsc.match(catRx);
      if (cm) category = cm[1];
    }

    if (!name) return null;

    return {
      name, sku: sku || pdpId,
      brand, category,
      price: Math.round(salePrice * 100),
      regular_price: Math.round(listPrice * 100),
      images: Array.from(new Set(images)),
      description,
      in_stock: inStock,
      slug: slug.replace(/-pdp-\d+$/, ''),
      source_url: url,
    };
  } catch (err) {
    console.error('[sok] parse hatasi:', err);
    return null;
  }
}

// ── DB kaydet ─────────────────────────────────────────────────────────────────
async function saveProduct(p: SokProduct) {
  const imageUrlStr   = p.images.join(', ');
  const allImagesJson = JSON.stringify(p.images);
  const jsonData = JSON.stringify({
    source: 'sokmarket', source_url: p.source_url, sku: p.sku,
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
    return { action: 'updated', message: `"${p.name}" ürünü güncellendi` };
  }

  await query(
    `INSERT INTO products (sku,name,slug,description,price,regular_price,brand_name,
     category_name,image_url,images,in_stock,json_data,is_flash_sale)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
    [p.sku, p.name, p.slug, p.description, p.price, p.regular_price,
     p.brand, p.category, imageUrlStr, allImagesJson, p.in_stock ? 1 : 0, jsonData]
  );
  return { action: 'imported', message: `"${p.name}" ürünü başarıyla import edildi` };
}

// ── POST /api/products/import-sok ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { url, html: clientHtml } = await request.json() as { url: string; html?: string };

    if (!url?.includes('sokmarket.com.tr')) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir Şok Market ürün linki giriniz (sokmarket.com.tr)' },
        { status: 400 }
      );
    }

    let html: string;

    if (clientHtml && clientHtml.length > 500) {
      console.log('[sok] Client HTML kullaniliyor, uzunluk:', clientHtml.length);
      html = clientHtml;
    } else {
      console.log('[sok] curl fetch...');
      try {
        html = await fetchWithCurl(url);
        console.log('[sok] curl ok, uzunluk:', html.length);
      } catch (e: any) {
        return NextResponse.json({ success: false, error: `Sayfaya erisilemedi: ${e.message}` }, { status: 503 });
      }
    }

    const product = extractSokProduct(html, url);
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Ürün bilgileri çıkarılamadı. Lütfen bir Şok Market ürün detay sayfası linki girin.',
      }, { status: 422 });
    }

    const { action, message } = await saveProduct(product);
    return NextResponse.json({
      success: true, action, message,
      product: {
        sku: product.sku, name: product.name, brand: product.brand,
        price: product.price / 100, regular_price: product.regular_price / 100,
        category: product.category, images_count: product.images.length,
        in_stock: product.in_stock,
      },
    });
  } catch (error: any) {
    console.error('[sok] Import error:', error);
    return NextResponse.json({ success: false, error: error.message ?? 'Import başarısız' }, { status: 500 });
  }
}
