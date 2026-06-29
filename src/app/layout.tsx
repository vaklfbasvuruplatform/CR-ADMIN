import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { StatsProvider } from '@/context/StatsContext';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'TailAdmin Admin Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900">
        <StatsProvider>
          <Toaster position="top-right" />
          {children}
        </StatsProvider>
      </body>
    </html>
  );
}
