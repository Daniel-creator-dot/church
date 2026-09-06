import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formsApi, messagingApi } from '../api';
import { getTodayString } from '../utils/date';

type VipContact = {
  key: string;
  kind: 'member' | 'guest' | 'manual';
  submissionId?: number;
  name: string;
  phone: string;
  label: string;
  category?: string;
  priority?: string;
  guestIndex?: number;
  note?: string;
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

function parseBulkText(text: string): { name: string; phone: string }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // "Name, 024..." or "Name - 024..." or "024..." only
      const parts = line.split(/[,;|\t\-–—]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        return { name: 'Contact', phone: parts[0] };
      }
      const phone = parts[parts.length - 1];
      const name = parts.slice(0, -1).join(' ');
      return { name, phone };
    })
    .filter((c) => c.phone.replace(/\D/g, '').length >= 9);
}

export default function VipNominationsPanel({ sentBy = 'admin' }: { sentBy?: string }) {
  const [submissions, setSubmissions] = useState<VipSubmission[]>([]);
  const [manualContacts, setManualContacts] = useState<VipContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'members' | 'guests' | 'manual'>('all');
  const [search, setSearch] = useState('');
  const [templateId, setTemplateId] = useState('thanks');
  const [message, setMessage] = useState(TEMPLATES[0].body);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [smsReady, setSmsReady] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  const [outbox, setOutbox] = useState<{ id: number; recipient: string; body: string; status: string; created_at: string; error_message?: string }[]>([]);

  const loadOutbox = useCallback(async (sync = true) => {
    try {
      const rows = await messagingApi.getOutbox(15, sync);
      setOutbox(rows || []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [data, cfg] = await Promise.all([
        formsApi.getVipNominations(),
        messagingApi.getConfig().catch(() => null),
      ]);
      setSubmissions(data.submissions || []);
      setManualContacts((data.manualContacts || []).map((c: VipContact) => ({
        ...c,
        kind: 'manual',
        label: c.label || 'Added',
      })));
      setSmsReady(Boolean(cfg?.intekConfigured && cfg?.smsEnabled));
      await loadOutbox(true);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to load nominations');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [loadOutbox]);

  useEffect(() => {
    load();
  }, [load]);

  const nominationContacts = useMemo(
    () => submissions.flatMap((s) => s.contacts || []),
    [submissions]
  );

  const allContacts = useMemo(
    () => [...nominationContacts, ...manualContacts],
    [nominationContacts, manualContacts]
  );

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allContacts.filter((c) => {
      if (filter === 'members' && c.kind !== 'member') return false;
      if (filter === 'guests' && c.kind !== 'guest') return false;
      if (filter === 'manual' && c.kind !== 'manual') return false;
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

  const selectAllContacts = () => {
    setSelected(new Set(allContacts.map((c) => c.key)));
  };

  const clearSelection = () => setSelected(new Set());

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) setMessage(t.body);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingContact(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const result = await formsApi.addVipContact({ name: newName.trim(), phone: newPhone.trim() });
      setManualContacts(result.contacts || []);
      const addedKey = result.added?.[0]?.key;
      if (addedKey) {
        setSelected((prev) => new Set(prev).add(addedKey));
      }
      setNewName('');
      setNewPhone('');
      setStatusMsg('Contact added and selected for SMS.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add contact');
    } finally {
      setAddingContact(false);
    }
  };

  const handleBulkAdd = async () => {
    const rows = parseBulkText(bulkText);
    if (!rows.length) {
      setErrorMsg('Paste contacts as: Name, 024XXXXXXX (one per line)');
      return;
    }
    setAddingContact(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const result = await formsApi.addVipContact({ contacts: rows });
      setManualContacts(result.contacts || []);
      const addedKeys = (result.added || []).map((c: VipContact) => c.key);
      setSelected((prev) => {
        const next = new Set(prev);
        addedKeys.forEach((k: string) => next.add(k));
        return next;
      });
      setBulkText('');
      setShowBulk(false);
      setStatusMsg(`Added ${addedKeys.length} contact(s) and selected them for SMS.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add contacts');
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteManual = async (key: string) => {
    try {
      const result = await formsApi.deleteVipContact(key);
      setManualContacts(result.contacts || []);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete contact');
    }
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
      setErrorMsg('Select at least one person (or add a contact first).');
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
        `Submitted to Intek for ${result.sent} of ${result.count} people` +
          (result.failed ? ` (${result.failed} failed)` : '') +
          '. Check delivery status below — phones can take a minute.'
      );
      await loadOutbox(true);
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
            VIP nominations &amp; SMS
          </h4>
          <p className="text-sm text-slate-500 mt-1">
            {submissions.length} submission{submissions.length === 1 ? '' : 's'} · {allContacts.length} contacts · {selected.size} selected
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

      {/* Add contacts */}
      <div className="mx-5 sm:mx-6 mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            <i className="bi bi-person-plus-fill mr-1"></i> Add contact(s)
          </h5>
          <button
            type="button"
            onClick={() => setShowBulk((v) => !v)}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            {showBulk ? 'Single contact' : 'Paste multiple numbers'}
          </button>
        </div>

        {!showBulk ? (
          <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              className="input-elegant"
              required
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Phone e.g. 024XXXXXXX"
              className="input-elegant"
              required
            />
            <button type="submit" disabled={addingContact} className="btn-primary whitespace-nowrap">
              {addingContact ? 'Adding...' : 'Add & select'}
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={4}
              className="input-elegant w-full font-mono text-sm"
              placeholder={'One per line:\nKwame Mensah, 0241234567\nAma Boateng, 0209876543\n0241112233'}
            />
            <button type="button" disabled={addingContact} onClick={handleBulkAdd} className="btn-primary">
              {addingContact ? 'Adding...' : 'Add all & select for SMS'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-0 xl:divide-x divide-slate-100">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="input-elegant flex-1"
            />
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold flex-wrap">
              {([
                ['all', 'All'],
                ['members', 'Nominators'],
                ['guests', 'Guests'],
                ['manual', 'Added'],
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
            <button type="button" onClick={selectAllContacts} className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-semibold text-indigo-700">
              Select all ({allContacts.length})
            </button>
            <button type="button" onClick={clearSelection} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600">
              Clear
            </button>
          </div>

          {/* Manual contacts list */}
          {manualContacts.length > 0 && (filter === 'all' || filter === 'manual') && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Your added contacts</div>
              <div className="flex flex-wrap gap-2">
                {manualContacts
                  .filter((c) => {
                    if (!search.trim()) return true;
                    const q = search.trim().toLowerCase();
                    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
                  })
                  .map((c) => (
                    <div
                      key={c.key}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        selected.has(c.key)
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-indigo-200 bg-white text-slate-700'
                      }`}
                    >
                      <button type="button" onClick={() => toggle(c.key)} className="inline-flex items-center gap-2">
                        <i className="bi bi-person-plus-fill"></i>
                        <span>{c.name}</span>
                        <span className="font-mono opacity-80">{c.phone}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteManual(c.key)}
                        className={`ml-1 ${selected.has(c.key) ? 'text-white/80 hover:text-white' : 'text-rose-500 hover:text-rose-700'}`}
                        title="Remove contact"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-slate-400">Loading nominations...</p>}

          {!loading && submissions.length === 0 && manualContacts.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No nominations yet. Add contacts above, or share the nomination QR.
            </div>
          )}

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
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
                if (filter === 'manual') return false;
                if (!search.trim()) return true;
                const q = search.trim().toLowerCase();
                return c.name.toLowerCase().includes(q) || c.phone.includes(q);
              });

              if (filter === 'manual') return null;

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
                    </button>
                    <i className={`bi bi-chevron-${open ? 'up' : 'down'} text-slate-400 mt-2`}></i>
                  </div>

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

        {/* SMS composer */}
        <div className="p-5 sm:p-6 bg-slate-50/60 space-y-4 sticky top-0 self-start">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Send multiple SMS</h5>
            <p className="text-sm text-slate-600 mt-1">
              Select many people (or add contacts), then send one message to all of them. Use <code className="text-xs bg-white px-1 rounded border">{'{{name}}'}</code> for first name.
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
            <span>{message.length} chars · ~{Math.max(1, Math.ceil(message.length / 160))} segment(s) each</span>
            <span className="font-semibold text-indigo-600">{selectedRecipients.length} recipient(s)</span>
          </div>

          {selectedRecipients.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 max-h-40 overflow-y-auto space-y-1">
              {selectedRecipients.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 truncate">
                    {c.name} <span className="font-normal text-slate-400">({c.label})</span>
                  </span>
                  <button type="button" onClick={() => toggle(c.key)} className="text-rose-500 hover:text-rose-700 shrink-0" title="Remove from selection">
                    <i className="bi bi-x"></i>
                  </button>
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
            <i className="bi bi-send-fill mr-2"></i>
            {sending
              ? `Sending to ${selectedRecipients.length}...`
              : `Send SMS to ${selectedRecipients.length || 0} people`}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={selectAllContacts} className="btn-secondary text-xs py-2">
              Select everyone
            </button>
            <button type="button" onClick={clearSelection} className="btn-secondary text-xs py-2">
              Clear selection
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h6 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SMS delivery status</h6>
              <button type="button" onClick={() => loadOutbox(true)} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                Refresh delivery
              </button>
            </div>
            {outbox.length === 0 && (
              <p className="text-xs text-slate-400">No SMS sent yet.</p>
            )}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {outbox.map((row) => (
                <div key={row.id} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-700">{row.recipient}</span>
                    <span className={`font-bold uppercase ${
                      row.status === 'delivered' ? 'text-emerald-600'
                        : row.status === 'failed' ? 'text-rose-600'
                          : row.status === 'submitted' || row.status === 'sent' ? 'text-amber-600'
                            : 'text-slate-500'
                    }`}>{row.status}</span>
                  </div>
                  <div className="text-slate-400 truncate mt-0.5">{row.body}</div>
                  {row.error_message && <div className="text-rose-500 mt-0.5">{row.error_message}</div>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Tip: keep messages short, avoid blasting the same number many times, and wait for <strong>delivered</strong> (not only submitted/sent).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
