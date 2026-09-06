import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formsApi, messagingApi } from '../api';
import { getTodayString } from '../utils/date';

type VipContact = {
  key: string;
  kind: 'member' | 'guest';
  submissionId: number;
  name: string;
  phone: string;
  label: string;
  category?: string;
  priority?: string;
  guestIndex?: number;
};

type VipSubmission = {
  id: number;
  submitter_name: string;
  submitter_email: string;
  responses: Record<string, string>;
  submitted_at: string;
  contacts: VipContact[];
  guestCount: number;
};

const TEMPLATES: { id: string; label: string; body: string }[] = [
  {
    id: 'thanks',
    label: 'Thank nominator',
    body: 'Hi {{name}}, thank you again for your VIP guest nomination for REV DR SAM ATO BENTIL\'s Retirement & Send-Off. Liberty Assemblies of God appreciates you. God bless you!',
  },
  {
    id: 'followup',
    label: 'Follow-up',
    body: 'Hi {{name}}, this is Liberty Assemblies of God following up on the VIP nomination for REV DR SAM ATO BENTIL\'s Retirement & Send-Off. Please reply if you have any updates. Thank you!',
  },
  {
    id: 'invite-reminder',
    label: 'Program reminder',
    body: 'Hi {{name}}, reminder from Liberty Assemblies of God: REV DR SAM ATO BENTIL\'s Retirement & Send-Off is coming up. On the program day, scan the church attendance QR to check in. God bless you!',
  },
  {
    id: 'custom',
    label: 'Custom message',
    body: 'Hi {{name}}, ',
  },
];

