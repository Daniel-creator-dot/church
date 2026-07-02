import React, { useState, useEffect } from 'react';
import {
  Role, Member, ChurchEvent, Household, Fund, PledgeCampaign, Pledge,
  VolunteerRole, VolunteerAssignment, Song, WorshipPlan, WorshipPlanItem, Communication,
  CustomForm, CheckInRecord, FinanceTransaction, MemberOption, Announcement, Devotional
} from '../types';
import {
  fundsApi, pledgesApi, volunteersApi, worshipApi,
  communicationsApi, formsApi, financeApi, checkinApi
} from '../api';
import {
  dbFundToFrontend, dbCampaignToFrontend, dbPledgeToFrontend,
  dbVolunteerRoleToFrontend, dbVolunteerAssignmentToFrontend, dbSongToFrontend,
  dbWorshipPlanToFrontend, dbCommunicationToFrontend, dbFormToFrontend,
  dbCheckInToFrontend, dbFinanceToFrontend, getCalendarDays, getEventsForDate,
  dbWorshipPlanItemToFrontend, frontendWorshipItemToDb
} from '../chMeetingsMapper';
import { getTodayString } from '../utils/date';
import { printSundayBulletin } from '../utils/bulletin';
import HouseholdManagerView from './HouseholdManagerView';

type ChMeetingsSubView =
  | 'Calendar' | 'Volunteers' | 'Worship Planning' | 'Pledges & Funds'
  | 'Communications' | 'Check-In' | 'Households' | 'Forms' | 'Accounting';

interface ChMeetingsViewsProps {
  activeSubView: ChMeetingsSubView;
  activeRole: Role;
  userEmail: string;
  members: Member[];
  events: ChurchEvent[];
  memberOptions: MemberOption[];
  households: Household[];
  onUpdateHouseholds: (h: Household[]) => void;
  funds: Fund[];
  onUpdateFunds: (f: Fund[]) => void;
  campaigns: PledgeCampaign[];
  onUpdateCampaigns: (c: PledgeCampaign[]) => void;
  pledges: Pledge[];
  onUpdatePledges: (p: Pledge[]) => void;
  volunteerRoles: VolunteerRole[];
  onUpdateVolunteerRoles: (r: VolunteerRole[]) => void;
  volunteerAssignments: VolunteerAssignment[];
  onUpdateVolunteerAssignments: (a: VolunteerAssignment[]) => void;
  songs: Song[];
  onUpdateSongs: (s: Song[]) => void;
  worshipPlans: WorshipPlan[];
  onUpdateWorshipPlans: (p: WorshipPlan[]) => void;
  communications: Communication[];
  onUpdateCommunications: (c: Communication[]) => void;
  customForms: CustomForm[];
  onUpdateCustomForms: (f: CustomForm[]) => void;
  checkIns: CheckInRecord[];
  onUpdateCheckIns: (c: CheckInRecord[]) => void;
  transactions: FinanceTransaction[];
  onUpdateTransactions: (t: FinanceTransaction[]) => void;
  formatCurrency: (amount: number) => string;
  announcements?: Announcement[];
  devotionals?: Devotional[];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ChMeetingsViews(props: ChMeetingsViewsProps) {
  const { activeSubView, activeRole, userEmail, members, events, memberOptions, formatCurrency } = props;
  const isAdmin = ['Super Admin', 'Pastor', 'Church Administrator', 'Finance Officer'].includes(activeRole);
  const today = getTodayString();

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  // Volunteer form state
  const [volMemberId, setVolMemberId] = useState('');
  const [volRoleName, setVolRoleName] = useState('');
  const [volDate, setVolDate] = useState(today);
  const [volEventId, setVolEventId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  // Worship form state
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planDate, setPlanDate] = useState(today);
  const [selectedPlan, setSelectedPlan] = useState<WorshipPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [itemType, setItemType] = useState<WorshipPlanItem['itemType']>('song');
  const [itemTitle, setItemTitle] = useState('');
  const [itemSongId, setItemSongId] = useState('');
  const [itemDuration, setItemDuration] = useState(5);
  const [itemAssignedTo, setItemAssignedTo] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [reminderResult, setReminderResult] = useState<{ count: number; reminders: { memberName: string; email: string; mailto: string; assignmentDate: string; roleName: string }[] } | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);

  // Pledge form state
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState(10000);
  const [pledgeAmount, setPledgeAmount] = useState(100);
  const [pledgeCampaignId, setPledgeCampaignId] = useState('');
  const [fundName, setFundName] = useState('');
  const [fundGoal, setFundGoal] = useState(5000);

