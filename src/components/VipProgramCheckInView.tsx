import React, { useEffect, useState } from 'react';
import { checkinApi } from '../api';

export default function VipProgramCheckInView() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [eventTitle, setEventTitle] = useState("REV DR SAM ATO BENTIL Retirement & Send-Off");
  const [checkedInCount, setCheckedInCount] = useState(0);

  useEffect(() => {
    checkinApi.getVipProgramQr()
      .then((data) => {
        if (data.eventTitle) setEventTitle(data.eventTitle);
        if (typeof data.checkedInCount === 'number') setCheckedInCount(data.checkedInCount);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const result = await checkinApi.vipProgramCheckIn({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      setStatus('success');
      setMessage(result.message || 'You are checked in. Welcome!');
      if (!result.alreadyCheckedIn) setCheckedInCount((c) => c + 1);
      setFullName('');
      setPhone('');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Check-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea]">
      <div className="relative overflow-hidden border-b border-amber-200/70 bg-[#1f2a1c] text-[#f7f3ea]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#c9a227,transparent_40%),radial-gradient(circle_at_80%_0%,#4a6741,transparent_35%)]" />
        <div className="relative mx-auto max-w-lg px-5 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/90">Liberty Assemblies of God</p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold">Program Attendance</h1>
          <p className="mt-2 text-sm text-amber-50/85">{eventTitle}</p>
          <p className="mt-3 text-xs text-amber-100/70">{checkedInCount} checked in</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {status === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-3xl">
                <i className="bi bi-check-lg" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Welcome!</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
              <p className="text-xs text-slate-400">A confirmation SMS has been sent to your phone.</p>
              <button
                type="button"
                onClick={() => { setStatus('idle'); setMessage(''); }}
                className="text-sm font-semibold text-amber-800 hover:underline"
              >
                Check in another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter your name and phone to mark that you came for the program. Members and invited guests are welcome.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone / WhatsApp</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  placeholder="e.g. 024XXXXXXX"
                />
              </div>
              {status === 'error' && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-2xl bg-[#1f2a1c] px-4 py-3.5 text-sm font-semibold text-[#f7f3ea] hover:bg-[#2a3926] disabled:opacity-60"
              >
                {status === 'loading' ? 'Checking in…' : 'I Am Here — Check In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
