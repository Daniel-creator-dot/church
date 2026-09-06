import React, { useState, useEffect, Suspense, lazy } from 'react';

import { 
  Role, 
  Member, 
  Visitor, 
  AttendanceRecord, 
  GivingRecord, 
  Sermon, 
  ChurchEvent, 
  Department, 
  Announcement, 
  PrayerRequest, 
  FollowUpRecord, 
  Devotional, 
  MediaAsset, 
  FinanceTransaction,
  Church,
  Book,
  LiveStream,
  MemberOption,
  LeaderOption,
  User,
  Household, Fund, PledgeCampaign, Pledge,
  VolunteerRole, VolunteerAssignment, Song, WorshipPlan,
  Communication, CustomForm, CheckInRecord,
  DashboardInsights,
} from './types';

import { membersApi, eventsApi, donationsApi, followupsApi, settingsApi, healthCheck, visitorsApi, attendanceApi, ministriesApi, sermonsApi, announcementsApi, prayerApi, devotionalsApi, mediaApi, householdsApi, fundsApi, pledgesApi, volunteersApi, worshipApi, communicationsApi, formsApi, financeApi, checkinApi, booksApi, liveStreamsApi, bootstrapApi } from './api';
import { mapBootstrapToState } from './utils/bootstrap';
import { 
  dbMemberToFrontend, 
  frontendMemberToDb,
  dbEventToFrontend, 
  frontendEventToDb,
  dbDonationToFrontend, 
  frontendGivingToDb,
  dbFollowUpToFrontend,
  dbMemberToOption,
  dbLeaderToOption,
  dbVisitorToFrontend,
  dbAttendanceToFrontend,
  dbMinistryToFrontend,
  dbSermonToFrontend,
  dbAnnouncementToFrontend,
  dbPrayerToFrontend,
  dbDevotionalToFrontend,
  dbMediaToFrontend
} from './dataMapper';
import { getTodayString } from './utils/date';
import { saveSession, loadSession, clearSession } from './utils/session';

import { mapBootstrapToState } from './utils/bootstrap';

import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView';
import CommandPalette from './components/CommandPalette';
import VisitorSignupView from './components/VisitorSignupView';
import PublicCheckInView from './components/PublicCheckInView';
import SundayCheckInView from './components/SundayCheckInView';
import WelcomeDeskKioskView from './components/WelcomeDeskKioskView';
import PublicFormView from './components/PublicFormView';
import VipGuestNominationView from './components/VipGuestNominationView';
import VipProgramCheckInView from './components/VipProgramCheckInView';

