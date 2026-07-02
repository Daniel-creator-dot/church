import React, { useState, useMemo } from 'react';
import { Member, Role } from '../types';
import { downloadCsv } from '../utils/export';

interface MemberDirectoryViewProps {
  activeRole: Role;
  members: Member[];
}

export default function MemberDirectoryView({ activeRole, members }: MemberDirectoryViewProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isLeader = ['Super Admin', 'Pastor', 'Church Administrator', 'Department Leader'].includes(activeRole);
  const activeMembers = members.filter(m => m.membershipStatus === 'Active');

  const departments = useMemo(() => {
    const depts = new Set(activeMembers.map(m => m.department).filter(d => d && d !== 'None'));
    return ['All', ...Array.from(depts).sort()];
  }, [activeMembers]);

  const filtered = activeMembers.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.familyGroup.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'All' || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;
    const rows = filtered.map(m => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${m.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${m.phone}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${isLeader ? m.email : '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${m.department}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${m.familyGroup}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Member Directory</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;padding:8px;border-bottom:2px solid #333;font-size:10px;text-transform:uppercase;color:#666}</style>
      </head><body>
      <h1>Bethel Baptist Church — Member Directory</h1>
      <p style="color:#666;font-size:12px">${filtered.length} active members · Printed ${new Date().toLocaleDateString()}</p>
      <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Department</th><th>Family</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = () => {
    downloadCsv(
      `member-directory-${new Date().toISOString().split('T')[0]}.csv`,
      ['Name', 'Phone', 'Email', 'Department', 'Family Group', 'Join Date'],
      filtered.map(m => [m.name, m.phone, isLeader ? m.email : '', m.department, m.familyGroup, m.joinDate])
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-slate-100 to-white p-6 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">
          <i className="bi bi-journal-bookmark text-amber-500 mr-2"></i>Member Directory
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Searchable congregation directory — {activeMembers.length} active members
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, family..."
            className="input-elegant flex-1 min-w-[200px]"
          />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-elegant">
            {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
            <i className={`bi bi-${viewMode === 'grid' ? 'list' : 'grid'}`}></i>
          </button>
          {isLeader && (
            <>
              <button type="button" onClick={handleExport} className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                <i className="bi bi-download mr-1"></i>CSV
              </button>
              <button type="button" onClick={handlePrint} className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                <i className="bi bi-printer mr-1"></i>Print
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 truncate">{m.name}</div>
                  <div className="text-xs text-amber-600 font-medium">{m.department !== 'None' ? m.department : 'General'}</div>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                {m.phone && <div><i className="bi bi-telephone mr-2 text-slate-400"></i>{m.phone}</div>}
                {(isLeader || activeRole === 'Member') && m.email && (
                  <div className="truncate"><i className="bi bi-envelope mr-2 text-slate-400"></i>{m.email}</div>
                )}
                {m.familyGroup !== 'Default' && (
                  <div><i className="bi bi-people mr-2 text-slate-400"></i>{m.familyGroup}</div>
                )}
                {m.birthday && isLeader && (
                  <div><i className="bi bi-cake2 mr-2 text-slate-400"></i>{m.birthday}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-slate-400 uppercase bg-slate-50">
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                {isLeader && <th className="p-4">Email</th>}
                <th className="p-4">Department</th>
                <th className="p-4">Family</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium">{m.name}</td>
                  <td className="p-4 text-slate-500">{m.phone}</td>
                  {isLeader && <td className="p-4 text-slate-500">{m.email}</td>}
                  <td className="p-4"><span className="badge-amber text-[10px]">{m.department}</span></td>
                  <td className="p-4 text-slate-500">{m.familyGroup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <i className="bi bi-search text-3xl mb-3 block"></i>
          No members match your search.
        </div>
      )}
    </div>
  );
}
