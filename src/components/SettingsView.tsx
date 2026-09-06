import React, { useEffect, useState } from 'react';
import { Role } from '../types';
import { messagingApi } from '../api';

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

type SmsConfigState = {
  provider: string;
  smsEnabled: boolean;
  intekConfigured: boolean;
  ready: boolean;
  sender: string | null;
  message: string;
  balanceUnits?: number | null;
  hasIntekApiKey?: boolean;
  intekApiKeyMasked?: string;
  intekSender?: string;
  intekApiUrl?: string;
  triggers?: string[];
};

export default function SettingsView({
  activeRole,
  currencyCode,
  currencySymbol,
  onSetCurrency,
  formatCurrency,
  onNavigate,
}: SettingsViewProps) {
  const canManageSms = ['Super Admin', 'Admin', 'Pastor', 'Church Administrator'].includes(activeRole);

  const [smsConfig, setSmsConfig] = useState<SmsConfigState | null>(null);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [provider, setProvider] = useState('intek');
  const [intekApiKey, setIntekApiKey] = useState('');
  const [intekSender, setIntekSender] = useState('mychurch');
  const [intekApiUrl, setIntekApiUrl] = useState('https://www.inteksms.top/api/v1');
  const [testPhone, setTestPhone] = useState('');
  const [savingSms, setSavingSms] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const loadSms = async () => {
    try {
      const cfg = await messagingApi.getConfig();
      setSmsConfig(cfg);
      setSmsEnabled(cfg.smsEnabled !== false);
      setProvider(cfg.provider || 'intek');
      setIntekSender(cfg.intekSender || cfg.sender || 'mychurch');
      setIntekApiUrl(cfg.intekApiUrl || 'https://www.inteksms.top/api/v1');
      setIntekApiKey('');
    } catch (e) {
      setSmsError(e instanceof Error ? e.message : 'Failed to load SMS settings');
    }
  };

  useEffect(() => {
    if (canManageSms) loadSms();
  }, [canManageSms]);

  const handleSaveSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSms(true);
    setSmsError(null);
    setSmsStatus(null);
    try {
      const payload: Parameters<typeof messagingApi.updateConfig>[0] = {
        provider,
        smsEnabled,
        intekSender,
        intekApiUrl,
      };
      if (intekApiKey.trim()) payload.intekApiKey = intekApiKey.trim();
      const cfg = await messagingApi.updateConfig(payload);
      setSmsConfig(cfg);
      setIntekApiKey('');
      setSmsStatus('SMS settings saved.');
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'Failed to save SMS settings');
    } finally {
      setSavingSms(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      setSmsError('Enter a phone number to send a test SMS.');
      return;
    }
    setTestingSms(true);
    setSmsError(null);
    setSmsStatus(null);
    try {
      const result = await messagingApi.testSms({ phone: testPhone.trim() });
      setSmsStatus(result.message || `Test SMS status: ${result.status}`);
      await loadSms();
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'Test SMS failed');
    } finally {
      setTestingSms(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
          <i className="bi bi-sliders"></i> System Settings
        </div>
        <h2 className="text-xl font-bold text-slate-900">Church administration controls</h2>
        <p className="text-sm text-slate-500">
          Manage currency, SMS messaging, and review what each role can see in the portal.
        </p>
      </div>

      {canManageSms && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <i className="bi bi-chat-dots-fill text-amber-500"></i> SMS messaging
              </h3>
              <p className="text-sm text-slate-500 max-w-2xl">
                Add your Intek SMS API key here so the church can send VIP thank-you messages,
                check-in confirmations, volunteer reminders, and bulk SMS.
              </p>
            </div>
            {smsConfig && (
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                smsConfig.intekConfigured && smsConfig.smsEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {smsConfig.message}
                {smsConfig.balanceUnits != null && (
                  <span className="ml-1">· {smsConfig.balanceUnits} units</span>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSms} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="h-4 w-4 accent-amber-600"
              />
              <span className="text-sm font-semibold text-slate-800">Enable SMS sending</span>
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provider</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="input-elegant cursor-pointer"
              >
                <option value="intek">Intek SMS</option>
                <option value="twilio">Twilio</option>
                <option value="stub">Stub (log only)</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sender ID</span>
              <input
                value={intekSender}
                onChange={(e) => setIntekSender(e.target.value)}
                placeholder="mychurch"
                className="input-elegant"
                maxLength={11}
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Intek API key
                {smsConfig?.hasIntekApiKey && (
                  <span className="ml-2 normal-case font-medium text-emerald-600">
                    saved ({smsConfig.intekApiKeyMasked})
                  </span>
                )}
              </span>
              <input
                type="password"
                value={intekApiKey}
                onChange={(e) => setIntekApiKey(e.target.value)}
                placeholder={smsConfig?.hasIntekApiKey ? 'Leave blank to keep current key' : 'Paste your Intek API key'}
                className="input-elegant font-mono text-sm"
                autoComplete="off"
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API URL</span>
              <input
                value={intekApiUrl}
                onChange={(e) => setIntekApiUrl(e.target.value)}
                className="input-elegant font-mono text-sm"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button type="submit" disabled={savingSms} className="btn-primary">
                <i className="bi bi-save mr-2"></i>
                {savingSms ? 'Saving...' : 'Save SMS settings'}
              </button>
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Send a test SMS</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 024XXXXXXX"
                className="input-elegant flex-1"
              />
              <button
                type="button"
                onClick={handleTestSms}
                disabled={testingSms}
                className="btn-secondary whitespace-nowrap"
              >
                <i className="bi bi-send mr-2"></i>
                {testingSms ? 'Sending...' : 'Send test'}
              </button>
            </div>
          </div>

          {(smsStatus || smsError) && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              smsError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {smsError || smsStatus}
            </div>
          )}

          {smsConfig?.triggers && smsConfig.triggers.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Automatic SMS triggers
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                {smsConfig.triggers.map((t) => (
                  <li key={t} className="flex gap-2">
                    <i className="bi bi-check2 text-amber-500 shrink-0"></i>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
