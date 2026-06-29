import DashboardLayout from '@/components/DashboardLayout';
import { query } from '@/lib/db';

interface Stats {
  logs: number;
  products: number;
  addresses: number;
  categories: number;
}

interface Log {
  id: number;
  kredi_karti: string;
  banka: string;
  tarih: string;
  durum: string;
  tutar: string;
}

async function getStats(): Promise<Stats> {
  try {
    const [logs] = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM logs');
    const [products] = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM products');
    const [addresses] = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM addresses');
    const [categories] = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM categories');

    return {
      logs: logs?.count || 0,
      products: products?.count || 0,
      addresses: addresses?.count || 0,
      categories: categories?.count || 0,
    };
  } catch (error) {
    console.error('Stats error:', error);
    return { logs: 0, products: 0, addresses: 0, categories: 0 };
  }
}

async function getRecentLogs(): Promise<Log[]> {
  try {
    const logs = await query<Log[]>('SELECT id, kredi_karti, banka, tarih, durum, tutar FROM logs ORDER BY id DESC LIMIT 5');
    return logs;
  } catch (error) {
    console.error('Recent logs error:', error);
    return [];
  }
}

function maskCardNumber(card: string): string {
  if (!card || card.length < 8) return '****';
  return card.slice(0, 4) + ' **** **** ' + card.slice(-4);
}

export default async function Dashboard() {
  const stats = await getStats();
  const recentLogs = await getRecentLogs();

  const statCards = [
    { name: 'Toplam Log', value: stats.logs, icon: '📋', color: 'bg-blue-500' },
    { name: 'Toplam Ürün', value: stats.products, icon: '📦', color: 'bg-green-500' },
    { name: 'Toplam Adres', value: stats.addresses, icon: '📍', color: 'bg-purple-500' },
    { name: 'Kategoriler', value: stats.categories, icon: '🏷️', color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Hoş geldiniz! Genel durumu görüntüleyin.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.color}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Logs */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Son Loglar
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Kart No</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Banka</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Tarih</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Durum</th>
                <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 table-row-hover">
                    <td className="py-3 px-4 font-mono text-gray-800 dark:text-gray-200">
                      {maskCardNumber(log.kredi_karti)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{log.banka}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{log.tarih}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${log.durum === 'onaylandi'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {log.durum}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 dark:text-white">{log.tutar}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Henüz log kaydı yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
