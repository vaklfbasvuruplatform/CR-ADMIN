'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TelegramBotManager from '@/components/TelegramBotManager';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        toast.success('Şifre güncellendi');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Şifre güncellenemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ayarlar</h1>
        <p className="text-gray-500 dark:text-gray-400">Admin ve görünüm ayarları</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Password Change */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            🔑 Şifre Değiştir
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        </div>

        {/* Telegram Bot Manager */}
        <TelegramBotManager />
      </div>
    </DashboardLayout>
  );
}