  // Communication form state
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgChannel, setMsgChannel] = useState<'email' | 'sms' | 'push'>('email');
  const [msgTarget, setMsgTarget] = useState('all');

  // Check-in state
  const [checkinEventId, setCheckinEventId] = useState('');
  const [checkinMemberId, setCheckinMemberId] = useState('');
  const [qrData, setQrData] = useState<{ qrDataUrl: string; checkInUrl: string; eventTitle: string; checkedInCount: number } | null>(null);
  const [sundayQr, setSundayQr] = useState<{ qrDataUrl: string; checkInUrl: string; eventTitle: string; checkedInCount: number; serviceDate: string } | null>(null);
  const [kioskMode, setKioskMode] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [sundayQrLoading, setSundayQrLoading] = useState(false);

  useEffect(() => {
    setSundayQrLoading(true);
    checkinApi.getSundayQr()
      .then(data => setSundayQr({
        qrDataUrl: data.qrDataUrl,
        checkInUrl: data.checkInUrl,
        eventTitle: data.eventTitle,
        checkedInCount: data.checkedInCount,
        serviceDate: data.serviceDate,
      }))
      .catch(() => setSundayQr(null))
      .finally(() => setSundayQrLoading(false));
  }, []);

  useEffect(() => {
    if (!checkinEventId) {
      setQrData(null);
      return;
    }
    const dbId = parseInt(checkinEventId.replace('E-', ''));
    setQrLoading(true);
    checkinApi.getQr(dbId)
      .then((data) => setQrData({
        qrDataUrl: data.qrDataUrl,
        checkInUrl: data.checkInUrl,
        eventTitle: data.eventTitle,
        checkedInCount: data.checkedInCount,
      }))
      .catch(() => setQrData(null))
      .finally(() => setQrLoading(false));
  }, [checkinEventId]);

  // Form builder state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Accounting state
  const [txnType, setTxnType] = useState<'Income' | 'Expense'>('Expense');
  const [txnCategory, setTxnCategory] = useState('');
  const [txnAmount, setTxnAmount] = useState(0);
  const [txnDesc, setTxnDesc] = useState('');

  const handleCreateVolunteerRole = async () => {
    if (!newRoleName) return;
    try {
      const saved = await volunteersApi.createRole({ name: newRoleName });
      props.onUpdateVolunteerRoles([dbVolunteerRoleToFrontend(saved), ...props.volunteerRoles]);
      setNewRoleName('');
    } catch (e) { console.error(e); }
  };

  const handleCreateAssignment = async () => {
    if (!volMemberId || !volRoleName) return;
    try {
      const saved = await volunteersApi.createAssignment({
        member_id: parseInt(volMemberId),
        role_name: volRoleName,
        assignment_date: volDate,
        event_id: volEventId ? parseInt(volEventId.replace('E-', '')) : null,
      });
      props.onUpdateVolunteerAssignments([dbVolunteerAssignmentToFrontend(saved), ...props.volunteerAssignments]);
    } catch (e) { console.error(e); }
  };

  const handleCreateSong = async () => {
    if (!songTitle) return;
    try {
      const saved = await worshipApi.createSong({ title: songTitle, artist: songArtist, song_key: songKey });
      props.onUpdateSongs([dbSongToFrontend(saved), ...props.songs]);
      setSongTitle(''); setSongArtist(''); setSongKey('');
    } catch (e) { console.error(e); }
  };

  const handleCreatePlan = async () => {
    if (!planTitle) return;
    try {
      const saved = await worshipApi.createPlan({ title: planTitle, service_date: planDate, service_type: 'Sunday Service' });
      const plan = dbWorshipPlanToFrontend(saved);
      props.onUpdateWorshipPlans([plan, ...props.worshipPlans]);
      setPlanTitle('');
      await loadPlan(plan.id);
    } catch (e) { console.error(e); }
  };

  const loadPlan = async (planId: string) => {
    const dbId = parseInt(planId.replace('WP-', ''));
    setPlanLoading(true);
    try {
      const data = await worshipApi.getPlan(dbId);
      setSelectedPlan(dbWorshipPlanToFrontend(data));
    } catch (e) { console.error(e); }
    finally { setPlanLoading(false); }
  };

  const handleAddPlanItem = async () => {
    if (!selectedPlan || !itemTitle) return;
    try {
      const planDbId = parseInt(selectedPlan.id.replace('WP-', ''));
      const saved = await worshipApi.addPlanItem(planDbId, frontendWorshipItemToDb({
        itemType, title: itemTitle, songId: itemSongId || undefined,
        durationMinutes: itemDuration, assignedTo: itemAssignedTo, notes: itemNotes,
      }));
      const newItem = dbWorshipPlanItemToFrontend(saved);
      setSelectedPlan({ ...selectedPlan, items: [...(selectedPlan.items || []), newItem] });
      setItemTitle(''); setItemSongId(''); setItemAssignedTo(''); setItemNotes('');
    } catch (e) { console.error(e); }
  };

  const handleDeletePlanItem = async (itemId: string) => {
    if (!selectedPlan) return;
    try {
      const planDbId = parseInt(selectedPlan.id.replace('WP-', ''));
      const itemDbId = parseInt(itemId.replace('WPI-', ''));
      await worshipApi.deletePlanItem(planDbId, itemDbId);
      setSelectedPlan({
        ...selectedPlan,
        items: (selectedPlan.items || []).filter(i => i.id !== itemId),
      });
    } catch (e) { console.error(e); }
  };

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!selectedPlan?.items) return;
    const items = [...selectedPlan.items].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = items.findIndex(i => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    const planDbId = parseInt(selectedPlan.id.replace('WP-', ''));
    const itemIds = items.map(i => parseInt(i.id!.replace('WPI-', '')));
    try {
      await worshipApi.reorderPlanItems(planDbId, itemIds);
      setSelectedPlan({ ...selectedPlan, items: items.map((it, i) => ({ ...it, sortOrder: i })) });
    } catch (e) { console.error(e); }
  };

  const handleSendVolunteerReminders = async () => {
    setReminderLoading(true);
    setReminderResult(null);
    try {
      const result = await volunteersApi.sendReminders({ days: 7, sent_by: userEmail });
      setReminderResult(result);
      const refreshed = await volunteersApi.getAssignments();
      props.onUpdateVolunteerAssignments(refreshed.map(dbVolunteerAssignmentToFrontend));
    } catch (e) { console.error(e); alert('Failed to send reminders'); }
    finally { setReminderLoading(false); }
  };

  const handleCreateFund = async () => {
    if (!fundName) return;
    try {
      const saved = await fundsApi.create({ name: fundName, goal_amount: fundGoal });
      props.onUpdateFunds([dbFundToFrontend(saved), ...props.funds]);
      setFundName('');
    } catch (e) { console.error(e); }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName) return;
    try {
      const saved = await pledgesApi.createCampaign({ name: campaignName, goal_amount: campaignGoal, start_date: today });
      props.onUpdateCampaigns([dbCampaignToFrontend(saved), ...props.campaigns]);
      setCampaignName('');
    } catch (e) { console.error(e); }
  };

  const handleCreatePledge = async () => {
    if (!pledgeCampaignId || pledgeAmount <= 0) return;
    try {
      const saved = await pledgesApi.create({
        campaign_id: parseInt(pledgeCampaignId.replace('PC-', '')),
        pledged_amount: pledgeAmount,
        pledgor_name: userEmail,
      });
      props.onUpdatePledges([dbPledgeToFrontend(saved), ...props.pledges]);
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async () => {
    if (!msgSubject || !msgBody) return;
    try {
      const saved = await communicationsApi.send({
        subject: msgSubject, body: msgBody, channel: msgChannel,
        target_group: msgTarget, sent_by: userEmail,
      });
      props.onUpdateCommunications([dbCommunicationToFrontend(saved), ...props.communications]);
      setMsgSubject(''); setMsgBody('');
    } catch (e) { console.error(e); }
  };

  const handleCheckOut = async (checkInId: string) => {
    try {
      const dbId = parseInt(checkInId.replace('CI-', ''));
      await checkinApi.checkOut(dbId);
      props.onUpdateCheckIns(props.checkIns.map(ci =>
        ci.id === checkInId ? { ...ci, checkoutTime: new Date().toISOString() } : ci
      ));
    } catch (e) { console.error(e); }
  };

  const copyCheckInLink = () => {
    if (qrData?.checkInUrl) {
      navigator.clipboard.writeText(qrData.checkInUrl);
      alert('Check-in link copied to clipboard!');
    }
  };

  const handleCheckIn = async () => {
    if (!checkinEventId || !checkinMemberId) return;
    try {
      const saved = await checkinApi.checkIn({
        event_id: parseInt(checkinEventId.replace('E-', '')),
        member_id: parseInt(checkinMemberId),
        checked_in_by: userEmail,
      });
      props.onUpdateCheckIns([dbCheckInToFrontend(saved), ...props.checkIns]);
    } catch (e) { console.error(e); }
  };

  const handleCreateForm = async () => {
    if (!formTitle) return;
    try {
      const saved = await formsApi.create({
        title: formTitle, description: formDesc,
        fields: [{ label: 'Full Name', type: 'text', required: true }, { label: 'Comments', type: 'textarea' }],
        is_public: true,
      });
      props.onUpdateCustomForms([dbFormToFrontend(saved), ...props.customForms]);
      setFormTitle(''); setFormDesc('');
    } catch (e) { console.error(e); }
  };

  const handleCreateTransaction = async () => {
    if (!txnCategory || txnAmount <= 0) return;
    try {
      const saved = await financeApi.create({
        transaction_date: today, type: txnType, category: txnCategory,
        amount: txnAmount, description: txnDesc, approved_by: activeRole,
      });
      props.onUpdateTransactions([dbFinanceToFrontend(saved), ...props.transactions]);
      setTxnCategory(''); setTxnAmount(0); setTxnDesc('');
    } catch (e) { console.error(e); }
  };

  // ---- CALENDAR ----
  if (activeSubView === 'Calendar') {
    const days = getCalendarDays(calYear, calMonth);
    const selectedEvents = getEventsForDate(events, selectedDate);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              <i className="bi bi-calendar3 text-amber-500 mr-2"></i>
              Church Calendar
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><i className="bi bi-chevron-left"></i></button>
              <span className="font-semibold text-sm min-w-[140px] text-center">{MONTHS[calMonth]} {calYear}</span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><i className="bi bi-chevron-right"></i></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const ds = day.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(events, ds);
              const isSelected = ds === selectedDate;
              const isToday = ds === today;
              return (
                <button key={ds} onClick={() => setSelectedDate(ds)}
                  className={`p-2 rounded-xl text-sm min-h-[60px] border transition-all ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-transparent hover:bg-slate-50'} ${isToday ? 'font-bold' : ''}`}>
                  <div className={isToday ? 'text-amber-600' : 'text-slate-700'}>{day.getDate()}</div>
                  {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto mt-1"></div>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">Events on {selectedDate}</h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No events scheduled for this date.</p>
          ) : selectedEvents.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600"><i className="bi bi-calendar-event"></i></div>
              <div>
                <div className="font-semibold text-sm">{ev.title}</div>
                <div className="text-xs text-slate-500">{ev.time} · {ev.location} · {ev.rsvps.length} RSVPs</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- VOLUNTEERS ----
  if (activeSubView === 'Volunteers') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-amber-50 to-white p-6 rounded-2xl border border-amber-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-people-fill text-amber-500 mr-2"></i>Volunteer Scheduling</h3>
              <p className="text-sm text-slate-500 mt-1">Schedule volunteers and send email reminders for upcoming assignments.</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleSendVolunteerReminders}
                disabled={reminderLoading}
                className="btn-primary text-xs flex items-center gap-2"
              >
                <i className="bi bi-envelope"></i>
                {reminderLoading ? 'Sending...' : 'Send 7-Day Reminders'}
              </button>
            )}
          </div>
        </div>
        {reminderResult && (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
            <div className="font-bold text-emerald-800">
              <i className="bi bi-check-circle mr-2"></i>
              {reminderResult.count} reminder{reminderResult.count !== 1 ? 's' : ''} logged
            </div>
            <p className="text-xs text-emerald-700">Reminders saved to Communications. Click a volunteer to open your email client:</p>
            <div className="flex flex-wrap gap-2">
              {reminderResult.reminders.map((r, i) => (
                <a key={i} href={r.mailto} className="text-xs font-bold px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100">
                  {r.memberName} · {r.assignmentDate}
                </a>
              ))}
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Add Volunteer Role</h4>
              <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Role name (e.g. Usher, Sound Tech)" className="input-elegant w-full" />
              <button onClick={handleCreateVolunteerRole} className="btn-primary w-full">Add Role</button>
              <div className="space-y-2">
                {props.volunteerRoles.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-slate-400">{r.ministryName || 'General'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Schedule Volunteer</h4>
              <select value={volMemberId} onChange={e => setVolMemberId(e.target.value)} className="input-elegant w-full">
                <option value="">Select member</option>
                {memberOptions.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
              <input value={volRoleName} onChange={e => setVolRoleName(e.target.value)} placeholder="Role" className="input-elegant w-full" />
              <input type="date" value={volDate} onChange={e => setVolDate(e.target.value)} className="input-elegant w-full" />
              <select value={volEventId} onChange={e => setVolEventId(e.target.value)} className="input-elegant w-full">
                <option value="">Link to event (optional)</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
              <button onClick={handleCreateAssignment} className="btn-primary w-full">Schedule Volunteer</button>
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">Volunteer Roster ({props.volunteerAssignments.length})</h4>
          {props.volunteerAssignments.length === 0 ? (
            <p className="text-sm text-slate-400">No volunteers scheduled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="pb-3">Date</th><th className="pb-3">Member</th><th className="pb-3">Role</th><th className="pb-3">Event</th><th className="pb-3">Status</th>
                </tr></thead>
                <tbody>
                  {props.volunteerAssignments.map(a => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="py-3">{a.assignmentDate}</td>
                      <td className="py-3 font-medium">{a.memberName}</td>
                      <td className="py-3">{a.roleName}</td>
                      <td className="py-3 text-slate-500">{a.eventTitle || '—'}</td>
                      <td className="py-3"><span className="badge-amber text-[10px]">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- WORSHIP PLANNING ----
  if (activeSubView === 'Worship Planning') {
    const sortedItems = [...(selectedPlan?.items || [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const totalDuration = sortedItems.reduce((sum, i) => sum + (i.durationMinutes || 0), 0);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-purple-50 to-white p-6 rounded-2xl border border-purple-100">
          <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-music-note-beamed text-purple-500 mr-2"></i>Worship Planning</h3>
          <p className="text-sm text-slate-500 mt-1">Song library and order-of-service editor — build your full worship flow.</p>
        </div>
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm uppercase text-slate-600">Song Library</h4>
              <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Song title" className="input-elegant w-full" />
              <input value={songArtist} onChange={e => setSongArtist(e.target.value)} placeholder="Artist" className="input-elegant w-full" />
              <input value={songKey} onChange={e => setSongKey(e.target.value)} placeholder="Key (e.g. G, D)" className="input-elegant w-full" />
              <button type="button" onClick={handleCreateSong} className="btn-primary w-full">Add to Library</button>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {props.songs.slice(0, 8).map(s => (
                  <div key={s.id} className="text-xs p-2 bg-slate-50 rounded-lg flex justify-between">
                    <span>{s.title}</span><span className="text-amber-600 font-mono">{s.key}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm uppercase text-slate-600">New Service Plan</h4>
              <input value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder="Service title" className="input-elegant w-full" />
              <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="input-elegant w-full" />
              <button type="button" onClick={handleCreatePlan} className="btn-primary w-full">Create Plan</button>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {props.worshipPlans.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadPlan(p.id)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${selectedPlan?.id === p.id ? 'bg-purple-100 border border-purple-300' : 'bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-slate-500">{p.serviceDate}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm uppercase text-slate-600">Add Service Item</h4>
              {!selectedPlan ? (
                <p className="text-sm text-slate-400">Select a plan to add items.</p>
              ) : (
                <>
                  <select value={itemType} onChange={e => setItemType(e.target.value as WorshipPlanItem['itemType'])} className="input-elegant w-full">
                    <option value="song">Song</option>
                    <option value="prayer">Prayer</option>
                    <option value="sermon">Sermon</option>
                    <option value="announcement">Announcement</option>
                    <option value="offering">Offering</option>
                    <option value="other">Other</option>
                  </select>
                  <input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="Item title" className="input-elegant w-full" />
                  {itemType === 'song' && (
                    <select value={itemSongId} onChange={e => { setItemSongId(e.target.value); const s = props.songs.find(x => x.id === e.target.value); if (s) setItemTitle(s.title); }} className="input-elegant w-full">
                      <option value="">Pick from library (optional)</option>
                      {props.songs.map(s => <option key={s.id} value={s.id}>{s.title} — {s.key}</option>)}
                    </select>
                  )}
                  <input type="number" value={itemDuration} onChange={e => setItemDuration(+e.target.value)} placeholder="Duration (min)" className="input-elegant w-full" min={1} />
                  <input value={itemAssignedTo} onChange={e => setItemAssignedTo(e.target.value)} placeholder="Assigned to" className="input-elegant w-full" />
                  <input value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="Notes" className="input-elegant w-full" />
                  <button type="button" onClick={handleAddPlanItem} className="btn-primary w-full">Add to Order</button>
                </>
              )}
            </div>
          </div>
        )}

        {selectedPlan && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h4 className="text-lg font-bold text-slate-800">{selectedPlan.title}</h4>
                <p className="text-sm text-slate-500">{selectedPlan.serviceDate} · {sortedItems.length} items · ~{totalDuration} min</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printSundayBulletin({
                    plan: selectedPlan,
                    announcements: (props.announcements || []).filter(a => a.status === 'Published'),
                    events: props.events,
                    devotional: (props.devotionals || []).find(d => d.date === today) || props.devotionals?.[0],
                  })}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <i className="bi bi-printer"></i> Print Sunday Bulletin
                </button>
                {planLoading && <span className="text-xs text-slate-400">Loading...</span>}
              </div>
            </div>
            {sortedItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No items yet — add songs, prayers, and sermon to build the order of service.</p>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{item.itemType}</span>
                        <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                        {item.durationMinutes && <span className="text-xs text-slate-400">{item.durationMinutes}m</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.assignedTo && <span>Led by {item.assignedTo}</span>}
                        {item.songTitle && <span> · {item.songTitle}</span>}
                        {item.notes && <span> · {item.notes}</span>}
                      </div>
                    </div>
                    {isAdmin && item.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => handleMoveItem(item.id!, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">
                          <i className="bi bi-chevron-up text-xs"></i>
                        </button>
                        <button type="button" onClick={() => handleMoveItem(item.id!, 'down')} disabled={idx === sortedItems.length - 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30">
                          <i className="bi bi-chevron-down text-xs"></i>
                        </button>
                        <button type="button" onClick={() => handleDeletePlanItem(item.id!)} className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                          <i className="bi bi-trash text-xs"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!selectedPlan && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold mb-4">Songs ({props.songs.length})</h4>
              {props.songs.map(s => (
                <div key={s.id} className="flex justify-between p-3 bg-slate-50 rounded-xl mb-2 text-sm">
                  <div><span className="font-medium">{s.title}</span> <span className="text-slate-400">— {s.artist}</span></div>
                  <span className="text-xs text-amber-600 font-mono">{s.key}</span>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold mb-4">Service Plans ({props.worshipPlans.length})</h4>
              {props.worshipPlans.map(p => (
                <button key={p.id} type="button" onClick={() => loadPlan(p.id)} className="w-full text-left p-3 bg-slate-50 rounded-xl mb-2 text-sm hover:bg-purple-50 transition-colors">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-slate-500">{p.serviceDate} · {p.serviceType}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- PLEDGES & FUNDS ----
  if (activeSubView === 'Pledges & Funds') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100">
          <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-piggy-bank text-emerald-500 mr-2"></i>Pledges & Funds</h3>
          <p className="text-sm text-slate-500 mt-1">Designated funds and pledge campaigns with progress tracking.</p>
        </div>
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm uppercase text-slate-600">Create Fund</h4>
              <input value={fundName} onChange={e => setFundName(e.target.value)} placeholder="Fund name" className="input-elegant w-full" />
              <input type="number" value={fundGoal} onChange={e => setFundGoal(+e.target.value)} placeholder="Goal amount" className="input-elegant w-full" />
              <button onClick={handleCreateFund} className="btn-primary w-full">Create Fund</button>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm uppercase text-slate-600">Pledge Campaign</h4>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign name" className="input-elegant w-full" />
              <input type="number" value={campaignGoal} onChange={e => setCampaignGoal(+e.target.value)} className="input-elegant w-full" />
              <button onClick={handleCreateCampaign} className="btn-primary w-full">Launch Campaign</button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {props.funds.map(f => (
            <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="font-bold text-slate-800">{f.name}</div>
              <div className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(f.raisedAmount)}</div>
              <div className="text-xs text-slate-400">of {formatCurrency(f.goalAmount)} goal</div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, f.goalAmount ? (f.raisedAmount / f.goalAmount) * 100 : 0)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Pledge Campaigns</h4>
          {props.campaigns.map(c => {
            const pct = c.goalAmount ? Math.round((c.totalFulfilled / c.goalAmount) * 100) : 0;
            return (
              <div key={c.id} className="p-4 bg-slate-50 rounded-xl mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.startDate} — {c.endDate || 'Ongoing'}</div>
                  </div>
                  <span className="text-emerald-600 font-bold">{pct}%</span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div></div>
                <div className="text-xs text-slate-500 mt-1">{formatCurrency(c.totalFulfilled)} fulfilled of {formatCurrency(c.totalPledged)} pledged</div>
              </div>
            );
          })}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="font-bold">Make a Pledge</h4>
          <select value={pledgeCampaignId} onChange={e => setPledgeCampaignId(e.target.value)} className="input-elegant w-full">
            <option value="">Select campaign</option>
            {props.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" value={pledgeAmount} onChange={e => setPledgeAmount(+e.target.value)} className="input-elegant w-full" />
          <button onClick={handleCreatePledge} className="btn-primary w-full">Submit Pledge</button>
        </div>
      </div>
    );
  }

  // ---- COMMUNICATIONS ----
  if (activeSubView === 'Communications') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
          <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-envelope-fill text-blue-500 mr-2"></i>Communications</h3>
          <p className="text-sm text-slate-500 mt-1">Send bulk email, SMS, or push notifications to groups.</p>
        </div>
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm uppercase text-slate-600">Compose Message</h4>
            <div className="grid grid-cols-2 gap-3">
              <select value={msgChannel} onChange={e => setMsgChannel(e.target.value as any)} className="input-elegant">
                <option value="email">Email</option><option value="sms">SMS</option><option value="push">Push Notification</option>
              </select>
              <select value={msgTarget} onChange={e => setMsgTarget(e.target.value)} className="input-elegant">
                <option value="all">All Members</option><option value="leaders">Leaders</option><option value="youth">Youth</option><option value="volunteers">Volunteers</option>
              </select>
            </div>
            <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="Subject" className="input-elegant w-full" />
            <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Message body..." rows={4} className="input-elegant w-full" />
            <button onClick={handleSendMessage} className="btn-primary w-full"><i className="bi bi-send mr-2"></i>Send Message</button>
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Message History</h4>
          {props.communications.map(c => (
            <div key={c.id} className="p-4 bg-slate-50 rounded-xl mb-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{c.subject}</span>
                <span className="text-xs text-slate-400">{c.channel.toUpperCase()} → {c.targetGroup}</span>
              </div>
              <p className="text-slate-500 mt-1 line-clamp-2">{c.body}</p>
              <div className="text-[10px] text-slate-400 mt-2">By {c.sentBy} · {new Date(c.sentAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- CHECK-IN ----
  if (activeSubView === 'Check-In') {
    const kioskContent = (
      <div className="space-y-6 animate-fade-in">
        {/* Sunday QR — primary */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                <i className="bi bi-star-fill"></i> Recommended for Every Sunday
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight">Family QR Check-In</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Print this QR at your entrance. Families check in by phone (with surname confirmation) or family code. Registered households get one-tap check-in.
              </p>
              {sundayQr && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(sundayQr.checkInUrl); }} className="text-xs font-bold px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
                    <i className="bi bi-clipboard mr-1"></i> Copy Link
                  </button>
                  <a href={sundayQr.checkInUrl} target="_blank" rel="noreferrer" className="text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors">
                    <i className="bi bi-phone mr-1"></i> Preview Mobile
                  </a>
                  <button type="button" onClick={() => window.print()} className="text-xs font-bold px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
                    <i className="bi bi-printer mr-1"></i> Print Poster
                  </button>
                </div>
              )}
              {sundayQr && (
                <div className="flex items-center gap-4 pt-2">
                  <div className="text-3xl font-black text-amber-400">{sundayQr.checkedInCount}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Checked in today<br/>{sundayQr.serviceDate}</div>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              {sundayQrLoading && <p className="text-slate-400 text-sm">Generating QR...</p>}
              {sundayQr && (
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <img src={sundayQr.qrDataUrl} alt="Sunday check-in QR" width={260} height={260} className="rounded-xl" />
                  <p className="text-center text-[10px] text-slate-500 mt-3 font-medium">Scan every Sunday</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-50 to-white p-6 rounded-2xl border border-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-qr-code text-teal-500 mr-2"></i>Event Check-In</h3>
              <p className="text-sm text-slate-500 mt-1">QR kiosk check-in — members scan to self check-in, or staff check in manually.</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setKioskMode(!kioskMode)}
                className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${kioskMode ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <i className="bi bi-display mr-1"></i>{kioskMode ? 'Exit Kiosk' : 'Kiosk Mode'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Event QR Code</h4>
            <select value={checkinEventId} onChange={e => setCheckinEventId(e.target.value)} className="input-elegant w-full">
              <option value="">Select event for QR</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} — {ev.date}</option>)}
            </select>
            {qrLoading && <p className="text-sm text-slate-400 text-center">Generating QR...</p>}
            {qrData && (
              <div className="text-center space-y-4">
                <div className="font-semibold text-slate-800">{qrData.eventTitle}</div>
                <img src={qrData.qrDataUrl} alt="Check-in QR code" className="mx-auto rounded-xl border-4 border-teal-100" width={280} height={280} />
                <p className="text-xs text-slate-500">Scan with phone camera to check in</p>
                <div className="text-2xl font-black text-teal-600">{qrData.checkedInCount}</div>
                <div className="text-[10px] text-slate-400 uppercase">Checked in</div>
                <div className="flex gap-2 justify-center">
                  <button type="button" onClick={copyCheckInLink} className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <i className="bi bi-clipboard mr-1"></i>Copy Link
                  </button>
                  <a href={qrData.checkInUrl} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-2 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50">
                    <i className="bi bi-box-arrow-up-right mr-1"></i>Open
                  </a>
                </div>
                <p className="text-[10px] text-slate-400 font-mono break-all">{qrData.checkInUrl}</p>
              </div>
            )}
          </div>

          {/* Manual check-in */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Staff Check-In</h4>
            <select value={checkinEventId} onChange={e => setCheckinEventId(e.target.value)} className="input-elegant w-full">
              <option value="">Select event</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} — {ev.date}</option>)}
            </select>
            <select value={checkinMemberId} onChange={e => setCheckinMemberId(e.target.value)} className="input-elegant w-full">
              <option value="">Select member</option>
              {memberOptions.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
            <button type="button" onClick={handleCheckIn} className="btn-primary w-full text-lg py-4">
              <i className="bi bi-check-circle mr-2"></i>Check In
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Check-In Log ({props.checkIns.length})</h4>
          {props.checkIns.length === 0 ? (
            <p className="text-sm text-slate-400">No check-ins yet.</p>
          ) : props.checkIns.map(ci => (
            <div key={ci.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-2 text-sm">
              <div>
                <span className="font-medium">{ci.memberName}</span>
                <span className="text-slate-400 ml-2">— {ci.eventTitle}</span>
                {ci.familyTag && <span className="text-xs text-teal-600 ml-2">({ci.familyTag})</span>}
                {ci.checkoutTime && <span className="text-xs text-slate-400 ml-2">· Checked out</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-teal-600 font-mono">{new Date(ci.checkinTime).toLocaleTimeString()}</span>
                {isAdmin && !ci.checkoutTime && (
                  <button type="button" onClick={() => handleCheckOut(ci.id)} className="text-[10px] font-bold text-slate-500 hover:text-red-500 px-2 py-1 rounded border border-slate-200">
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if (kioskMode && qrData) {
      return (
        <div className="fixed inset-0 z-50 bg-teal-600 flex flex-col items-center justify-center p-8 text-white">
          <button type="button" onClick={() => setKioskMode(false)} className="absolute top-4 right-4 text-white/70 hover:text-white text-sm">
            <i className="bi bi-x-lg"></i> Exit
          </button>
          <h2 className="text-2xl font-bold mb-2">{qrData.eventTitle}</h2>
          <p className="text-teal-100 mb-8">Scan to check in</p>
          <img src={qrData.qrDataUrl} alt="QR" className="rounded-2xl bg-white p-4" width={360} height={360} />
          <div className="mt-8 text-4xl font-black">{qrData.checkedInCount}</div>
          <div className="text-teal-200 text-sm uppercase tracking-wider">Checked in today</div>
        </div>
      );
    }

    return kioskContent;
  }

  // ---- HOUSEHOLDS ----
  if (activeSubView === 'Households') {
    return (
      <HouseholdManagerView
        households={props.households}
        onUpdateHouseholds={props.onUpdateHouseholds}
        memberOptions={props.memberOptions}
        isAdmin={isAdmin}
      />
    );
  }

  // ---- FORMS ----
  if (activeSubView === 'Forms') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100">
          <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-ui-checks text-indigo-500 mr-2"></i>Custom Forms</h3>
          <p className="text-sm text-slate-500 mt-1">Create and embed custom forms for data collection.</p>
        </div>
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md">
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Form title" className="input-elegant w-full" />
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Description" className="input-elegant w-full" />
            <button onClick={handleCreateForm} className="btn-primary w-full">Create Form</button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.customForms.map(f => (
            <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="font-bold">{f.title}</div>
              <p className="text-sm text-slate-500 mt-1">{f.description}</p>
              <div className="flex gap-2 mt-3">
                <span className="text-[10px] badge-slate">{f.fields.length} fields</span>
                {f.isPublic && <span className="text-[10px] badge-amber">Public</span>}
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">Link: ?view=form&id={f.id.replace('FORM-', '')}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- ACCOUNTING ----
  if (activeSubView === 'Accounting') {
    const income = props.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const expense = props.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-slate-100 to-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800"><i className="bi bi-calculator text-slate-600 mr-2"></i>Church Accounting</h3>
          <p className="text-sm text-slate-500 mt-1">Fund accounting, income/expense tracking, and financial reports.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
            <div className="text-xs text-slate-400 uppercase">Income</div>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(income)}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
            <div className="text-xs text-slate-400 uppercase">Expenses</div>
            <div className="text-2xl font-black text-red-500">{formatCurrency(expense)}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
            <div className="text-xs text-slate-400 uppercase">Net</div>
            <div className="text-2xl font-black text-slate-800">{formatCurrency(income - expense)}</div>
          </div>
        </div>
        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-md">
            <select value={txnType} onChange={e => setTxnType(e.target.value as any)} className="input-elegant w-full">
              <option value="Income">Income</option><option value="Expense">Expense</option>
            </select>
            <input value={txnCategory} onChange={e => setTxnCategory(e.target.value)} placeholder="Category" className="input-elegant w-full" />
            <input type="number" value={txnAmount} onChange={e => setTxnAmount(+e.target.value)} placeholder="Amount" className="input-elegant w-full" />
            <input value={txnDesc} onChange={e => setTxnDesc(e.target.value)} placeholder="Description" className="input-elegant w-full" />
            <button onClick={handleCreateTransaction} className="btn-primary w-full">Record Transaction</button>
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold mb-4">Transaction Ledger</h4>
          {props.transactions.map(t => (
            <div key={t.id} className="flex justify-between p-3 border-b border-slate-50 text-sm">
              <div>
                <span className="font-medium">{t.category}</span>
                <span className="text-slate-400 ml-2">{t.description}</span>
              </div>
              <span className={`font-bold ${t.type === 'Income' ? 'text-emerald-600' : 'text-red-500'}`}>
                {t.type === 'Income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
