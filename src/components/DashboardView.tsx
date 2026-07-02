import React, { useState } from 'react';
import { 
  Member, 
  Visitor, 
  GivingRecord, 
  ChurchEvent, 
  Announcement, 
  PrayerRequest, 
  AttendanceRecord,
  Role 
} from '../types';

interface DashboardProps {
  members: Member[];
  visitors: Visitor[];
  giving: GivingRecord[];
  events: ChurchEvent[];
  announcements: Announcement[];
  prayerRequests: PrayerRequest[];
  attendance: AttendanceRecord[];
  activeRole: Role;
  currentMemberId?: string;
  onNavigate: (view: string) => void;
  onQuickAction: (actionType: string) => void;
  devotionalTitle: string;
  currencySymbol?: string;
  currencyCode?: string;
  formatCurrency?: (amount: number) => string;
}

const isTabAllowedForRole = (tabName: string, role: Role): boolean => {
  if (role === 'Super Admin') return true;
  
  switch (role) {
    case 'Pastor':
      return true;

    case 'Church Administrator':
      return true;

    case 'Finance Officer':
      return ['Dashboard', 'Giving', 'Bookstore', 'Reports', 'Announcements'].includes(tabName);

    case 'Department Leader':
      return [
        'Dashboard',
        'Attendance',
        'Departments',
        'Follow Up',
        'Sermons',
        'Events',
        'Prayer Requests',
        'Announcements',
        'Devotional',
        'Media'
      ].includes(tabName);

    case 'Member':
      return [
        'Dashboard',
        'Giving',
        'Live Stream',
        'Sermons',
        'Events',
        'Prayer Requests',
        'Announcements',
        'Devotional',
        'Bookstore',
        'Media'
      ].includes(tabName);

    default:
      return false;
  }
};

