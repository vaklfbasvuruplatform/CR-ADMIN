'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface InputLog {
  id: number;
  ip: string;
  input_type: string;
  tarih: string;
}

interface Stats {
  online: number;
  cart: number;
  input_logs: InputLog[];
  total_visitors: number;
}

interface StatsContextType {
  stats: Stats;
  setStats: (stats: Stats) => void;
  isHeaderPollingEnabled: boolean;
  setIsHeaderPollingEnabled: (enabled: boolean) => void;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats>({ online: 0, cart: 0, input_logs: [], total_visitors: 0 });
  const [isHeaderPollingEnabled, setIsHeaderPollingEnabled] = useState(true);

  return (
    <StatsContext.Provider value={{ stats, setStats, isHeaderPollingEnabled, setIsHeaderPollingEnabled }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}
