import React, { useState, useEffect } from 'react';
import { eventsApi, checkinApi } from '../api';
import { dbEventToFrontend } from '../dataMapper';
import { dbCheckInToFrontend } from '../chMeetingsMapper';

export default function PublicCheckInView() {
  const params = new URLSearchParams(window.location.search);
  const eventIdParam = params.get('event') || '';

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [email, setEmail] = useState('');
  const [familyTag, setFamilyTag] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [checkedInCount, setCheckedInCount] = useState(0);

  const eventDbId = eventIdParam.replace(/^E-/i, '');

  useEffect(() => {
    if (!eventDbId) return;
    eventsApi.getById(parseInt(eventDbId))
      .then((ev) => {
        const frontend = dbEventToFrontend(ev);
        setEventTitle(frontend.title);
        setEventDate(frontend.date);
      })
      .catch(() => setMessage('Event not found.'));
    checkinApi.getAll(parseInt(eventDbId))
      .then((rows) => setCheckedInCount(rows.length))
      .catch(() => {});
  }, [eventDbId]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDbId || !email) return;
    setStatus('loading');
    setMessage('');
    try {
      const result = await checkinApi.publicCheckIn({
        event_id: parseInt(eventDbId),
        email: email.trim().toLowerCase(),
        family_tag: familyTag || undefined,
      });
      dbCheckInToFrontend(result);
      setStatus('success');
      setMessage(`Welcome! You are checked in for ${eventTitle || 'this event'}.`);
      setCheckedInCount((c) => c + 1);
      setEmail('');
      setFamilyTag('');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Check-in failed. Verify your email is registered as a member.');
    }
  };

  if (!eventDbId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <i className="bi bi-qr-code text-4xl text-slate-300 mb-4"></i>
          <h1 className="text-lg font-bold text-slate-800">Invalid check-in link</h1>
          <p className="text-sm text-slate-500 mt-2">Scan the QR code at the event or ask an usher for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="bi bi-check-circle text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold">Event Check-In</h1>
          <p className="text-teal-100 text-sm mt-1">Liberty Assemblies of God</p>
        </div>

        <div className="p-6 space-y-5">
          {eventTitle && (
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="font-bold text-slate-800">{eventTitle}</div>
              <div className="text-xs text-slate-500 mt-1">{eventDate}</div>
              <div className="text-[10px] text-teal-600 font-semibold mt-2">{checkedInCount} checked in</div>
            </div>
          )}

          {status === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <i className="bi bi-check-lg text-3xl text-emerald-600"></i>
              </div>
              <p className="text-emerald-700 font-medium">{message}</p>
              <button
                type="button"
                onClick={() => { setStatus('idle'); setMessage(''); }}
                className="text-sm text-teal-600 font-semibold hover:underline"
              >
                Check in another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-elegant w-full mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Family tag (optional)</label>
                <input
                  type="text"
                  value={familyTag}
                  onChange={(e) => setFamilyTag(e.target.value)}
                  placeholder="e.g. Smith Family"
                  className="input-elegant w-full mt-1"
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full py-4 text-base disabled:opacity-50"
              >
                {status === 'loading' ? 'Checking in...' : 'Check In Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
