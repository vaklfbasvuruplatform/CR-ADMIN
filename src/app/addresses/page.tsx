'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface Address {
  id: number;
  ip_address: string;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  building_no: string;
  floor_no: string;
  door_no: string;
  address_description: string;
  is_default: boolean;
  created_at: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses');
      const data = await res.json();
      setAddresses(data);
    } catch (error) {
      toast.error('Adresler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Adres silindi');
        fetchAddresses();
      } else {
        toast.error('Silme başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Adresler</h1>
          <p className="text-gray-500 dark:text-gray-400">Kayıtlı adresler</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          📍 {addresses.length} adres
        </span>
      </div>

      {/* Addresses Grid */}
      {/* Addresses Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">ID</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Başlık</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Ad Soyad</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Telefon</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">İl / İlçe</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Adres Detayı</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">IP</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Yükleniyor...</p>
                  </td>
                </tr>
              ) : addresses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <span className="text-4xl block mb-2">📍</span>
                    Henüz adres yok
                  </td>
                </tr>
              ) : (
                addresses.map((address) => (
                  <tr key={address.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      #{address.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white">{address.title}</span>
                        {address.is_default && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wide">
                            Varsayılan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {address.first_name} {address.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {address.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {address.city} / {address.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                      <div className="line-clamp-2">
                        {address.neighborhood}, {address.street}
                        {address.building_no && ` No: ${address.building_no}`}
                        {address.floor_no && ` Kat: ${address.floor_no}`}
                        {address.door_no && ` Daire: ${address.door_no}`}
                        {address.address_description && (
                          <span className="block text-xs italic text-gray-400 mt-1">
                            Not: {address.address_description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {address.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        title="Sil"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
