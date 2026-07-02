import React, { useState, useEffect } from 'react';
import { PrayerRequest, PrayerCategory, Role } from '../types';
import { prayerApi } from '../api';
import { dbPrayerToFrontend, frontendPrayerToDb } from '../dataMapper';
import { getTodayString } from '../utils/date';

interface PrayerWallViewProps {
  activeRole: Role;
  userName?: string;
  userEmail?: string;
  onPrayersUpdate?: (prayers: PrayerRequest[]) => void;
}

const CATEGORIES: PrayerCategory[] = ['General', 'Healing', 'Family', 'Financial', 'Salvation', 'Guidance', 'Thanksgiving'];

const categoryColors: Record<string, string> = {
  General: 'bg-slate-100 text-slate-700',
  Healing: 'bg-rose-100 text-rose-700',
  Family: 'bg-blue-100 text-blue-700',
  Financial: 'bg-emerald-100 text-emerald-700',
  Salvation: 'bg-purple-100 text-purple-700',
  Guidance: 'bg-amber-100 text-amber-700',
  Thanksgiving: 'bg-teal-100 text-teal-700',
};

export default function PrayerWallView({ activeRole, userName, userEmail, onPrayersUpdate }: PrayerWallViewProps) {
  const [wallPrayers, setWallPrayers] = useState<PrayerRequest[]>([]);
  const [filter, setFilter] = useState<PrayerCategory | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('General');
  const [isPrivate, setIsPrivate] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const loadWall = async () => {
    const data = await prayerApi.getWall();
    setWallPrayers(data.map(dbPrayerToFrontend));
  };

  useEffect(() => { loadWall().catch(console.error); }, []);

  const handlePray = async (prayer: PrayerRequest) => {
    const dbId = parseInt(prayer.id.replace('PR-', ''), 10);
    setAnimatingId(prayer.id);
    const updated = await prayerApi.pray(dbId);
    const mapped = dbPrayerToFrontend(updated);
    setWallPrayers(prev => prev.map(p => p.id === prayer.id ? mapped : p));
    setTimeout(() => setAnimatingId(null), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText) return;
    const saved = await prayerApi.create(frontendPrayerToDb({
      id: '',
      submittedBy: userName || 'Anonymous',
      email: userEmail || '',
      request: requestText,
      isPrivate,
      status: 'Pending',
      date: getTodayString(),
      category,
    }));
    const mapped = dbPrayerToFrontend(saved);
    if (!isPrivate) setWallPrayers([mapped, ...wallPrayers]);
    onPrayersUpdate?.([mapped]);
    setRequestText('');
    setShowForm(false);
  };

  const filtered = filter === 'All' ? wallPrayers : wallPrayers.filter(p => p.category === filter);
  const isLeader = ['Super Admin', 'Pastor', 'Church Administrator', 'Department Leader'].includes(activeRole);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.15),_transparent_50%)]" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">
              <i className="bi bi-heart-pulse mr-2 text-rose-300"></i>Prayer Wall
            </h3>
            <p className="text-sm text-rose-200 mt-1">Lift one another up — tap "I Prayed" to encourage our family in faith.</p>
          </div>
          <button type="button" onClick={() => setShowForm(true)} className="bg-white text-rose-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors">
            <i className="bi bi-plus-lg mr-1"></i> Share Request
          </button>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2 mt-6">
          <button type="button" onClick={() => setFilter('All')} className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${filter === 'All' ? 'bg-white text-rose-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setFilter(c)} className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${filter === c ? 'bg-white text-rose-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(prayer => (
          <div
            key={prayer.id}
            className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${animatingId === prayer.id ? 'scale-[1.02] ring-2 ring-rose-300' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${categoryColors[prayer.category || 'General']}`}>
                {prayer.category || 'General'}
              </span>
              <span className="text-[10px] text-slate-400">{prayer.date}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{prayer.request}</p>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {isLeader ? prayer.submittedBy : 'A church member'}
              </span>
              <button
                type="button"
                onClick={() => handlePray(prayer)}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-all"
              >
                <i className="bi bi-heart-fill"></i>
                I Prayed · {prayer.prayedCount || 0}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <i className="bi bi-heart text-5xl mb-3 block opacity-30"></i>
          <p>No public prayer requests yet. Be the first to share.</p>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content p-6 space-y-4 max-w-md">
            <h3 className="font-bold text-lg">Share a Prayer Request</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={category} onChange={e => setCategory(e.target.value as PrayerCategory)} className="input-elegant w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea required value={requestText} onChange={e => setRequestText(e.target.value)} placeholder="What can we pray for?" className="input-elegant w-full h-28 resize-none" />
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
                Keep private (pastoral team only — won't appear on wall)
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