export default function DashboardView({
  members,
  visitors,
  giving,
  events,
  announcements,
  prayerRequests,
  attendance,
  activeRole,
  currentMemberId,
  onNavigate,
  onQuickAction,
  devotionalTitle,
  currencySymbol = '$',
  currencyCode = 'USD',
  formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`,
}: DashboardProps) {
  // Filter giving records based on role - members only see their own giving
  const filteredGiving = activeRole === 'Member' && currentMemberId
    ? giving.filter(g => g.memberId === currentMemberId)
    : giving;

  // Calculations
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.membershipStatus === 'Active').length;
  const pendingVisitors = visitors.filter(v => v.status !== 'Converted' && v.status !== 'Lost').length;
  
  // Total Giving (Tithe + Offering + Project + Welfare + thanksgiving + seed)
  const totalGiving = filteredGiving.reduce((sum, g) => sum + g.amount, 0);
  
  // Pending Prayer requests
  const pendingPrayers = prayerRequests.filter(p => p.status === 'Pending').length;
  
  // Next upcoming event
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextEvent = upcomingEvents[0];

  // Latest announcements
  const latestAnnouncements = announcements
    .filter(a => a.status === 'Published')
    .slice(0, 2);

  const birthdayMembers = [...members]
    .filter(member => member.birthday)
    .sort((a, b) => {
      const aDate = new Date(a.birthday);
      const bDate = new Date(b.birthday);
      const nowYear = new Date().getFullYear();
      const aThisYear = new Date(`${nowYear}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(aDate.getDate()).padStart(2, '0')}`);
      const bThisYear = new Date(`${nowYear}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`);
      return aThisYear.getTime() - bThisYear.getTime();
    })
    .slice(0, 5);

  // Financial summary for a bar chart
  // Group giving by types
  const givingByType = filteredGiving.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const givingTypes = ['Tithe', 'Offering', 'Seed', 'Project', 'Welfare', 'Thanksgiving'];
  const maxGivingAmount = Math.max(...givingTypes.map(t => givingByType[t] || 0), 100);

  // Attendance Trend (using real data from database)
  const attendanceData = attendance
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
    .reverse()
    .map(record => ({
      service: `${record.serviceType} (${new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      count: record.headcount
    }));
  const maxAttendance = Math.max(...attendanceData.map(d => d.count), 200);

  // Construct dynamic KPI list based on what the role is permitted to see
  const kpiCards = [
    {
      id: 'kpi-members',
      name: 'Members',
      label: 'Total Members',
      value: totalMembers,
      subValue: `(${activeMembers} active)`,
      icon: 'bi-people',
      bgColor: 'bg-slate-50 border-[#E2E8F0]',
      iconColor: 'text-[#F59E0B]'
    },
    {
      id: 'kpi-visitors',
      name: 'Visitors',
      label: 'New Visitors',
      value: pendingVisitors,
      subValue: 'Pending Follow-up',
      icon: 'bi-person-plus',
      bgColor: 'bg-[#FFFBEB] border-amber-100',
      iconColor: 'text-[#F59E0B]'
    },
    {
      id: 'kpi-giving',
      name: 'Giving',
      label: "Month's Giving",
      value: formatCurrency(totalGiving),
      subValue: 'Synced Ledger',
      icon: 'bi-coin',
      bgColor: 'bg-[#FFFBEB] border-amber-100',
      iconColor: 'text-[#F59E0B]'
    },
    {
      id: 'kpi-prayers',
      name: 'Prayer Requests',
      label: 'Prayer Petitions',
      value: pendingPrayers,
      subValue: 'Awaiting Prayer',
      icon: 'bi-heart',
      bgColor: 'bg-rose-50 border-rose-100',
      iconColor: 'text-rose-500'
    },
    {
      id: 'kpi-livestream',
      name: 'Live Stream',
      label: 'Virtual Sanctuary',
      value: 'Live Streaming',
      subValue: 'Watch Holy Service',
      icon: 'bi-camera-video',
      bgColor: 'bg-indigo-50 border-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      id: 'kpi-bookstore',
      name: 'Bookstore',
      label: 'E-Library Bookstore',
      value: 'Online Catalog',
      subValue: 'Spiritual Literature',
      icon: 'bi-book-half',
      bgColor: 'bg-amber-50 border-amber-200',
      iconColor: 'text-[#F59E0B]'
    }
  ];

  // Filter so we only show KPI cards that the role can navigate to or are relevant to members
  const allowedKpis = kpiCards.filter(card => {
    // If user is a Member, do not show internal membership/visitors stats to keep dashboard personal & secure
    if (activeRole === 'Member' && ['Members', 'Visitors'].includes(card.name)) {
      return false;
    }
    // For Finance Officer, don't show prayer requests or members or visitors
    if (activeRole === 'Finance Officer' && ['Members', 'Visitors', 'Prayer Requests', 'Live Stream'].includes(card.name)) {
      return false;
    }
    return isTabAllowedForRole(card.name, activeRole);
  }).slice(0, 4); // Limit to maximum of 4 cards on screen for pristine grid balance

  const isLeader = ['Super Admin', 'Pastor', 'Church Administrator', 'Finance Officer', 'Department Leader'].includes(activeRole);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-8 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.28),_transparent_45%),linear-gradient(120deg,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 border border-[#F59E0B]/30 bg-[#F59E0B]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#FDE68A]">
            Morning Church Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-sans font-light tracking-tight leading-none">
            Grace and Peace be multiplied to you.
          </h1>
          <p className="text-sm md:text-base font-sans font-light leading-relaxed text-slate-200">
            Welcome back to the church command hub. You are currently logged in as <span className="font-semibold text-[#FDE68A]">{activeRole}</span>. Keep the ministry organized, aligned, and spiritually nourished.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            {activeRole !== 'Member' && activeRole !== 'Finance Officer' && (
              <button 
                id="quick-add-member"
                onClick={() => onQuickAction('add-member')}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-500"
              >
                <i className="bi bi-plus text-base"></i> Add New Member
              </button>
            )}
            {['Super Admin', 'Pastor', 'Finance Officer', 'Church Administrator'].includes(activeRole) && (
              <button 
                id="quick-record-giving"
                onClick={() => onQuickAction('record-giving')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#F59E0B] px-4 py-2.5 text-xs font-semibold text-white border border-[#F59E0B] shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-600"
              >
                <i className="bi bi-coin text-sm"></i> Record Tithe/Offering
              </button>
            )}
            <button 
              id="quick-prayer-request"
              onClick={() => onQuickAction('submit-prayer')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-100 border border-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-700"
            >
              <i className="bi bi-heart text-xs text-[#F59E0B]"></i> Submit Prayer Request
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Dynamically Tailored */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allowedKpis.map(card => {
          const iconClass = card.icon;
          return (
            <div key={card.id} className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none flex items-center justify-between transition-all duration-300">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">{card.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#1A202C]">{card.value}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{card.subValue}</span>
                </div>
                <button 
                  onClick={() => onNavigate(card.name)} 
                  className="text-xs text-[#F59E0B] hover:underline inline-flex items-center gap-1 mt-2 font-semibold uppercase tracking-wider"
                >
                  {card.name} <i className="bi bi-arrow-up-right text-xs"></i>
                </button>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-none flex items-center justify-center border`}>
                <i className={`bi ${iconClass} text-xl ${card.iconColor}`}></i>
              </div>
            </div>
          );
        })}
      </div>

      {activeRole === 'Church Administrator' && (
        <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Birthdays This Month</h3>
              <p className="text-xs text-slate-400">A quick reminder of who is celebrating soon.</p>
            </div>
            <span className="bg-[#FFFBEB] border border-amber-200 text-[#F59E0B] text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-none flex items-center gap-1.5 font-bold">
              <i className="bi bi-cake2 text-sm"></i> Celebrations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdayMembers.map(member => (
              <div key={member.id} className="border border-[#E2E8F0] bg-slate-50 p-4 rounded-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.department || 'General Member'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Birthday</p>
                    <p className="text-sm font-semibold text-slate-700">{new Date(member.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            ))}
            {birthdayMembers.length === 0 && (
              <p className="text-sm text-slate-500 col-span-full">No birthday dates available right now.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Row based on role (Charts for leaders, spiritual growth highlights for members) */}
      {isLeader ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Giving Distribution Chart Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Giving Breakdown</h3>
                <p className="text-xs text-slate-400">Total voluntary income from all sources</p>
              </div>
              <span className="bg-slate-50 border border-[#E2E8F0] text-slate-600 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-none flex items-center gap-1 font-bold">
                <i className="bi bi-graph-up text-[#F59E0B]"></i> Active Ledger
              </span>
            </div>

            {/* SVG Custom Graph and Bars */}
            <div className="space-y-4 pt-2">
              {givingTypes.map(type => {
                const amount = givingByType[type] || 0;
                const percent = maxGivingAmount > 0 ? (amount / maxGivingAmount) * 100 : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-none ${
                          type === 'Tithe' ? 'bg-[#F59E0B]' :
                          type === 'Offering' ? 'bg-[#1A202C]' :
                          type === 'Seed' ? 'bg-[#718096]' :
                          type === 'Project' ? 'bg-[#4A5568]' :
                          type === 'Welfare' ? 'bg-rose-500' :
                          'bg-violet-500'
                        }`} />
                        {type}
                      </span>
                      <span className="font-mono">{formatCurrency(amount)}</span>
                    </div>
                    <div className="w-full bg-[#EDF2F7] h-4 rounded-none overflow-hidden">
                      <div 
                        className={`h-full rounded-none transition-all duration-1000 ${
                          type === 'Tithe' ? 'bg-[#F59E0B]' :
                          type === 'Offering' ? 'bg-[#1A202C]' :
                          type === 'Seed' ? 'bg-[#718096]' :
                          type === 'Project' ? 'bg-[#4A5568]' :
                          type === 'Welfare' ? 'bg-rose-500' :
                          'bg-violet-500'
                        }`} 
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Trend & Quick Word Column */}
          <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Attendance Tracker</h3>
              <p className="text-xs text-slate-400">Headcount trends for past services</p>
            </div>

            {/* Visual SVG mini chart representing Sunday service / meeting headcounts */}
            <div className="h-40 flex items-end justify-between px-2 pt-4 border-b border-[#E2E8F0] pb-1">
              {attendanceData.map((d, idx) => {
                const height = (d.count / maxAttendance) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 group relative w-12">
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-none border border-slate-700 pointer-events-none">
                      {d.count} people
                    </div>
                    <div 
                      className="w-8 bg-amber-50 hover:bg-[#FFFBEB] group-hover:scale-105 rounded-none transition-all duration-500 ease-out flex items-end justify-center overflow-hidden border-t-2 border-[#F59E0B]"
                      style={{ height: `${height}%` }}
                    >
                      <div className="w-full h-1 bg-[#F59E0B]"></div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium rotate-12 origin-left mt-1 whitespace-nowrap">
                      {d.service}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#1A202C] text-white p-5 rounded-none border-l-4 border-[#F59E0B] space-y-2 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-[#F59E0B] font-bold uppercase tracking-wider">
                <i className="bi bi-book text-sm"></i> TODAY'S SPIRITUAL WORD
              </div>
              <p className="text-xs font-light font-sans italic leading-relaxed line-clamp-3 opacity-90">
                "{devotionalTitle}"
              </p>
              <button 
                onClick={() => onNavigate('Devotional')} 
                className="text-xs text-[#F59E0B] hover:underline font-bold uppercase tracking-wider flex items-center gap-1.5 pt-1"
              >
                READ FULL <i className="bi bi-arrow-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Personalized Spiritual Growth Center for standard Members */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Devotional Highlight for Members */}
          <div className="lg:col-span-2 bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Daily Devotional study</h3>
                <p className="text-xs text-slate-400">Nourish your soul with daily grace</p>
              </div>
              <span className="bg-[#FFFBEB] border border-amber-200 text-[#F59E0B] text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-none flex items-center gap-1.5 font-bold">
                <i className="bi bi-book text-sm"></i> DEVOTIONAL GUIDE
              </span>
            </div>

            <div className="p-6 bg-slate-50 border border-[#E2E8F0] space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#F59E0B] font-extrabold flex items-center gap-1.5">
                <i className="bi bi-book text-sm"></i> SCRIPTURE PORTION
              </span>
              <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight leading-snug">
                {devotionalTitle}
              </h4>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Thy word is a lamp unto my feet, and a light unto my path. Keep seeking first the Kingdom of God and His righteousness, and all these things shall be added unto you."
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onNavigate('Devotional')} 
                  className="bg-[#1A202C] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
                >
                  Enter Devotional Room <i className="bi bi-arrow-right text-xs text-[#F59E0B]"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Member Quick-Access Features Widget */}
          <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none flex flex-col justify-between space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Worship Hub Shortcuts</h3>
              <p className="text-xs text-slate-400">Quickly jump into active sanctuaries</p>
            </div>

            <div className="space-y-3 flex-1 pt-4">
              <button 
                onClick={() => onNavigate('Live Stream')}
                className="w-full p-3 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="bi bi-camera-video text-rose-500 text-sm"></i> WATCH LIVE STREAM
                  </span>
                  <span className="block text-[10px] text-slate-500">Join virtual fellowship now</span>
                </div>
                <i className="bi bi-arrow-right text-rose-400"></i>
              </button>

              <button 
                onClick={() => onNavigate('Bookstore')}
                className="w-full p-3 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="bi bi-book-half text-[#F59E0B] text-sm"></i> VISIT BOOKSTORE
                  </span>
                  <span className="block text-[10px] text-slate-500">Acquire inspiring audiobooks</span>
                </div>
                <i className="bi bi-arrow-right text-amber-400"></i>
              </button>

              <button 
                onClick={() => onNavigate('Sermons')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="bi bi-play-fill text-slate-500 text-sm"></i> LISTEN TO SERMONS
                  </span>
                  <span className="block text-[10px] text-slate-500">Audio sermons catalog</span>
                </div>
                <i className="bi bi-arrow-right text-slate-400"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Program Highlight */}
        <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 text-[#F59E0B] rounded-none border border-amber-100 flex items-center justify-center">
                <i className="bi bi-calendar3 text-base"></i>
              </div>
              <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Next Major Program</h3>
            </div>
            <button 
              onClick={() => onNavigate('Events')} 
              className="text-xs text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider hover:underline"
            >
              All Events
            </button>
          </div>

          {nextEvent ? (
            <div className="p-5 bg-[#F7FAFC] border border-[#E2E8F0] rounded-none space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="bg-[#FFFBEB] text-[#F59E0B] border border-amber-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-none">
                    {nextEvent.category}
                  </span>
                  <h4 className="text-md font-bold text-slate-900 pt-1 leading-snug uppercase tracking-tight">{nextEvent.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed pt-1">{nextEvent.description}</p>
                </div>
                {/* Date Badge */}
                <div className="bg-white border border-[#E2E8F0] rounded-none px-3 py-2 text-center shrink-0 min-w-[70px]">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">
                    {new Date(nextEvent.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="block text-xl font-bold text-[#1A202C] leading-none">
                    {new Date(nextEvent.date).toLocaleDateString('en-US', { day: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-y-2 justify-between items-center pt-2 border-t border-slate-200 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><i className="bi bi-clock text-slate-400"></i> <b>{nextEvent.time}</b></span>
                  <span className="flex items-center gap-1"><i className="bi bi-geo-alt text-slate-400"></i> <b>{nextEvent.location}</b></span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FFFBEB] text-[#F59E0B] border border-amber-200 px-2.5 py-1 rounded-none text-[11px] font-bold uppercase tracking-wider">
                  <i className="bi bi-check-circle"></i> {nextEvent.rsvps.length} RSVP'D
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No upcoming events listed yet.</p>
          )}
        </div>

        {/* Latest Announcements */}
        <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-50 text-slate-700 rounded-none border border-[#E2E8F0] flex items-center justify-center">
                <i className="bi bi-bell-fill text-[#F59E0B] text-base"></i>
              </div>
              <h3 className="text-xs font-bold text-[#1A202C] uppercase tracking-wider">Ministry Announcements</h3>
            </div>
            <button 
              onClick={() => onNavigate('Announcements')} 
              className="text-xs text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wider hover:underline"
            >
              All Alerts
            </button>
          </div>

          <div className="space-y-4">
            {latestAnnouncements.map(ann => (
              <div key={ann.id} className="p-4 bg-[#F7FAFC] rounded-none hover:bg-slate-50 transition-colors border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-none uppercase tracking-wide border ${
                    ann.category === 'Youth' ? 'bg-[#FFFBEB] text-[#F59E0B] border-amber-200' :
                    ann.category === 'General' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                    'bg-blue-50 text-blue-800 border-blue-100'
                  }`}>
                    {ann.category} Alert
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug uppercase tracking-tight">{ann.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{ann.content}</p>
              </div>
            ))}
            {latestAnnouncements.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">No published announcements available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

