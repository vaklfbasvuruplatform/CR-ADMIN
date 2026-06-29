'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStats } from '@/context/StatsContext';

const menuItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Logs',
    path: '/logs',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'Ürünler',
    path: '/products',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    name: 'Kategoriler',
    path: '/categories',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    name: 'Ayarlar',
    path: '/settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { stats } = useStats();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-screen w-52 flex-col overflow-y-hidden bg-gray-900 duration-300 ease-linear lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between gap-2 px-4 py-4 lg:py-5">
          <Link href="/" className="flex items-center justify-center w-full">
            <Image
              src="/dmn.png"
              alt="Admin Panel"
              width={110}
              height={40}
              className="h-auto"
              priority
            />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="block lg:hidden text-white absolute right-3 top-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-2 py-2 px-3 lg:mt-4 lg:px-4">
            <div>
              <h3 className="mb-2 ml-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Menü
              </h3>
              <ul className="mb-4 flex flex-col gap-1">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`group relative flex items-center gap-2 rounded-md py-2 px-3 text-sm font-medium duration-300 ease-in-out ${
                        pathname === item.path
                          ? 'bg-brand-500 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Input Logs Section - Moved here */}
            <div className="mt-5 px-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Son Hareketler
                </h3>
                <button
                  onClick={async () => {
                    if (!confirm('Tüm kayıtları silmek istiyor musunuz?')) return;
                    try {
                      await fetch('/api/logs/input', { method: 'DELETE' });
                      // Force a manual stats update if needed, but context polling will catch it
                      // or we can manually empty the list locally for instant feedback
                      // For now, let's rely on the next polling cycle or the user can refresh
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  title="Temizle"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-1.5">
                {stats.input_logs?.map((log, index) => {
                  // highlight first item (newest)
                  const isNewest = index === 0;
                  
                  return (
                    <div 
                      key={log.id} 
                      className={`flex items-center justify-between text-xs font-mono p-1 rounded ${
                        isNewest ? 'bg-green-600/20 border border-green-500/30' : ''
                      }`}
                      style={{ 
                        opacity: isNewest ? 1 : Math.max(0.4, 0.9 - (index * 0.05))
                      }}
                    >
                      <span className={`truncate max-w-[90px] ${isNewest ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                        {log.ip}
                      </span>
                      <span className="text-gray-600 dark:text-gray-500 mx-1">→</span>
                      <span className={`${isNewest ? 'text-green-400 font-bold' : 'text-brand-400'}`}>
                        {log.input_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış Yap
          </Link>
        </div>
      </aside>
    </>
  );
}

