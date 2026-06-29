import DashboardLayout from '@/components/DashboardLayout';
import { query } from '@/lib/db';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
}

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await query<Category[]>('SELECT * FROM categories ORDER BY sort_order ASC');
    return categories;
  } catch (error) {
    console.error('Categories error:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Kategoriler</h1>
          <p className="text-gray-500 dark:text-gray-400">Ürün kategorileri</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          🏷️ {categories.length} kategori
        </span>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="group rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-2xl text-white">
                  🏷️
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    /{category.slug}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Sıra: {category.sort_order}
                </span>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  ID: {category.id}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
            <span className="text-4xl">🏷️</span>
            <p className="mt-2">Henüz kategori yok</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
