import React, { useState, useEffect } from 'react';
import { checkinApi } from '../api';

type Step = 'phone' | 'family' | 'success';

interface FamilyMember {
  id: number;
  name: string;
  phone?: string;
  alreadyCheckedIn: boolean;
  isSuggested?: boolean;
  isYou?: boolean;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
  'from-fuchsia-400 to-purple-600',
];

export default function SundayCheckInView() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [eventId, setEventId] = useState<number | null>(null);
  const [serviceDate, setServiceDate] = useState('');
  const [checkedInNames, setCheckedInNames] = useState<string[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [confirmRequired, setConfirmRequired] = useState(false);
  const [surnameHint, setSurnameHint] = useState<string | null>(null);
  const [lookupMode, setLookupMode] = useState<'registered' | 'suggested' | 'solo'>('solo');

  useEffect(() => {
    checkinApi.getSundayStats()
      .then(s => setLiveCount(s.checkedInCount))
      .catch(() => {});
    const interval = setInterval(() => {
      checkinApi.getSundayStats().then(s => setLiveCount(s.checkedInCount)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await checkinApi.lookupFamily(phone);
      setHouseholdName(data.householdName);
      setMembers(data.members);
      setEventId(data.eventId);
      setServiceDate(data.serviceDate);
      setLiveCount(data.checkedInToday);
      setConfirmRequired(Boolean(data.confirmRequired));
      setSurnameHint(data.surnameHint || null);
      setLookupMode(data.lookupMode || 'solo');

      const toSelect = new Set<number>(
        data.members
          .filter((m: FamilyMember) => {
            if (m.alreadyCheckedIn) return false;
            if (data.confirmRequired) return m.isYou;
            return true;
          })
          .map((m: FamilyMember) => m.id)
      );
      setSelected(toSelect);
      setStep('family');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCheckIn = async () => {
    if (!eventId || selected.size === 0) return;
    setLoading(true);
    setError('');
    try {
      const result = await checkinApi.familyCheckIn({
        event_id: eventId,
        member_ids: Array.from(selected),
      });
      setCheckedInNames(result.members.map((m: { name: string }) => m.name));
      setLiveCount(c => c + result.count);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('phone');
    setPhone('');
    setMembers([]);
    setSelected(new Set());
    setError('');
    setCheckedInNames([]);
    setConfirmRequired(false);
    setSurnameHint(null);
    setLookupMode('solo');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519491050282-cf00f5272760?w=1920&auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/95 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col max-w-lg mx-auto px-5 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 mb-4">
            <i className="bi bi-qr-code-scan text-2xl text-slate-950"></i>
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Bethel Baptist Church</h1>
          <p className="text-amber-400/90 text-sm font-semibold mt-1 uppercase tracking-widest">Sunday Check-In</p>
          {serviceDate && step !== 'phone' && (
            <p className="text-slate-400 text-xs mt-2">{new Date(serviceDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          )}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {liveCount} checked in today
          </div>
        </div>

        {/* Step: Phone */}
        {step === 'phone' && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <div className="glass-dark rounded-3xl p-6 border border-white/10 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                  <i className="bi bi-phone text-3xl text-amber-400"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Enter your phone number</h2>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Enter your number — we'll show your family. If you're not registered yet, we'll suggest people with the same surname for you to confirm.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="relative">
                  <i className="bi bi-telephone absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/70"></i>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoFocus
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="024 123 4567"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-lg font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                    <i className="bi bi-exclamation-circle shrink-0 mt-0.5"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2"><i className="bi bi-arrow-repeat animate-spin"></i> Looking up...</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Find My Family <i className="bi bi-arrow-right"></i></span>
                  )}
                </button>
              </form>
            </div>

            <p className="text-center text-slate-500 text-xs mt-6">
              First time? Visit the welcome desk — we'll add your family to the directory.
            </p>
          </div>
        )}

        {/* Step: Family selection */}
        {step === 'family' && (
          <div className="flex-1 flex flex-col animate-slide-up space-y-4">
            <div className="glass-dark rounded-3xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Your Household</p>
                  <h2 className="text-lg font-bold text-white">{householdName}</h2>
                </div>
                <button type="button" onClick={reset} className="text-slate-400 hover:text-white p-2">
                  <i className="bi bi-arrow-left text-lg"></i>
                </button>
              </div>

              <p className="text-slate-400 text-xs mb-4">
                {confirmRequired
                  ? 'Only people matched to your phone are pre-selected. Tap to add family members with the same surname who are here today.'
                  : 'Tap to select who\'s here today — all household members are pre-selected.'}
              </p>

              {confirmRequired && surnameHint && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-100 text-sm">
                  <div className="flex items-start gap-2">
                    <i className="bi bi-people-fill text-amber-400 shrink-0 mt-0.5"></i>
                    <div>
                      <p className="font-semibold text-amber-200">Please confirm your family</p>
                      <p className="text-amber-100/80 text-xs mt-1 leading-relaxed">
                        We found others with the surname <span className="font-bold text-white">{surnameHint}</span>.
                        Not everyone may be related — only tick the people in your household today.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {members.map((m, idx) => {
                  const isSelected = selected.has(m.id);
                  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const isSuggested = m.isSuggested && lookupMode === 'suggested';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => !m.alreadyCheckedIn && toggleMember(m.id)}
                      disabled={m.alreadyCheckedIn}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        m.alreadyCheckedIn
                          ? 'bg-emerald-500/10 border-emerald-500/20 opacity-70 cursor-default'
                          : isSelected
                          ? isSuggested
                            ? 'bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10'
                            : 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10'
                          : isSuggested
                          ? 'bg-white/[0.03] border-violet-500/20 border-dashed hover:border-violet-500/40'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                        {initials(m.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{m.name}</div>
                        {m.alreadyCheckedIn ? (
                          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                            <i className="bi bi-check-circle-fill"></i> Already checked in
                          </div>
                        ) : m.isYou ? (
                          <div className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                            <i className="bi bi-telephone-fill"></i> Matched to your phone
                          </div>
                        ) : isSuggested ? (
                          <div className="text-xs text-violet-300 mt-0.5 flex items-center gap-1">
                            <i className="bi bi-question-circle"></i> Same surname — confirm if family
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 mt-0.5">{isSelected ? 'Present today' : 'Tap to include'}</div>
                        )}
                      </div>
                      {!m.alreadyCheckedIn && (
                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-600'
                        }`}>
                          {isSelected && <i className="bi bi-check-lg text-slate-950 font-bold"></i>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">{error}</div>
            )}

            <button
              type="button"
              onClick={handleCheckIn}
              disabled={loading || selected.size === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all active:scale-[0.98]"
            >
              {loading ? 'Checking in...' : (
                <span className="flex items-center justify-center gap-2">
                  <i className="bi bi-check2-circle text-lg"></i>
                  {confirmRequired ? 'Confirm & Check In' : 'Check In'} {selected.size} {selected.size === 1 ? 'Person' : 'People'}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-bounce-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-6">
              <i className="bi bi-check-lg text-5xl text-white"></i>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">You're Checked In!</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Welcome to worship. May you be blessed today.
            </p>
            <div className="glass-dark rounded-2xl p-4 border border-white/10 w-full mb-8 space-y-2">
              {checkedInNames.map(name => (
                <div key={name} className="flex items-center gap-2 text-sm text-white">
                  <i className="bi bi-person-check text-emerald-400"></i>
                  {name}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-amber-400 font-semibold text-sm hover:text-amber-300 transition-colors"
            >
              Check in another family →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
