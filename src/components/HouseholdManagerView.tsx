import React, { useState, useEffect, useCallback } from 'react';
import { Household, MemberOption } from '../types';
import { householdsApi } from '../api';
import { dbHouseholdToFrontend } from '../chMeetingsMapper';

interface HouseholdMember {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

interface HouseholdManagerViewProps {
  households: Household[];
  onUpdateHouseholds: (h: Household[]) => void;
  memberOptions: MemberOption[];
  isAdmin: boolean;
}

function hhDbId(id: string) {
  return parseInt(id.replace('HH-', ''), 10);
}

function printFamilyCard(household: Household) {
  const win = window.open('', '_blank', 'width=420,height=560');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Family Check-In Card — ${household.name}</title>
    <style>
      body { font-family: Georgia, serif; margin: 0; padding: 32px; text-align: center; color: #0f172a; }
      .card { border: 3px solid #f59e0b; border-radius: 16px; padding: 32px 24px; max-width: 340px; margin: 0 auto; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      .church { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #64748b; margin-bottom: 24px; }
      .code { font-size: 36px; font-weight: bold; letter-spacing: 0.12em; color: #b45309; font-family: monospace; margin: 16px 0; }
      .hint { font-size: 12px; color: #475569; line-height: 1.5; }
      .phone { margin-top: 16px; font-size: 13px; color: #334155; }
    </style></head><body>
    <div class="card">
      <div class="church">Bethel Baptist Church</div>
      <h1>${household.name}</h1>
      <p class="hint">Scan the Sunday QR and enter this family code to check in:</p>
      <div class="code">${household.familyCode || '—'}</div>
      ${household.contactPhone ? `<p class="phone">Or use phone: ${household.contactPhone}</p>` : ''}
      <p class="hint">Keep this card — staff can reprint from Households anytime.</p>
    </div>
    <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

export default function HouseholdManagerView({ households, onUpdateHouseholds, memberOptions, isAdmin }: HouseholdManagerViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [unassigned, setUnassigned] = useState<HouseholdMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [message, setMessage] = useState('');

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPrimaryId, setNewPrimaryId] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [editPhone, setEditPhone] = useState('');

  const selected = households.find(h => h.id === selectedId) || null;

  const refreshHouseholds = useCallback(async () => {
    const data = await householdsApi.getAll();
    onUpdateHouseholds(data.map(dbHouseholdToFrontend));
    return data.map(dbHouseholdToFrontend);
  }, [onUpdateHouseholds]);

  const loadUnassigned = useCallback(async () => {
    try {
      const data = await householdsApi.getUnassignedMembers();
      setUnassigned(data);
    } catch {
      setUnassigned([]);
    }
  }, []);

  const loadMembers = useCallback(async (householdId: string) => {
    setLoadingMembers(true);
    try {
      const data = await householdsApi.getMembers(hhDbId(householdId));
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMembers(selectedId);
      loadUnassigned();
      const h = households.find(x => x.id === selectedId);
      setEditPhone(h?.contactPhone || '');
    }
  }, [selectedId, households, loadMembers, loadUnassigned]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const saved = await householdsApi.create({
        name: newName.trim(),
        address: newAddress.trim() || undefined,
        contact_phone: newPhone.trim() || undefined,
        primary_member_id: newPrimaryId ? parseInt(newPrimaryId, 10) : undefined,
      });
      await refreshHouseholds();
      const created = dbHouseholdToFrontend(saved);
      setSelectedId(created.id);
      setNewName('');
      setNewPhone('');
      setNewPrimaryId('');
      setNewAddress('');
      setMessage('Household created with a unique family code.');
      await loadUnassigned();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to create household');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    try {
      await householdsApi.update(hhDbId(selected.id), { contact_phone: editPhone.trim() || null });
      await refreshHouseholds();
      setMessage('Contact phone updated.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selected || !addMemberId) return;
    setSaving(true);
    setMessage('');
    try {
      await householdsApi.addMember(hhDbId(selected.id), parseInt(addMemberId, 10));
      await loadMembers(selected.id);
      await refreshHouseholds();
      await loadUnassigned();
      setAddMemberId('');
      setMessage('Member added to household.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    try {
      await householdsApi.removeMember(hhDbId(selected.id), memberId);
      await loadMembers(selected.id);
      await refreshHouseholds();
      await loadUnassigned();
      setMessage('Member removed from household.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!selected || !confirm('Generate a new family code? The old code will stop working.')) return;
    setSaving(true);
    setMessage('');
    try {
      await householdsApi.regenerateCode(hhDbId(selected.id));
      await refreshHouseholds();
      setMessage('New family code generated.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to regenerate code');
    } finally {
      setSaving(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setMessage('Family code copied.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-100">
        <h3 className="text-lg font-bold text-slate-800">
          <i className="bi bi-house-heart text-orange-500 mr-2"></i>
          Household Registry
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Register families here for one-tap Sunday check-in. Each household gets a unique family code and optional contact phone.
          Unregistered members still check in via phone with surname confirmation.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List + create */}
        <div className="space-y-4">
          {isAdmin && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-700">New Household</h4>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Family name (e.g. Nkansah Family)" className="input-elegant w-full" />
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Check-in phone (optional)" className="input-elegant w-full" />
              <select value={newPrimaryId} onChange={e => setNewPrimaryId(e.target.value)} className="input-elegant w-full">
                <option value="">Primary member (optional)</option>
                {memberOptions.map(m => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </select>
              <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Address (optional)" className="input-elegant w-full" />
              <button type="button" onClick={handleCreate} disabled={saving || !newName.trim()} className="btn-primary w-full">
                Create &amp; Get Family Code
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-600">
              {households.length} Household{households.length !== 1 ? 's' : ''}
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
              {households.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedId(h.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-orange-50/50 transition-colors ${selectedId === h.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                >
                  <div className="font-semibold text-slate-800">{h.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {h.memberCount} member{h.memberCount !== 1 ? 's' : ''}
                    {h.familyCode && <span className="ml-2 font-mono text-orange-600">{h.familyCode}</span>}
                  </div>
                </button>
              ))}
              {!households.length && (
                <p className="p-6 text-sm text-slate-400 text-center">No households yet. Create one to get started.</p>
              )}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">{selected.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{selected.memberCount} members · {selected.primaryMemberName || 'No primary set'}</p>
                  </div>
                  {selected.familyCode && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Family Code</p>
                      <p className="text-2xl font-mono font-bold text-orange-600 tracking-wider">{selected.familyCode}</p>
                      <div className="flex gap-2 mt-2 justify-end">
                        <button type="button" onClick={() => copyCode(selected.familyCode!)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <i className="bi bi-clipboard mr-1"></i> Copy
                        </button>
                        <button type="button" onClick={() => printFamilyCard(selected)} className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600">
                          <i className="bi bi-printer mr-1"></i> Print Card
                        </button>
                        {isAdmin && (
                          <button type="button" onClick={handleRegenerateCode} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">
                            New Code
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="p-6 border-b border-slate-100 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Check-in phone</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Family phone for QR lookup" className="input-elegant w-full mt-1" />
                  </div>
                  <button type="button" onClick={handleSaveContact} disabled={saving} className="btn-primary px-6">Save Phone</button>
                </div>
              )}

              <div className="p-6">
                <h5 className="font-bold text-sm text-slate-700 mb-3">Household Members</h5>
                {loadingMembers ? (
                  <p className="text-sm text-slate-400">Loading...</p>
                ) : (
                  <div className="space-y-2 mb-6">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <div className="font-semibold text-slate-800">{m.first_name} {m.last_name}</div>
                          <div className="text-xs text-slate-500">{m.phone || m.email || '—'}</div>
                        </div>
                        {isAdmin && (
                          <button type="button" onClick={() => handleRemoveMember(m.id)} disabled={saving} className="text-xs text-rose-600 hover:text-rose-700 px-2 py-1">
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {!members.length && <p className="text-sm text-slate-400">No members linked yet.</p>}
                  </div>
                )}

                {isAdmin && (
                  <div className="flex flex-wrap gap-2 items-end pt-4 border-t border-slate-100">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Add member</label>
                      <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)} className="input-elegant w-full mt-1">
                        <option value="">Select unassigned member...</option>
                        {unassigned.map(m => (
                          <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={handleAddMember} disabled={saving || !addMemberId} className="btn-primary px-6">Add</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <i className="bi bi-house text-4xl mb-3 block opacity-40"></i>
              Select a household to manage members, family code, and check-in phone.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
