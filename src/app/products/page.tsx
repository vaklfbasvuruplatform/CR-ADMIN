'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  regular_price: number;
  brand_name: string;
  category_name: string;
  image_url: string;
  in_stock: boolean;
  is_flash_sale: boolean;
  stock_limit: number | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [discountFilter, setDiscountFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  // Track pending stock_limit per product while select is open
  const [pendingStockLimits, setPendingStockLimits] = useState<Record<number, number | null>>({});
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    slug: '',
    description: '',
    price: 0,
    regular_price: 0,
    brand_name: '',
    category_name: '',
    image_url: '',
    in_stock: true,
  });

  // Carrefoursa Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; product?: any } | null>(null);

  // Şok Market Import State
  const [showSokModal, setShowSokModal] = useState(false);
  const [sokUrl, setSokUrl] = useState('');
  const [sokLoading, setSokLoading] = useState(false);
  const [sokResult, setSokResult] = useState<{ success: boolean; message: string; product?: any } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleFlashSale = async (id: number, currentValue: boolean, stockLimit?: number | null) => {
    try {
      const res = await fetch(`/api/products/${id}/flash`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_flash_sale: !currentValue, stock_limit: !currentValue ? (stockLimit ?? null) : null }),
      });

      if (res.ok) {
        toast.success(currentValue ? 'İndirim kaldırıldı' : 'İndirim eklendi! ⚡');
        // Clear pending stock limit on toggle
        setPendingStockLimits(prev => { const n = {...prev}; delete n[id]; return n; });
        fetchProducts();
      } else {
        toast.error('İşlem başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const handleStockLimitChange = async (id: number, value: number | null) => {
    // Update pending state immediately for UI feedback
    setPendingStockLimits(prev => ({ ...prev, [id]: value }));
    try {
      await fetch(`/api/products/${id}/flash`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_flash_sale: true, stock_limit: value }),
      });
      fetchProducts();
    } catch {
      toast.error('Stok güncellenemedi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Ürün silindi');
        fetchProducts();
      } else {
        toast.error('Silme başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const openAddModal = () => {
    setEditProduct(null);
    setFormData({
      sku: '',
      name: '',
      slug: '',
      description: '',
      price: 0,
      regular_price: 0,
      brand_name: '',
      category_name: '',
      image_url: '',
      in_stock: true,
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      slug: product.slug || '',
      description: product.description || '',
      price: product.price,
      regular_price: product.regular_price,
      brand_name: product.brand_name || '',
      category_name: product.category_name || '',
      image_url: product.image_url || '',
      in_stock: product.in_stock,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editProduct ? 'Ürün güncellendi' : 'Ürün eklendi');
        setShowModal(false);
        fetchProducts();
      } else {
        toast.error('İşlem başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  const handleCarrefoursaImport = async () => {
    if (!importUrl.trim()) {
      toast.error('Lütfen bir Carrefoursa ürün linki girin');
      return;
    }
    if (!importUrl.includes('carrefoursa.com')) {
      toast.error('Geçerli bir Carrefoursa linki giriniz');
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      // ──────────────────────────────────────────────────────
      // Adım 1: Tarayıcıdan Carrefoursa sayfasını çek
      // Tarayıcı kendi oturumu / cookie'leriyle gönderir →
      // sunucu tarafında alınan 403'ü bu şekilde aşarız.
      // ──────────────────────────────────────────────────────
      let html: string | undefined;
      try {
        const pageRes = await fetch(importUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9',
          },
          credentials: 'include', // Mevcut oturum cookie'lerini gönder
          mode: 'cors',
        });
        if (pageRes.ok) {
          html = await pageRes.text();
        }
      } catch (_) {
        // CORS engeli — sunucu tarafı fallback'e geçecek
        html = undefined;
      }

      // ──────────────────────────────────────────────────────
      // Adım 2: HTML'i API'ye gönder (html varsa client-mode,
      //         yoksa sunucu proxy moduna düşer)
      // ──────────────────────────────────────────────────────
      const res = await fetch('/api/products/import-carrefoursa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, html }),
      });

      const data = await res.json();

      if (data.success) {
        setImportResult({ success: true, message: data.message, product: data.product });
        toast.success(data.message);
        fetchProducts();
      } else {
        setImportResult({ success: false, message: data.error || 'Import başarısız' });
        toast.error(data.error || 'Import başarısız');
      }
    } catch (error) {
      const msg = 'Bağlantı hatası oluştu';
      setImportResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSokImport = async () => {
    if (!sokUrl.trim()) { toast.error('Lütfen bir Şok Market ürün linki girin'); return; }
    if (!sokUrl.includes('sokmarket.com.tr')) { toast.error('Geçerli bir sokmarket.com.tr linki giriniz'); return; }

    setSokLoading(true);
    setSokResult(null);

    try {
      // Önce tarayıcıdan çek (CORS bypass)
      let html: string | undefined;
      try {
        const pageRes = await fetch(sokUrl, {
          method: 'GET',
          headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'tr-TR,tr;q=0.9' },
          credentials: 'include',
          mode: 'cors',
        });
        if (pageRes.ok) html = await pageRes.text();
      } catch (_) { html = undefined; }

      const res = await fetch('/api/products/import-sok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sokUrl, html }),
      });
      const data = await res.json();

      if (data.success) {
        setSokResult({ success: true, message: data.message, product: data.product });
        toast.success(data.message);
        fetchProducts();
      } else {
        setSokResult({ success: false, message: data.error || 'Import başarısız' });
        toast.error(data.error || 'Import başarısız');
      }
    } catch (error) {
      const msg = 'Bağlantı hatası oluştu';
      setSokResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setSokLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price / 100);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category_name).filter(Boolean)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category_name === categoryFilter;
    const matchesStock = stockFilter === 'All' || 
                         (stockFilter === 'In Stock' ? product.in_stock : !product.in_stock);
    const matchesDiscount = discountFilter === 'All' || 
                           (discountFilter === 'Discounted' ? product.is_flash_sale : !product.is_flash_sale);
    
    return matchesSearch && matchesCategory && matchesStock && matchesDiscount;
  });

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ürünler</h1>
          <p className="text-gray-500 dark:text-gray-400">Tüm ürünleri yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); setImportUrl(''); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Carrefoursa Import
          </button>
          <button
            onClick={() => { setShowSokModal(true); setSokResult(null); setSokUrl(''); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-sm font-medium text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Şok Market Import
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Ürün adı veya SKU ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'All' ? 'Tüm Kategoriler' : cat}</option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="All">Tüm Stok Durumları</option>
          <option value="In Stock">Stokta Var</option>
          <option value="Out of Stock">Tükendi</option>
        </select>

        <select
          value={discountFilter}
          onChange={(e) => setDiscountFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="All">Tüm İndirim Durumları</option>
          <option value="Discounted">İndirimli</option>
          <option value="Regular">Normal</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">Ürün</th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">SKU</th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">Fiyat</th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">Kategori</th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">Stok</th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">İndirim</th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-600 dark:text-gray-300">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="table-row-hover">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {product.image_url && (() => {
                            const imgs = product.image_url.split(',').map(u => u.trim()).filter(Boolean);
                            return (
                              <div className="relative flex-shrink-0">
                                <img
                                  src={imgs[0]}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-lg object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=?'; }}
                                />
                                {imgs.length > 1 && (
                                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow">
                                    {imgs.length}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white line-clamp-1 max-w-xs">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.brand_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                        {product.sku?.slice(0, 20)}...
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-800 dark:text-white">
                        {formatPrice(product.price)}
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                        {product.category_name}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          product.in_stock
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {product.in_stock ? 'Stokta' : 'Tükendi'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {/* Flash sale toggle button */}
                          <button
                            onClick={() => handleFlashSale(product.id, product.is_flash_sale)}
                            className={`flash-button inline-flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                              product.is_flash_sale
                                ? 'bg-[#1d7b0cbf] text-white active'
                                : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500 dark:bg-gray-700'
                            }`}
                            title={product.is_flash_sale ? 'İndirim Kaldır' : 'İndirim Ekle'}
                          >
                            ⚡
                          </button>

                          {/* Stock limit select — only visible when flash sale is active */}
                          {product.is_flash_sale && (
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide leading-none">Sınırlı Stok</label>
                              <select
                                value={pendingStockLimits[product.id] !== undefined ? (pendingStockLimits[product.id] ?? '') : (product.stock_limit ?? '')}
                                onChange={(e) => handleStockLimitChange(product.id, e.target.value ? Number(e.target.value) : null)}
                                className="rounded-md border border-red-400 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400 dark:border-red-500 dark:bg-gray-800 dark:text-white min-w-[72px] cursor-pointer"
                                style={{ colorScheme: 'dark' } as React.CSSProperties}
                              >
                                <option value="">Seçiniz</option>
                                {Array.from({ length: 60 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n} Adet</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📦</span>
                        <p>Henüz ürün yok</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Carrefoursa Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Carrefoursa'dan Import Et</h2>
                    <p className="text-blue-100 text-xs">Ürün linkini yapıştırın, otomatik içe aktarın</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Carrefoursa Ürün Linki
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => { setImportUrl(e.target.value); setImportResult(null); }}
                    placeholder="https://www.carrefoursa.com/urun-adi-p-123456"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-400"
                    disabled={importLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleCarrefoursaImport()}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  Örnek: https://www.carrefoursa.com/samsung-dw60m5052fw-tr-5prg-bulasik-makinesi-p-30241712
                </p>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`rounded-xl p-4 ${
                  importResult.success
                    ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 ${
                      importResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {importResult.success ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${
                        importResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                      }`}>{importResult.message}</p>
                      {importResult.product && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <span className="font-medium">SKU:</span> {importResult.product.sku}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <span className="font-medium">Marka:</span> {importResult.product.brand}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <span className="font-medium">Fiyat:</span> {importResult.product.price?.toLocaleString('tr-TR')} TL
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <span className="font-medium">Kategori:</span> {importResult.product.category}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <span className="font-medium">Resim Sayısı:</span> {importResult.product.images_count}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={importLoading}
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleCarrefoursaImport}
                  disabled={importLoading || !importUrl.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {importLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Import ediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import Et
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Şok Market Import Modal */}
      {showSokModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Şok Market'ten Import Et</h2>
                    <p className="text-orange-100 text-xs">Ürün linkini yapıştırın, otomatik içe aktarın</p>
                  </div>
                </div>
                <button onClick={() => setShowSokModal(false)} className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Şok Market Ürün Linki</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={sokUrl}
                    onChange={(e) => { setSokUrl(e.target.value); setSokResult(null); }}
                    placeholder="https://www.sokmarket.com.tr/urun-adi-pdp-123"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-400"
                    disabled={sokLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSokImport()}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">%C3%96rnek: https://www.sokmarket.com.tr/clor-renkli-camasir-suyu-750-ml-pdp-47</p>
              </div>
              {sokResult && (
                <div className={`rounded-xl p-4 ${sokResult.success ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 ${sokResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {sokResult.success ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${sokResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>{sokResult.message}</p>
                      {sokResult.product && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-green-700 dark:text-green-400"><span className="font-medium">SKU:</span> {sokResult.product.sku}</p>
                          <p className="text-xs text-green-700 dark:text-green-400"><span className="font-medium">Marka:</span> {sokResult.product.brand}</p>
                          <p className="text-xs text-green-700 dark:text-green-400"><span className="font-medium">Fiyat:</span> {sokResult.product.price?.toLocaleString('tr-TR')} TL</p>
                          <p className="text-xs text-green-700 dark:text-green-400"><span className="font-medium">Kategori:</span> {sokResult.product.category}</p>
                          <p className="text-xs text-green-700 dark:text-green-400"><span className="font-medium">Resim Sayısı:</span> {sokResult.product.images_count}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSokModal(false)} className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors" disabled={sokLoading}>Kapat</button>
                <button type="button" onClick={handleSokImport} disabled={sokLoading || !sokUrl.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-sm font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                  {sokLoading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Import ediliyor...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Import Et</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuel Ürün Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {editProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marka</label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ürün Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-');
                    setFormData({ ...formData, name, slug: editProduct ? formData.slug : slug });
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (URL Dostu İsim)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="huawei-watch-gt4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama (Description)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white h-24"
                  placeholder="Ürün detaylarını buraya yazın..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fiyat (kuruş)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Normal Fiyat</label>
                  <input
                    type="number"
                    value={formData.regular_price}
                    onChange={(e) => setFormData({ ...formData, regular_price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resim URL'leri
                  <span className="ml-1 text-xs font-normal text-gray-400">(virgülle ayırın, birden fazla ekleyebilirsiniz)</span>
                </label>
                <textarea
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white h-20 resize-none"
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                />
                {/* Resim önizlemeleri */}
                {formData.image_url && (() => {
                  const imgs = formData.image_url.split(',').map(u => u.trim()).filter(Boolean);
                  if (imgs.length === 0) return null;
                  return (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {imgs.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Resim ${idx + 1}`}
                            className="h-14 w-14 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-brand-400 transition-colors"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56x56?text=?'; }}
                          />
                          <span className="absolute bottom-0 left-0 right-0 flex items-center justify-center rounded-b-lg bg-black/50 text-[9px] text-white py-0.5">
                            {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="in_stock"
                  checked={formData.in_stock}
                  onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="in_stock" className="text-sm text-gray-700 dark:text-gray-300">
                  Stokta mevcut
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {editProduct ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
