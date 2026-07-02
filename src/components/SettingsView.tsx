import React from 'react';
import { Role } from '../types';

interface SettingsViewProps {
  activeRole: Role;
  currencyCode: string;
  currencySymbol: string;
  onSetCurrency: (currencyCode: string) => void;
  formatCurrency: (amount: number) => string;
  onNavigate: (tab: string) => void;
}

const currencyOptions = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'GHS', label: 'Ghana Cedi', symbol: 'GH₵' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
];

const roleAccessMap: Record<Role, string[]> = {
  'Super Admin': [
    'Dashboard', 'Churches', 'Members', 'Visitors', 'Attendance', 'Departments', 'Follow Up',
    'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements',
    'Devotional', 'Bookstore', 'Media', 'Reports', 'Settings'
  ],
  Pastor: [
    'Dashboard', 'Members', 'Visitors', 'Attendance', 'Departments', 'Follow Up',
    'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements',
    'Devotional', 'Bookstore', 'Media', 'Reports', 'Settings'
  ],
  'Church Administrator': [
    'Dashboard', 'Members', 'Visitors', 'Attendance', 'Departments', 'Follow Up',
    'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements',
    'Devotional', 'Bookstore', 'Media', 'Reports', 'Settings'
  ],
  Admin: [
    'Dashboard', 'Members', 'Visitors', 'Attendance', 'Departments', 'Follow Up',
    'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements',
    'Devotional', 'Bookstore', 'Media', 'Reports', 'Settings'
  ],
  Media: [
    'Dashboard', 'Media', 'Sermons', 'Events', 'Announcements', 'Devotional'
  ],
  'Finance Officer': [
    'Dashboard', 'Giving', 'Bookstore', 'Reports', 'Announcements', 'Settings'
  ],
  'Department Leader': [
    'Dashboard', 'Attendance', 'Departments', 'Follow Up', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Media'
  ],
  Member: [
    'Dashboard', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Media'
  ],
};

export default function SettingsView({
  activeRole,
  currencyCode,
  currencySymbol,
  onSetCurrency,
  formatCurrency,
  onNavigate,
}: SettingsViewProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
          <i className="bi bi-sliders"></i> System Settings
        </div>
        <h2 className="text-xl font-bold text-slate-900">Church administration controls</h2>
        <p className="text-sm text-slate-500">
          Manage the system currency and review what each role can see in the sidebar and access from the portal.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">System currency</h3>
            <p className="text-sm text-slate-500">
              Church administrators can set the primary currency used for giving, bookstore sales, and financial reports.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary currency</span>
            <select
              value={currencyCode}
              onChange={(e) => onSetCurrency(e.target.value)}
              className="input-elegant cursor-pointer"
            >
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label} ({option.code})
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <i className="bi bi-wallet2"></i> Preview
            </div>
            <div className="text-lg font-black">{formatCurrency(1250)}</div>
            <p className="text-xs text-amber-700">
              The selected currency will be used across finance summaries, receipts, and bookstore pricing.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-slate-600">
            <div className="font-semibold text-slate-800">Current role</div>
            <div className="mt-1 text-amber-500 font-semibold">{activeRole}</div>
            <p className="mt-2 text-xs text-slate-500">
              {activeRole === 'Church Administrator'
                ? 'You can manage this setting and view the full administration workspace.'
                : 'This view is available to church administrators and leadership roles.'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Role access matrix</h3>
            <p className="text-sm text-slate-500">
              Every role sees a tailored sidebar and feature set based on ministry responsibilities.
            </p>
          </div>

          {activeRole === 'Church Administrator' && (
            <div className="space-y-3">
              {(Object.entries(roleAccessMap) as [Role, string[]][]).map(([role, tabs]) => (
              <div key={role} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{role}</div>
                    <div className="text-[11px] text-slate-500">Visible sidebar tabs</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl ${role === activeRole ? 'badge-amber' : 'badge-slate'}`}>
                    {tabs.length} items
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => onNavigate(tab)}
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-amber-500 hover:text-amber-500 transition-colors"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              ))}
            </div>
          )}

          {activeRole !== 'Church Administrator' && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-500">
              Role access details are shown only to Church Administrators for governance visibility.
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Sidebar access notes</div>
            <p>• Super Admin and Pastors can access the full administration workspace.</p>
            <p>• Church Administrators can manage settings, ministry operations, and reporting views.</p>
            <p>• Department Leaders and Members have a narrower, role-specific experience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
