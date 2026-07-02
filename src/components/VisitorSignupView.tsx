import React, { useState } from 'react';
import { visitorsApi } from '../api';

export default function VisitorSignupView() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      await visitorsApi.create({
        name,
        phone,
        email,
        visit_date: new Date().toISOString().split('T')[0],
        invited_by: invitedBy,
        prayer_request: prayerRequest,
        assigned_follow_up_officer: '',
        status: 'New',
        follow_up_notes: '',
      });

      setStatusMessage('Thank you! Your visitor details were received.');
      setName('');
      setPhone('');
      setEmail('');
      setInvitedBy('');
      setPrayerRequest('');
    } catch (error) {
      console.error(error);
      setStatusMessage('We could not save your details right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Visitor Registration</p>
          <h1 className="mt-2 text-3xl font-semibold">Welcome to Morning Church</h1>
          <p className="mt-3 text-sm text-slate-500">Share a few details so the church can follow up with you and pray with you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
          <input
            value={invitedBy}
            onChange={(event) => setInvitedBy(event.target.value)}
            placeholder="Invited by"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
          <textarea
            value={prayerRequest}
            onChange={(event) => setPrayerRequest(event.target.value)}
            placeholder="Prayer request or note"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Visitor Details'}
          </button>
        </form>

        {statusMessage && (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}
