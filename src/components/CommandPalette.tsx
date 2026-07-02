import React, { useState, useEffect, useMemo } from 'react';

interface NavItem {
  name: string;
  icon: string;
  group: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  onNavigate: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

const QUICK_ACTIONS = [
  { id: 'add-member', label: 'Add New Member', icon: 'bi-person-plus', group: 'Actions' },
  { id: 'record-giving', label: 'Record Tithe / Offering', icon: 'bi-coin', group: 'Actions' },
  { id: 'submit-prayer', label: 'Submit Prayer Request', icon: 'bi-heart', group: 'Actions' },
  { id: 'checkin', label: 'Open Check-In Kiosk', icon: 'bi-qr-code', group: 'Actions' },
];

export default function CommandPalette({ isOpen, onClose, navItems, onNavigate, onQuickAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    const pages = navItems.map(n => ({ id: `nav-${n.name}`, label: n.name, icon: n.icon, group: n.group, type: 'nav' as const }));
    const actions = QUICK_ACTIONS.map(a => ({ ...a, type: 'action' as const }));
    const all = [...actions, ...pages];
    if (!q) return all;
    return all.filter(i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q));
  }, [query, navItems]);

  if (!isOpen) return null;

  const handleSelect = (item: typeof items[0]) => {
    if (item.type === 'action') onQuickAction(item.id);
    else onNavigate(item.label);
    onClose();
  };

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const g = item.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <i className="bi bi-search text-slate-400"></i>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages and actions..."
            className="flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">{group}</p>
              {(groupItems as typeof items).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-amber-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center">
                    <i className={`bi ${item.icon} text-slate-600 group-hover:text-amber-700`}></i>
                  </div>
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  <i className="bi bi-arrow-return-left ml-auto text-xs text-slate-300 opacity-0 group-hover:opacity-100"></i>
                </button>
              ))}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No results for "{query}"</p>
          )}
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex gap-4">
          <span><kbd className="font-mono bg-white px-1 rounded border">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-white px-1 rounded border">↵</kbd> select</span>
          <span><kbd className="font-mono bg-white px-1 rounded border">Ctrl K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
