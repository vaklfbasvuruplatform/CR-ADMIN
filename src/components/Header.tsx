'use client';

import { useState, useEffect, useRef } from 'react';
import { useStats } from '@/context/StatsContext';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface OnlineVisitor {
  ip: string;
  page: string;
  tutar?: string;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const { stats, setStats, isHeaderPollingEnabled } = useStats();
  
  // Dropdown states
  const [showOnlineDropdown, setShowOnlineDropdown] = useState(false);
  const [onlineVisitors, setOnlineVisitors] = useState<OnlineVisitor[]>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch/poll if enabled (it's disabled when Logs page is active)
    if (!isHeaderPollingEnabled) return;

    // Initial fetch
    fetchStats();

    // Poll every 3 seconds
    const interval = setInterval(fetchStats, 3000);

    return () => clearInterval(interval);
  }, [isHeaderPollingEnabled]);

  useEffect(() => {
    // Click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOnlineDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/header');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch header stats', error);
    }
  };

  const fetchOnlineVisitors = async () => {
    setLoadingVisitors(true);
    try {
      const res = await fetch('/api/online-visitors');
      if (res.ok) {
        const data = await res.json();
        setOnlineVisitors(data);
      }
    } catch (error) {
      console.error('Failed to fetch online visitors', error);
    } finally {
      setLoadingVisitors(false);
    }
  };

  const resetStat = async (type: 'visitors' | 'cart') => {
    const label = type === 'visitors' ? 'Ziyaretçi Sayısı' : 'Sepet Sayısı';
    if (!confirm(`${label}nı sıfırlamak istediğinizden emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/stats/reset?type=${type}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStats();
      }
    } catch (error) {
      console.error('Reset error', error);
    }
  };

  const toggleOnlineDropdown = () => {
    if (!showOnlineDropdown) {
      fetchOnlineVisitors();
    }
    setShowOnlineDropdown(!showOnlineDropdown);
  };

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-10 flex w-full bg-white shadow-sm dark:bg-gray-800 dark:shadow-gray-700/10">
      <div className="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="z-50 block rounded-sm border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:hidden"
          >
            <svg
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="hidden sm:block">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Ara..."
              className="w-full bg-gray-100 rounded-lg border border-transparent py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-green-500"
            />
          </div>
        </div>

        {/* Center Stats (Online & Cart) */}
        <div className="hidden md:flex items-center gap-6">
          {/* Online Users with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleOnlineDropdown}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] uppercase font-bold text-green-500">Online Ziyaretçi</span>
                  <span className="text-base font-bold text-gray-800 dark:text-white leading-none">{stats.online}</span>
                </div>
              </button>
              <button
                onClick={() => resetStat('visitors')}
                title="Ziyaretçi sayısını sıfırla"
                className="ml-1 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Dropdown Menu */}
            {showOnlineDropdown && (
              <div className="absolute top-full left-0 mt-4 w-72 rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 z-[9999]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Online Kullanıcılar</h3>
                  <button 
                    onClick={fetchOnlineVisitors}
                    disabled={loadingVisitors}
                    className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:text-green-500 dark:hover:text-brand-400 dark:hover:bg-brand-500/10"
                    title="Yenile"
                  >
                    <svg className={`w-4 h-4 ${loadingVisitors ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                  {loadingVisitors && onlineVisitors.length === 0 ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : onlineVisitors.length > 0 ? (
                    <div className="space-y-1">
                      {onlineVisitors.map((visitor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {visitor.ip}
                              </span>
                              <span className="text-[10px] text-green-500 dark:text-green-400 truncate max-w-[140px]">
                                {visitor.page}
                              </span>
                            </div>
                          </div>
                          {visitor.tutar && (
                            <span className="text-xs font-bold text-amber-500 dark:text-amber-400 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                              {(parseInt(visitor.tutar) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} TL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-green-500 dark:text-gray-500 text-xs">
                      Aktif kullanıcı bulunamadı
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-[12px] uppercase font-bold text-green-500">Toplam Sepet</span>
              <span className="text-base font-bold text-gray-800 dark:text-white leading-none">{stats.cart}</span>
            </div>
            <button
              onClick={() => resetStat('cart')}
              title="Sepet sayısını sıfırla"
              className="ml-0.5 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-[12px] uppercase font-bold text-green-500">Toplam Ziyaretçi</span>
              <span className="text-base font-bold text-gray-800 dark:text-white leading-none">{stats.total_visitors}</span>
            </div>
            <button
              onClick={() => resetStat('visitors')}
              title="Toplam ziyaretçi sayısını sıfırla"
              className="ml-0.5 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            {darkMode ? (
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800 dark:text-white">Admin</p>
              <p className="text-xs text-gray-500 dark:text-green-500">Yönetici</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
