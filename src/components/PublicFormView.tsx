import React, { useState, useEffect } from 'react';
import { formsApi } from '../api';
import { dbFormToFrontend } from '../chMeetingsMapper';
import { CustomForm } from '../types';

export default function PublicFormView() {
  const params = new URLSearchParams(window.location.search);
  const formIdParam = params.get('id') || '';
  const formDbId = formIdParam.replace(/^FORM-/i, '');

  const [form, setForm] = useState<CustomForm | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!formDbId) return;
    formsApi.getAll()
      .then((rows) => {
        const match = rows.find((r: { id: number }) => String(r.id) === formDbId);
        if (match) setForm(dbFormToFrontend(match));
      })
      .catch(() => setErrorMsg('Form not found.'));
  }, [formDbId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDbId) return;
    setStatus('loading');
    try {
      await formsApi.submit(parseInt(formDbId), {
        submitter_name: form.isAnonymous ? 'Anonymous' : name,
        submitter_email: form.isAnonymous ? '' : email,
        responses,
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Submission failed. Please try again.');
    }
  };

  if (!formDbId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-slate-500">Invalid form link.</p>
      </div>
    );
  }

  if (!form && status !== 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-slate-500">{errorMsg || 'Loading form...'}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md">
          <i className="bi bi-check-circle text-4xl text-emerald-500 mb-4"></i>
          <h1 className="text-lg font-bold">Thank you!</h1>
          <p className="text-sm text-slate-500 mt-2">Your response has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{form!.title}</h1>
          {form!.description && <p className="text-sm text-slate-500 mt-2">{form!.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!form!.isAnonymous && (
            <>
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-elegant w-full" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="input-elegant w-full" />
            </>
          )}
          {form!.fields.map((field, i) => (
            <div key={i}>
              <label className="text-[10px] font-bold text-slate-400 uppercase">{field.label}{field.required ? ' *' : ''}</label>
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  value={responses[field.label] || ''}
                  onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                  className="input-elegant w-full mt-1"
                  rows={3}
                />
              ) : (
                <input
                  required={field.required}
                  value={responses[field.label] || ''}
                  onChange={(e) => setResponses({ ...responses, [field.label]: e.target.value })}
                  className="input-elegant w-full mt-1"
                />
              )}
            </div>
          ))}
          {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