const ManagementViews = lazy(() => import('./components/ManagementViews'));
const ChurchLifeViews = lazy(() => import('./components/ChurchLifeViews'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const ChurchesView = lazy(() => import('./components/ChurchesView'));
const LiveStreamView = lazy(() => import('./components/LiveStreamView'));
const BookstoreView = lazy(() => import('./components/BookstoreView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const MemberDirectoryView = lazy(() => import('./components/MemberDirectoryView'));
const ChMeetingsViews = lazy(() => import('./components/ChMeetingsViews'));
const SmallGroupsView = lazy(() => import('./components/SmallGroupsView'));
const PrayerWallView = lazy(() => import('./components/PrayerWallView'));
const DiscipleshipView = lazy(() => import('./components/DiscipleshipView'));
import {
  dbHouseholdToFrontend, dbFundToFrontend, dbCampaignToFrontend, dbPledgeToFrontend,
  dbVolunteerRoleToFrontend, dbVolunteerAssignmentToFrontend, dbSongToFrontend,
  dbWorshipPlanToFrontend, dbCommunicationToFrontend, dbFormToFrontend,
  dbCheckInToFrontend, dbFinanceToFrontend
} from './chMeetingsMapper';
import { dbBookToFrontend, dbLiveStreamToFrontend } from './innovationMapper';

const CHMEETINGS_TABS = ['Calendar', 'Volunteers', 'Worship Planning', 'Pledges & Funds', 'Communications', 'Check-In', 'Households', 'Forms', 'Accounting'];
const INNOVATION_TABS = ['Small Groups', 'Prayer Wall', 'Discipleship'];

// Map database roles to frontend roles
const mapDatabaseRoleToFrontendRole = (dbRole: string): Role => {
  const roleMapping: Record<string, Role> = {
    'Admin': 'Church Administrator',
    'Super Admin': 'Super Admin',
    'Pastor': 'Pastor',
    'Church Administrator': 'Church Administrator',
    'Finance Officer': 'Finance Officer',
    'Department Leader': 'Department Leader',
    'Media': 'Media',
    'Member': 'Member'
  };
  return roleMapping[dbRole] || 'Member';
};

const isTabAllowedForRole = (tabName: string, role: Role): boolean => {
  const baseSuperAdmin = ['Dashboard', 'Churches', 'Members', 'Directory', 'Visitors', 'Attendance', 'Departments', 'Follow Up', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Media', 'Reports', 'Settings', ...CHMEETINGS_TABS, ...INNOVATION_TABS];
  if (role === 'Super Admin') return baseSuperAdmin.includes(tabName);
  if (role === 'Admin') return baseSuperAdmin.filter(t => t !== 'Churches').includes(tabName);
  if (tabName === 'Churches') return false;

  switch (role) {
    case 'Pastor':
      return ['Dashboard', 'Members', 'Directory', 'Visitors', 'Attendance', 'Departments', 'Follow Up', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Reports', 'Settings', 'Calendar', 'Volunteers', 'Worship Planning', 'Communications', 'Check-In', 'Households', 'Forms', 'Pledges & Funds', 'Accounting', 'Small Groups', 'Prayer Wall', 'Discipleship'].includes(tabName);
    case 'Church Administrator':
      return ['Dashboard', 'Members', 'Directory', 'Visitors', 'Attendance', 'Departments', 'Follow Up', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Reports', 'Settings', 'Calendar', 'Volunteers', 'Worship Planning', 'Communications', 'Check-In', 'Households', 'Forms', 'Pledges & Funds', 'Accounting', 'Small Groups', 'Prayer Wall', 'Discipleship'].includes(tabName);
    case 'Finance Officer':
      return ['Dashboard', 'Giving', 'Bookstore', 'Reports', 'Announcements', 'Settings', 'Pledges & Funds', 'Accounting'].includes(tabName);
    case 'Department Leader':
      return ['Dashboard', 'Directory', 'Attendance', 'Departments', 'Follow Up', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Calendar', 'Volunteers', 'Check-In', 'Small Groups', 'Prayer Wall'].includes(tabName);
    case 'Media':
      return ['Dashboard', 'Media', 'Sermons', 'Events', 'Announcements', 'Devotional', 'Worship Planning', 'Calendar', 'Prayer Wall'].includes(tabName);
    case 'Member':
      return ['Dashboard', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Directory', 'Calendar', 'Pledges & Funds', 'Forms', 'Prayer Wall', 'Small Groups', 'Discipleship'].includes(tabName);
    default:
      return false;
  }
};

export default function App() {
  
  // 1. STATE INITIALIZATION (Empty arrays - will fetch from API)
  const [members, setMembers] = useState<Member[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [giving, setGiving] = useState<GivingRecord[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);

  // Dropdown options for follow-ups
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);

  // Multi-Church, Bookstore & Live Stream state (still local for now)
  const [churches, setChurches] = useState<Church[]>([]);
  const [activeChurchId, setActiveChurchId] = useState<string>('C-001');
  const [books, setBooks] = useState<Book[]>([]);
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

  // ChMeetings-inspired state
  const [households, setHouseholds] = useState<Household[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [campaigns, setCampaigns] = useState<PledgeCampaign[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [volunteerRoles, setVolunteerRoles] = useState<VolunteerRole[]>([]);
  const [volunteerAssignments, setVolunteerAssignments] = useState<VolunteerAssignment[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [worshipPlans, setWorshipPlans] = useState<WorshipPlan[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);

  // Active Role State - will be set by login
  const [activeRole, setActiveRole] = useState<Role>('Member');
  
  // Current User State - tracks logged-in member information
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  
  // Navigation View State
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'degraded' | 'offline'>('connected');
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setCurrentUserEmail(session.email);
      setActiveRole(mapDatabaseRoleToFrontendRole(session.role));
      setIsAuthenticated(true);
    }
  }, []);

  // Time state (real-time UTC/local clock)
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let failures = 0;

      const track = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
        try {
          return await fn();
        } catch (error) {
          failures++;
          console.error(`Failed to fetch ${label}:`, error);
          return fallback;
        }
      };

      await track('health', () => healthCheck(), null);

      const bootstrap = await track(
        'bootstrap',
        () => bootstrapApi.load(currentUserEmail ? { email: currentUserEmail } : undefined),
        null
      );

      if (bootstrap) {
        const mapped = mapBootstrapToState(bootstrap);
        setCurrencyCode(mapped.currencyCode);
        setCurrencySymbol(mapped.currencySymbol);
        setMembers(mapped.members);
        setVisitors(mapped.visitors);
        setAttendance(mapped.attendance);
        setEvents(mapped.events);
        setGiving(mapped.giving);
        setFollowUps(mapped.followUps);
        setDepartments(mapped.departments);
        setSermons(mapped.sermons);
        setAnnouncements(mapped.announcements);
        setPrayerRequests(mapped.prayerRequests);
        setDevotionals(mapped.devotionals);
        setMediaAssets(mapped.mediaAssets);
        setMemberOptions(mapped.memberOptions);
        setLeaderOptions(mapped.leaderOptions);
        setHouseholds(mapped.households);
        setFunds(mapped.funds);
        setCampaigns(mapped.campaigns);
        setPledges(mapped.pledges);
        setVolunteerRoles(mapped.volunteerRoles);
        setVolunteerAssignments(mapped.volunteerAssignments);
        setSongs(mapped.songs);
        setWorshipPlans(mapped.worshipPlans);
        setCommunications(mapped.communications);
        setCustomForms(mapped.customForms);
        setCheckIns(mapped.checkIns);
        setTransactions(mapped.transactions);
        setInsights(mapped.insights);
        setBooks(mapped.books);
        setLiveStreams(mapped.liveStreams);
        setPurchasedBookIds(mapped.purchasedBookIds);

        if (currentUserEmail) {
          const currentUser = mapped.membersFrontend.find(m => m.email === currentUserEmail);
          if (currentUser) setCurrentMemberId(currentUser.id);
        }
      }

      if (failures > 3) setApiStatus('offline');
      else setApiStatus(failures > 0 ? 'degraded' : 'connected');
      setIsLoading(false);
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, currentUserEmail]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 2. STATE UPDATE FUNCTIONS (API-based for members, events, donations)
  const updateMembersState = async (newMembers: Member[]) => {
    setMembers(newMembers);
    // Note: In a real app, you'd sync with API here
  };

  const updateVisitorsState = (newVisitors: Visitor[]) => {
    setVisitors(newVisitors);
  };

  const updateAttendanceState = (newAttendance: AttendanceRecord[]) => {
    setAttendance(newAttendance);
  };

  const updateGivingState = async (newGiving: GivingRecord[]) => {
    setGiving(newGiving);
    // Note: In a real app, you'd sync with API here
  };

  const updateSermonsState = (newSermons: Sermon[]) => {
    setSermons(newSermons);
  };

  const updateEventsState = async (newEvents: ChurchEvent[]) => {
    setEvents(newEvents);
    // Note: In a real app, you'd sync with API here
  };

  const updateDepartmentsState = (newDepts: Department[]) => {
    setDepartments(newDepts);
  };

  // Login handler
  const handleLogin = (user: User) => {
    setCurrentUserEmail(user.email);
    const mappedRole = mapDatabaseRoleToFrontendRole(user.role);
    setActiveRole(mappedRole);
    setIsAuthenticated(true);
    saveSession(user);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setCurrentMemberId('');
    setActiveRole('Member');
    setActiveTab('Dashboard');
  };

  const updateAnnouncementsState = (newAnnouncements: Announcement[]) => {
    setAnnouncements(newAnnouncements);
  };

  const updatePrayerRequestsState = (newPrayers: PrayerRequest[]) => {
    setPrayerRequests(newPrayers);
  };

  const updateFollowUpsState = (newFollows: FollowUpRecord[]) => {
    setFollowUps(newFollows);
  };

  const updateDevotionalsState = (newDevotionals: Devotional[]) => {
    setDevotionals(newDevotionals);
  };

  const updateMediaAssetsState = (newMedia: MediaAsset[]) => {
    setMediaAssets(newMedia);
  };

  const updateChurchesState = (newChurches: Church[]) => {
    setChurches(newChurches);
  };

  const updateActiveChurchIdState = (id: string) => {
    setActiveChurchId(id);
  };

  const updateBooksState = (newBooks: Book[]) => {
    setBooks(newBooks);
  };

  const updatePurchasedBooksState = (newIds: string[]) => {
    setPurchasedBookIds(newIds);
  };

  const updateLiveStreamsState = (newStreams: LiveStream[]) => {
    setLiveStreams(newStreams);
  };

  const handleRecordTransaction = async (transaction: { type: 'Income' | 'Expense'; category: string; amount: number; description: string }) => {
    try {
      const saved = await financeApi.create({
        transaction_date: getTodayString(),
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        approved_by: activeRole,
      });
      setTransactions([dbFinanceToFrontend(saved), ...transactions]);
    } catch (error) {
      console.error('Failed to record transaction', error);
    }
  };

  // Nav categories structure
  const sidebarNavItems = [
    { name: 'Dashboard', icon: 'bi-compass', viewGroup: 'Core' },
    { name: 'Churches', icon: 'bi-building', viewGroup: 'Core' },
    
    // Member management group
    { name: 'Members', icon: 'bi-people', viewGroup: 'Administration' },
    { name: 'Directory', icon: 'bi-journal-bookmark', viewGroup: 'Administration' },
    { name: 'Visitors', icon: 'bi-person-plus', viewGroup: 'Administration' },
    { name: 'Attendance', icon: 'bi-calendar3', viewGroup: 'Administration' },
    { name: 'Departments', icon: 'bi-folder', viewGroup: 'Administration' },
    { name: 'Follow Up', icon: 'bi-clock', viewGroup: 'Administration' },

    // Church Life group
    { name: 'Giving', icon: 'bi-coin', viewGroup: 'Church Life' },
    { name: 'Live Stream', icon: 'bi-camera-video', viewGroup: 'Church Life' },
    { name: 'Sermons', icon: 'bi-volume-up', viewGroup: 'Church Life' },
    { name: 'Events', icon: 'bi-calendar-event', viewGroup: 'Church Life' },
    { name: 'Forms', icon: 'bi-ui-checks', viewGroup: 'Church Life' },
    { name: 'Prayer Requests', icon: 'bi-heart', viewGroup: 'Church Life' },
    { name: 'Announcements', icon: 'bi-bell', viewGroup: 'Church Life' },
    { name: 'Devotional', icon: 'bi-book', viewGroup: 'Church Life' },
    { name: 'Bookstore', icon: 'bi-book-half', viewGroup: 'Church Life' },
    { name: 'Media', icon: 'bi-image', viewGroup: 'Church Life' },
    { name: 'Prayer Wall', icon: 'bi-heart-pulse', viewGroup: 'Church Life' },
    { name: 'Small Groups', icon: 'bi-diagram-3', viewGroup: 'Church Life' },
    { name: 'Discipleship', icon: 'bi-signpost-split', viewGroup: 'Church Life' },

    // Operations modules
    { name: 'Calendar', icon: 'bi-calendar3', viewGroup: 'Operations' },
    { name: 'Volunteers', icon: 'bi-person-workspace', viewGroup: 'Operations' },
    { name: 'Worship Planning', icon: 'bi-music-note-beamed', viewGroup: 'Operations' },
    { name: 'Pledges & Funds', icon: 'bi-piggy-bank', viewGroup: 'Operations' },
    { name: 'Communications', icon: 'bi-envelope', viewGroup: 'Operations' },
    { name: 'Check-In', icon: 'bi-qr-code', viewGroup: 'Operations' },
    { name: 'Households', icon: 'bi-house-heart', viewGroup: 'Operations' },
    { name: 'Accounting', icon: 'bi-calculator', viewGroup: 'Operations' },

    // Analytical Reporting group
    { name: 'Reports', icon: 'bi-file-earmark-spreadsheet', viewGroup: 'Analytics' },
    { name: 'Settings', icon: 'bi-sliders', viewGroup: 'Analytics' }
  ];

  // Helper for quick actions triggered from dashboard
  const handleQuickAction = (actionType: string) => {
    if (actionType === 'add-member') {
      setActiveTab('Members');
    } else if (actionType === 'record-giving') {
      setActiveTab('Giving');
    } else if (actionType === 'submit-prayer') {
      setActiveTab('Prayer Wall');
    } else if (actionType === 'checkin') {
      setActiveTab('Check-In');
    } else if (actionType === 'forms' || actionType === 'vip-forms') {
      setActiveTab('Forms');
    }
  };

  // Daily word references for dashboard preview
  const todayStr = getTodayString();
  const currentDevotional = devotionals.find(d => d.date === todayStr) || devotionals[0];
  const devotionalTitle = currentDevotional ? currentDevotional.title : 'Seeking God Early';

  const handleCurrencyChange = async (code: string) => {
    const symbolMap: Record<string, string> = { USD: '$', GHS: 'GH₵', EUR: '€', NGN: '₦' };
    const nextSymbol = symbolMap[code] || '$';
    setCurrencyCode(code);
    setCurrencySymbol(nextSymbol);

    try {
      await settingsApi.updateCurrency(code, nextSymbol);
    } catch (error) {
      console.error('Failed to save currency:', error);
    }
  };

  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const publicView = searchParams?.get('view');
  const isVisitorSignupView = publicView === 'visitor-signup';
  const isPublicCheckInView = publicView === 'checkin';
  const isSundayCheckInView = publicView === 'sunday-checkin';
  const isWelcomeDeskView = publicView === 'welcome-desk';
  const isPublicFormView = publicView === 'form';
  const isVipNominationView = publicView === 'vip-nomination';
  const isVipCheckInView = publicView === 'vip-checkin';

  if (isVisitorSignupView) {
    return <VisitorSignupView />;
  }

  if (isVipNominationView) {
    return <VipGuestNominationView />;
  }

  if (isVipCheckInView) {
    return <VipProgramCheckInView />;
  }

  if (isWelcomeDeskView) {
    return <WelcomeDeskKioskView showExit={false} />;
  }

  if (isSundayCheckInView) {
    return <SundayCheckInView />;
  }

  if (isPublicCheckInView) {
    return <PublicCheckInView />;
  }

  if (isPublicFormView) {
    return <PublicFormView />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center mesh-bg">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse">
              <i className="bi bi-building text-slate-950 text-3xl"></i>
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-amber-500/30 animate-ping opacity-20" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-slate-900">Liberty Assemblies of God</p>
            <p className="text-slate-500 text-sm mt-1">Loading your ministry portal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      
      {/* SIDEBAR */}
      <aside className={`app-sidebar ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <i className="bi bi-building text-slate-950 text-lg"></i>
              </div>
              <div>
                <span className="block font-display font-bold text-sm text-white leading-tight">Liberty AOG</span>
                <span className="block text-[9px] text-amber-400/90 font-bold uppercase tracking-[0.2em]">Ministry Portal</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {['Core', 'Administration', 'Church Life', 'Operations', 'Analytics'].map(group => {
            const items = sidebarNavItems.filter(item => item.viewGroup === group && isTabAllowedForRole(item.name, activeRole));
            if (items.length === 0) return null;
            return (
              <div key={group} className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] px-5 pb-2">
                  {group}
                </span>
                <nav className="space-y-0.5 px-3">
                  {items.map(item => {
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { setActiveTab(item.name); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/20 shadow-inner'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300'
                        }`}>
                          <i className={`bi ${item.icon} text-sm`}></i>
                        </div>
                        <span className={isActive ? 'font-semibold' : ''}>{item.name}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : apiStatus === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`} />
              {apiStatus === 'connected' ? 'Live' : apiStatus === 'degraded' ? 'Partial' : 'Offline'}
            </span>
            <span className="text-slate-400"><i className="bi bi-clock text-amber-500/80 mr-1"></i>{currentTime}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400/30 to-amber-600/20 flex items-center justify-center text-amber-400 text-xs font-bold border border-amber-500/20">
              {currentUserEmail?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-semibold text-white truncate">{currentUserEmail}</span>
              <span className="block text-[9px] text-slate-500">{activeRole}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Logout">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
            <div className="text-center text-[9px] text-slate-600 font-mono">v2.12.0 · Liberty AOG</div>
        </div>
      </aside>

      <div className="app-main mesh-bg">
        
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <i className="bi bi-list text-lg"></i>
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 leading-tight">{activeTab}</h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Liberty Assemblies of God</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 bg-white/80 text-xs text-slate-500 hover:border-amber-300 hover:shadow-md transition-all"
            >
              <i className="bi bi-search"></i>
              <span>Search</span>
              <kbd className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">⌘K</kbd>
            </button>
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-[10px] font-bold text-amber-400 flex items-center gap-1.5 shadow-lg">
              <i className="bi bi-shield-check"></i> {activeRole}
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto pb-16">
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F59E0B] mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm">Loading data from database...</p>
              </div>
            </div>
          )}
          
          {/* Tab 1: Dashboard */}
          {!isLoading && activeTab === 'Dashboard' && (
            <DashboardView 
              members={members}
              visitors={visitors}
              giving={giving}
              events={events}
              announcements={announcements}
              prayerRequests={prayerRequests}
              attendance={attendance}
              activeRole={activeRole}
              currentMemberId={currentMemberId}
              onNavigate={(tab) => setActiveTab(tab)}
              onQuickAction={handleQuickAction}
              devotionalTitle={devotionalTitle}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              formatCurrency={formatCurrency}
              insights={insights}
            />
          )}

          {!isLoading && activeTab === 'Small Groups' && (
            <SmallGroupsView activeRole={activeRole} members={members} />
          )}

          {!isLoading && activeTab === 'Prayer Wall' && (
            <PrayerWallView
              activeRole={activeRole}
              userName={members.find(m => m.email === currentUserEmail)?.name}
              userEmail={currentUserEmail}
              onPrayersUpdate={(p) => setPrayerRequests(prev => [...p, ...prev])}
            />
          )}

          {!isLoading && activeTab === 'Discipleship' && (
            <DiscipleshipView activeRole={activeRole} members={members} currentMemberId={currentMemberId} />
          )}

          {!isLoading && activeTab === 'Directory' && (
            <MemberDirectoryView activeRole={activeRole} members={members} />
          )}

          {/* Tabs 2-6: Management & Administration Subviews */}
          {!isLoading && ['Members', 'Visitors', 'Attendance', 'Departments', 'Follow Up'].includes(activeTab) && (
            <ManagementViews 
              activeSubView={activeTab as any}
              activeRole={activeRole}
              members={members}
              onUpdateMembers={updateMembersState}
              visitors={visitors}
              onUpdateVisitors={updateVisitorsState}
              attendance={attendance}
              onUpdateAttendance={updateAttendanceState}
              departments={departments}
              onUpdateDepartments={updateDepartmentsState}
              followUps={followUps}
              onUpdateFollowUps={updateFollowUpsState}
              memberOptions={memberOptions}
              leaderOptions={leaderOptions}
            />
          )}

          {/* Tabs 7-13: Church Life & Spiritual Engagement Subviews */}
          {!isLoading && ['Giving', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Media'].includes(activeTab) && (
            <ChurchLifeViews 
              activeSubView={activeTab as any}
              activeRole={activeRole}
              userEmail={currentUserEmail}
              currentMemberId={currentMemberId}
              sermons={sermons}
              onUpdateSermons={updateSermonsState}
              giving={giving}
              onUpdateGiving={updateGivingState}
              events={events}
              onUpdateEvents={updateEventsState}
              announcements={announcements}
              onUpdateAnnouncements={updateAnnouncementsState}
              prayerRequests={prayerRequests}
              onUpdatePrayerRequests={updatePrayerRequestsState}
              devotionals={devotionals}
              onUpdateDevotionals={updateDevotionalsState}
              mediaAssets={mediaAssets}
              onUpdateMediaAssets={updateMediaAssetsState}
              onRecordTransaction={handleRecordTransaction}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Tab 14: Analytical Reports Panel */}
          {!isLoading && activeTab === 'Reports' && (
            <ReportsView 
              activeRole={activeRole}
              members={members}
              visitors={visitors}
              giving={giving}
              attendance={attendance}
              departments={departments}
              transactions={transactions}
              currentMemberId={currentMemberId}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              formatCurrency={formatCurrency}
            />
          )}

          {/* Tab 15: Multi-Church Branch Directory */}
          {!isLoading && activeTab === 'Churches' && (
            <ChurchesView 
              activeRole={activeRole}
              churches={churches}
              activeChurchId={activeChurchId}
              onUpdateChurches={updateChurchesState}
              onSetActiveChurch={updateActiveChurchIdState}
            />
          )}

          {/* Tab 16: Live Streaming virtual sanctuary */}
          {!isLoading && activeTab === 'Live Stream' && (
            <LiveStreamView 
              activeRole={activeRole}
              liveStreams={liveStreams}
              onUpdateLiveStreams={updateLiveStreamsState}
            />
          )}

          {/* Tab 17: Bookstore e-library */}
          {!isLoading && activeTab === 'Bookstore' && (
            <BookstoreView 
              activeRole={activeRole}
              books={books}
              purchasedBookIds={purchasedBookIds}
              currentMemberId={currentMemberId}
              onUpdatePurchasedBooks={updatePurchasedBooksState}
              onRecordTransaction={handleRecordTransaction}
              onUpdateBooks={updateBooksState}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              formatCurrency={formatCurrency}
            />
          )}

          {/* ChMeetings-inspired modules */}
          {!isLoading && CHMEETINGS_TABS.includes(activeTab) && (
            <ChMeetingsViews
              activeSubView={activeTab as any}
              activeRole={activeRole}
              userEmail={currentUserEmail}
              members={members}
              events={events}
              memberOptions={memberOptions}
              households={households}
              onUpdateHouseholds={setHouseholds}
              funds={funds}
              onUpdateFunds={setFunds}
              campaigns={campaigns}
              onUpdateCampaigns={setCampaigns}
              pledges={pledges}
              onUpdatePledges={setPledges}
              volunteerRoles={volunteerRoles}
              onUpdateVolunteerRoles={setVolunteerRoles}
              volunteerAssignments={volunteerAssignments}
              onUpdateVolunteerAssignments={setVolunteerAssignments}
              songs={songs}
              onUpdateSongs={setSongs}
              worshipPlans={worshipPlans}
              onUpdateWorshipPlans={setWorshipPlans}
              communications={communications}
              onUpdateCommunications={setCommunications}
              customForms={customForms}
              onUpdateCustomForms={setCustomForms}
              checkIns={checkIns}
              onUpdateCheckIns={setCheckIns}
              transactions={transactions}
              onUpdateTransactions={setTransactions}
              formatCurrency={formatCurrency}
              announcements={announcements}
              devotionals={devotionals}
            />
          )}

          {/* Tab 18: Settings and role access */}
          {!isLoading && activeTab === 'Settings' && (
            <SettingsView
              activeRole={activeRole}
              currencyCode={currencyCode}
              currencySymbol={currencySymbol}
              onSetCurrency={handleCurrencyChange}
              formatCurrency={formatCurrency}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

        </main>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        navItems={sidebarNavItems
          .filter(item => isTabAllowedForRole(item.name, activeRole))
          .map(item => ({ name: item.name, icon: item.icon, group: item.viewGroup }))}
        onNavigate={setActiveTab}
        onQuickAction={handleQuickAction}
      />
    </div>
  );
}
