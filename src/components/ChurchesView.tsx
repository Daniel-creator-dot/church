import React, { useState } from 'react';
import { Church, Role } from '../types';

interface ChurchesViewProps {
  activeRole: Role;
  churches: Church[];
  activeChurchId: string;
  onUpdateChurches: (newChurches: Church[]) => void;
  onSetActiveChurch: (id: string) => void;
}

export default function ChurchesView({
  activeRole,
  churches,
  activeChurchId,
  onUpdateChurches,
  onSetActiveChurch
}: ChurchesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [pastor, setPastor] = useState('');
  const [foundedDate, setFoundedDate] = useState('2026-01-01');
  const [membersCount, setMembersCount] = useState(100);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !pastor) return;

    if (editId) {
      const updated = churches.map(c => c.id === editId ? {
        ...c,
        name,
        location,
        pastor,
        foundedDate,
        membersCount: Number(membersCount),
        email,
        phone
      } : c);
      onUpdateChurches(updated);
    } else {
      const newId = `C-${Math.floor(100 + Math.random() * 900)}`;
      const newChurch: Church = {
        id: newId,
        name,
        location,
        pastor,
        foundedDate,
        membersCount: Number(membersCount),
        email,
        phone
      };
      onUpdateChurches([...churches, newChurch]);
    }

    resetForm();
  };

  const handleEdit = (c: Church) => {
    setEditId(c.id);
    setName(c.name);
    setLocation(c.location);
    setPastor(c.pastor);
    setFoundedDate(c.foundedDate);
    setMembersCount(c.membersCount);
    setEmail(c.email);
    setPhone(c.phone);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (id === activeChurchId) {
      alert("Cannot delete the active church branch. Please switch to another active branch first.");
      return;
    }
    if (confirm("Are you sure you want to remove this church branch? This will delete all branch configurations.")) {
      onUpdateChurches(churches.filter(c => c.id !== id));
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setPastor('');
    setFoundedDate('2026-01-01');
    setMembersCount(100);
    setEmail('');
    setPhone('');
    setEditId(null);
    setShowForm(false);
  };

  const isSuperAdmin = activeRole === 'Super Admin';

  return (
    <div className="space-y-6 animate-fade-in" id="churches-view">
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <i className="bi bi-building text-amber-500 text-lg"></i> Multi-Church Directory & Branches
          </h2>
          <p className="text-xs text-slate-500">
            Switch perspective branches or manage all regional congregations and active campuses.
          </p>
        </div>
        {isSuperAdmin && !showForm && (
          <button 
            id="btn-add-church"
            onClick={() => setShowForm(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <i className="bi bi-plus-lg"></i> Add Campus Branch
          </button>
        )}
      </div>

      {/* Campus Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {editId ? 'Modify Campus Configuration' : 'Register New Campus Campus'}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Campus/Church Name *</label>
              <input 
                id="church-name-input"
                type="text" required
                className="input-elegant"
                placeholder="e.g. Bethel Baptist Church Grace Cathedral"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Location / City *</label>
              <input 
                id="church-location-input"
                type="text" required
                className="input-elegant"
                placeholder="e.g. London, UK"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Presiding Pastor *</label>
              <input 
                id="church-pastor-input"
                type="text" required
                className="input-elegant"
                placeholder="e.g. Pastor Sarah Jenkins"
                value={pastor}
                onChange={(e) => setPastor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Branch Email Address</label>
              <input 
                id="church-email-input"
                type="email"
                className="input-elegant"
                placeholder="e.g. branch@morningchurch.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Contact Phone Line</label>
              <input 
                id="church-phone-input"
                type="text"
                className="input-elegant"
                placeholder="e.g. +44 20 7946 0192"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Initial Congregation Size</label>
              <input 
                id="church-members-input"
                type="number"
                className="input-elegant"
                value={membersCount}
                onChange={(e) => setMembersCount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Date Planted/Established</label>
              <input 
                id="church-date-input"
                type="date"
                className="input-elegant"
                value={foundedDate}
                onChange={(e) => setFoundedDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button 
                id="btn-cancel-church"
                type="button" 
                onClick={resetForm} 
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button 
                id="btn-save-church"
                type="submit" 
                className="btn-primary text-xs"
              >
                Save Branch Information
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Churches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {churches.map(c => {
          const isActive = c.id === activeChurchId;
          return (
            <div 
              key={c.id} 
              className={`bg-white border transition-all flex flex-col justify-between rounded-2xl card-hover ${
                isActive 
                  ? 'border-2 border-amber-500 shadow-lg ring-1 ring-amber-500/20' 
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Header status */}
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 border border-slate-200 rounded-lg">
                    ID: {c.id}
                  </span>
                  {isActive ? (
                    <span className="badge-amber flex items-center gap-1">
                      <i className="bi bi-check-circle-fill text-[11px]"></i> ACTIVE CAMPUS
                    </span>
                  ) : (
                    <button
                      id={`btn-select-church-${c.id}`}
                      onClick={() => {
                        onSetActiveChurch(c.id);
                        alert(`Switched active worship portal perspective to: ${c.name}`);
                      }}
                      className="text-[10px] font-bold text-amber-500 hover:underline"
                    >
                      Set Active
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight leading-snug">
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <i className="bi bi-geo-alt text-slate-400 shrink-0"></i>
                    <span>{c.location}</span>
                  </div>
                </div>

                {/* Campus Specs */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1 font-medium"><i className="bi bi-person text-slate-400"></i> Presiding Pastor:</span>
                    <span className="font-bold text-slate-800">{c.pastor}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1 font-medium"><i className="bi bi-people text-slate-400"></i> Congregation:</span>
                    <span className="font-mono font-bold text-slate-800">{c.membersCount} members</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500 flex items-center gap-1 font-medium"><i className="bi bi-calendar3 text-slate-400"></i> Planted Date:</span>
                    <span className="font-semibold text-slate-800">{c.foundedDate}</span>
                  </div>
                </div>

                {/* Contacts Block */}
                <div className="space-y-1.5 pt-3 border-t border-dashed border-slate-200 text-[11px] text-slate-500">
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-envelope text-slate-400 shrink-0"></i>
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-telephone text-slate-400 shrink-0"></i>
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              {isSuperAdmin && (
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end gap-3 rounded-b-2xl">
                  <button
                    id={`btn-edit-church-${c.id}`}
                    onClick={() => handleEdit(c)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <i className="bi bi-pencil-square"></i> Modify
                  </button>
                  <button
                    id={`btn-delete-church-${c.id}`}
                    onClick={() => handleDelete(c.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <i className="bi bi-trash"></i> Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