function parseResponses(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, string>;
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

export default function VipNominationsPanel({ sentBy = 'admin' }: { sentBy?: string }) {
  const [submissions, setSubmissions] = useState<VipSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'members' | 'guests'>('all');
  const [search, setSearch] = useState('');
  const [templateId, setTemplateId] = useState('thanks');
  const [message, setMessage] = useState(TEMPLATES[0].body);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [smsReady, setSmsReady] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [data, cfg] = await Promise.all([
        formsApi.getVipNominations(),
        messagingApi.getConfig().catch(() => null),
      ]);
      setSubmissions(data.submissions || []);
      setSmsReady(Boolean(cfg?.intekConfigured && cfg?.smsEnabled));
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load nominations');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allContacts = useMemo(
    () => submissions.flatMap((s) => s.contacts || []),
    [submissions]
  );

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allContacts.filter((c) => {
      if (filter === 'members' && c.kind !== 'member') return false;
      if (filter === 'guests' && c.kind !== 'guest') return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      );
    });
  }, [allContacts, filter, search]);

  const selectedRecipients = useMemo(
    () => allContacts.filter((c) => selected.has(c.key)),
    [allContacts, selected]
  );

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredContacts.forEach((c) => next.add(c.key));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) setMessage(t.body);
  };

  const exportCsv = () => {
    const keys = [
      'submitted_at', 'submitter_name', 'Member Telephone/WhatsApp', 'Member Ministry/Department/Group',
      'Guest 1 Full Name', 'Guest 1 Title/Position', 'Guest 1 Organization/Institution/Church',
      'Guest 1 Category', 'Guest 1 Telephone', 'Guest 1 WhatsApp', 'Guest 1 Email',
      'Guest 1 Invitation priority', 'Guest 1 Likely to attend',
      'Guest 2 Full Name', 'Guest 3 Full Name', 'Guest 4 Full Name',
    ];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      keys.join(','),
      ...submissions.map((s) => {
        const r = parseResponses(s.responses);
        return keys.map((k) => {
          if (k === 'submitted_at') return escape(new Date(s.submitted_at).toLocaleString());
          if (k === 'submitter_name') return escape(s.submitter_name || r['Member Name'] || '');
          return escape(r[k] || '');
        }).join(',');
      }),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vip-nominations-${getTodayString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendSms = async () => {
    if (!selectedRecipients.length) {
      setErrorMsg('Select at least one person with a phone number.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Write an SMS message first.');
      return;
    }
    setSending(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const result = await formsApi.sendVipNominationSms({
        message: message.trim(),
        recipients: selectedRecipients.map((c) => ({
          key: c.key,
          name: c.name,
          phone: c.phone,
          submissionId: c.submissionId,
          kind: c.kind,
        })),
        sent_by: sentBy,
      });
      setStatusMsg(
        `SMS finished: ${result.sent} sent/queued` +
          (result.failed ? `, ${result.failed} failed` : '') +
          (result.results?.some((r: { status: string }) => r.status === 'stub')
            ? ' (stub mode — check Settings → SMS if needed)'
            : '')
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-800">
            <i className="bi bi-people-fill text-indigo-500 mr-2"></i>
            VIP nominations inbox
          </h4>
          <p className="text-sm text-slate-500 mt-1">
            {submissions.length} submission{submissions.length === 1 ? '' : 's'} · {allContacts.length} phone contact
            {allContacts.length === 1 ? '' : 's'} ready for SMS
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise mr-1"></i>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          {submissions.length > 0 && (
            <button type="button" className="btn-secondary text-sm" onClick={exportCsv}>
              <i className="bi bi-download mr-1"></i> Export CSV
            </button>
          )}
        </div>
      </div>

      {!smsReady && (
        <div className="mx-5 sm:mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          SMS provider may not be ready. Confirm your Intek key under <strong>Settings → SMS messaging</strong>.
        </div>
      )}

      {(statusMsg || errorMsg) && (
        <div className={`mx-5 sm:mx-6 mt-4 rounded-xl border px-4 py-3 text-sm ${
          errorMsg ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {errorMsg || statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-0 xl:divide-x divide-slate-100">
        {/* Left: submissions + contacts */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="input-elegant flex-1"
            />
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
              {([
                ['all', 'All'],
                ['members', 'Nominators'],
                ['guests', 'Guests'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`px-3 py-2 ${filter === id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={selectVisible} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600">
              Select visible ({filteredContacts.length})
            </button>
            <button type="button" onClick={clearSelection} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600">
              Clear selection
            </button>
            <span className="px-3 py-1.5 text-slate-500 self-center">
              {selected.size} selected
            </span>
          </div>

          {loading && <p className="text-sm text-slate-400">Loading nominations...</p>}

          {!loading && submissions.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No nominations yet. Share the nomination QR so members can submit.
            </div>
          )}

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {submissions.map((s) => {
              const r = parseResponses(s.responses);
              const open = expandedId === s.id;
              const guestNames = [1, 2, 3, 4]
                .map((n) => r[`Guest ${n} Full Name`])
                .filter(Boolean)
                .join(', ');
              const rowContacts = (s.contacts || []).filter((c) => {
                if (filter === 'members' && c.kind !== 'member') return false;
                if (filter === 'guests' && c.kind !== 'guest') return false;
                if (!search.trim()) return true;
                const q = search.trim().toLowerCase();
                return c.name.toLowerCase().includes(q) || c.phone.includes(q);
              });

              return (
                <div key={s.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-start gap-3 px-4 py-3 bg-white">
                    <div className="pt-1 space-y-2">
                      {(s.contacts || []).map((c) => (
                        <label key={c.key} className="flex items-center gap-1.5 cursor-pointer" title={`${c.label}: ${c.phone}`}>
                          <input
                            type="checkbox"
                            checked={selected.has(c.key)}
                            onChange={() => toggle(c.key)}
                            className="h-3.5 w-3.5 accent-indigo-600"
                          />
                        </label>
                      ))}
                      {(s.contacts || []).length === 0 && (
                        <span className="text-[10px] text-slate-400">No phone</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="flex-1 text-left min-w-0"
                      onClick={() => setExpandedId(open ? null : s.id)}
                    >
                      <div className="font-semibold text-slate-800 truncate">
                        {s.submitter_name || r['Member Name'] || 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {r['Member Telephone/WhatsApp'] || '—'}
                        {r['Member Ministry/Department/Group'] ? ` · ${r['Member Ministry/Department/Group']}` : ''}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1 truncate">
                        Guests: {guestNames || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(s.submitted_at).toLocaleString()} · tap for full details
                      </div>
                    </button>
                    <i className={`bi bi-chevron-${open ? 'up' : 'down'} text-slate-400 mt-2`}></i>
                  </div>

                  {/* Contact chips for this submission */}
                  {rowContacts.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      {rowContacts.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => toggle(c.key)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selected.has(c.key)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200'
                          }`}
                        >
                          <i className={`bi ${c.kind === 'member' ? 'bi-person-fill' : 'bi-star-fill'}`}></i>
                          <span>{c.label}: {c.name.split(' ')[0]}</span>
                          <span className="font-mono opacity-70">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {Object.entries(r)
                        .filter(([, v]) => v !== undefined && String(v).trim() !== '')
                        .map(([key, value]) => (
                          <div key={key} className={key.startsWith('Guest') || key.includes('recommend') || key.includes('Why') ? 'sm:col-span-2' : ''}>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key}</div>
                            <div className="text-slate-800 mt-0.5 whitespace-pre-wrap">{String(value)}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: SMS composer */}
        <div className="p-5 sm:p-6 bg-slate-50/60 space-y-4 sticky top-0 self-start">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Send SMS</h5>
            <p className="text-sm text-slate-600 mt-1">
              Select people on the left, pick a template, then send. Use <code className="text-xs bg-white px-1 rounded border">{'{{name}}'}</code> for first name.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                  templateId === t.id
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="input-elegant w-full text-sm"
            placeholder="SMS message..."
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{message.length} characters · ~{Math.max(1, Math.ceil(message.length / 160))} SMS segment(s)</span>
            <span>{selectedRecipients.length} recipient(s)</span>
          </div>

          {selectedRecipients.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 max-h-36 overflow-y-auto space-y-1">
              {selectedRecipients.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 truncate">
                    {c.name} <span className="font-normal text-slate-400">({c.label})</span>
                  </span>
                  <span className="font-mono text-slate-500 shrink-0">{c.phone}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={sendSms}
            disabled={sending || selectedRecipients.length === 0}
            className="btn-primary w-full disabled:opacity-50"
          >
            <i className="bi bi-chat-dots-fill mr-2"></i>
            {sending
              ? 'Sending...'
              : `Send SMS to ${selectedRecipients.length || 0} selected`}
          </button>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Tick nominators and/or guests that have phone numbers. Guests without a phone are skipped automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
