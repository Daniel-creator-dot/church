import React, { useState, useEffect } from 'react';
import { checkinApi } from '../api';

interface WelcomeDeskKioskViewProps {
  onExit?: () => void;
  showExit?: boolean;
}

export default function WelcomeDeskKioskView({ onExit, showExit = true }: WelcomeDeskKioskViewProps) {
  const [qr, setQr] = useState<{
    qrDataUrl: string;
    checkInUrl: string;
    eventTitle: string;
    checkedInCount: number;
    serviceDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQr = () => {
    checkinApi.getSundayQr()
      .then(data => {
        setQr({
          qrDataUrl: data.qrDataUrl,
          checkInUrl: data.checkInUrl,
          eventTitle: data.eventTitle,
          checkedInCount: data.checkedInCount,
          serviceDate: data.serviceDate,
        });
        setError('');
      })
      .catch(() => setError('Could not load check-in QR. Check your connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQr();
    const interval = setInterval(() => {
      checkinApi.getSundayStats()
        .then(s => setQr(prev => prev ? { ...prev, checkedInCount: s.checkedInCount } : prev))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const serviceLabel = qr?.serviceDate
    ? new Date(qr.serviceDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Today';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 md:p-12 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {showExit && onExit && (
        <button
          type="button"
          onClick={onExit}
          className="absolute top-4 right-4 z-20 text-white/40 hover:text-white text-sm px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
        >
          <i className="bi bi-x-lg mr-1"></i> Exit
        </button>
      )}

      <div className="relative z-10 text-center max-w-2xl w-full">
        <p className="text-amber-400/90 text-xs font-bold uppercase tracking-[0.3em] mb-2">Liberty Assemblies of God</p>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-1">Welcome — Check In</h1>
        <p className="text-slate-400 text-sm md:text-base mb-8">{serviceLabel}</p>

        {loading && <p className="text-slate-400 animate-pulse">Loading QR code...</p>}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            {error}
            <button type="button" onClick={loadQr} className="block mx-auto mt-3 text-amber-400 font-semibold">Retry</button>
          </div>
        )}

        {qr && (
          <>
            <div className="inline-block bg-white p-5 md:p-6 rounded-3xl shadow-2xl shadow-amber-500/10 mb-8">
              <img src={qr.qrDataUrl} alt="Sunday check-in QR" width={320} height={320} className="rounded-xl max-w-[min(320px,70vw)] h-auto" />
            </div>

            <p className="text-lg text-slate-300 mb-2">Scan with your phone camera</p>
            <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto">
              Enter your phone number or family code to check in your household
            </p>

            <div className="inline-flex items-center gap-6 px-8 py-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-left">
                <div className="text-4xl md:text-5xl font-black text-amber-400 tabular-nums">{qr.checkedInCount}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Checked in today</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-left text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live count
                </div>
                <div className="text-xs mt-1 text-slate-500">Updates every 10s</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
