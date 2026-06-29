'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface TelegramBot {
  id: number;
  bot_token: string;
  chat_id: string;
}

export default function TelegramBotManager() {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/settings/telegram-bots');
      const data = await res.json();
      if (data.bots) {
        setBots(data.bots);
      }
    } catch (error) {
      console.error('Failed to fetch bots', error);
      toast.error('Botlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch('/api/settings/telegram-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken, chat_id: chatId }),
      });

      if (res.ok) {
        toast.success('Bot eklendi');
        setBotToken('');
        setChatId('');
        fetchBots();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Bot eklenemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBot = async (id: number) => {
    if (!confirm('Bu botu silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/settings/telegram-bots?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Bot silindi');
        setBots(bots.filter(b => b.id !== id));
      } else {
        toast.error('Silme başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <span>🤖</span> Telegram Botları
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add New Bot Form */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Yeni Bot Ekle</h3>
          <form onSubmit={handleAddBot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="123456:ABC-DEF..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="-100..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {adding ? 'Ekleniyor...' : 'Bot Ekle'}
            </button>
          </form>
        </div>

        {/* Bot List */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Kayıtlı Botlar ({bots.length})</h3>
          
          {loading ? (
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          ) : bots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">Henüz bot eklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bots.map((bot) => (
                <div key={bot.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      Token: <span className="font-mono text-xs text-gray-500">{bot.bot_token.substring(0, 10)}...</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Chat ID: <span className="font-mono">{bot.chat_id}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBot(bot.id)}
                    className="shrink-0 text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
