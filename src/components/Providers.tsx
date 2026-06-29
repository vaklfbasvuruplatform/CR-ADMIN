'use client';

import { StatsProvider } from '@/context/StatsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StatsProvider>
      {children}
    </StatsProvider>
  );
}
