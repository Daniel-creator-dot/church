import React, { useState, useEffect } from 'react';

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
  Communication, CustomForm, CheckInRecord
} from './types';

import { membersApi, eventsApi, donationsApi, followupsApi, settingsApi, healthCheck, visitorsApi, attendanceApi, ministriesApi, sermonsApi, announcementsApi, prayerApi, devotionalsApi, mediaApi, householdsApi, fundsApi, pledgesApi, volunteersApi, worshipApi, communicationsApi, formsApi, financeApi, checkinApi } from './api';
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

import DashboardView from './components/DashboardView';
import ManagementViews from './components/ManagementViews';
import ChurchLifeViews from './components/ChurchLifeViews';
import ReportsView from './components/ReportsView';
import ChurchesView from './components/ChurchesView';
import LiveStreamView from './components/LiveStreamView';
import BookstoreView from './components/BookstoreView';
import SettingsView from './components/SettingsView';
import VisitorSignupView from './components/VisitorSignupView';
import PublicCheckInView from './components/PublicCheckInView';
import PublicFormView from './components/PublicFormView';
import MemberDirectoryView from './components/MemberDirectoryView';
import LoginView from './components/LoginView';
import ChMeetingsViews from './components/ChMeetingsViews';
import {
  dbHouseholdToFrontend, dbFundToFrontend, dbCampaignToFrontend, dbPledgeToFrontend,
  dbVolunteerRoleToFrontend, dbVolunteerAssignmentToFrontend, dbSongToFrontend,
  dbWorshipPlanToFrontend, dbCommunicationToFrontend, dbFormToFrontend,
  dbCheckInToFrontend, dbFinanceToFrontend
} from './chMeetingsMapper';

const CHMEETINGS_TABS = ['Calendar', 'Volunteers', 'Worship Planning', 'Pledges & Funds', 'Communications', 'Check-In', 'Households', 'Forms', 'Accounting'];

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
  const baseSuperAdmin = ['Dashboard', 'Churches', 'Members', 'Directory', 'Visitors', 'Attendance', 'Departments', 'Follow Up', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Media', 'Reports', 'Settings', ...CHMEETINGS_TABS];
  if (role === 'Super Admin') return baseSuperAdmin.includes(tabName);
  if (role === 'Admin') return baseSuperAdmin.filter(t => t !== 'Churches').includes(tabName);
  if (tabName === 'Churches') return false;

  switch (role) {
    case 'Pastor':
      return ['Dashboard', 'Members', 'Directory', 'Visitors', 'Attendance', 'Departments', 'Follow Up', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Reports', 'Settings', 'Calendar', 'Volunteers', 'Worship Planning', 'Communications', 'Check-In', 'Households', 'Forms', 'Pledges & Funds', 'Accounting'].includes(tabName);
    case 'Church Administrator':
      return ['Dashboard', 'Members', 'Directory', 'Visitors', 'Attendance', 'Departments', 'Follow Up', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Reports', 'Settings', 'Calendar', 'Volunteers', 'Worship Planning', 'Communications', 'Check-In', 'Households', 'Forms', 'Pledges & Funds', 'Accounting'].includes(tabName);
    case 'Finance Officer':
      return ['Dashboard', 'Giving', 'Bookstore', 'Reports', 'Announcements', 'Settings', 'Pledges & Funds', 'Accounting'].includes(tabName);
    case 'Department Leader':
      return ['Dashboard', 'Directory', 'Attendance', 'Departments', 'Follow Up', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Calendar', 'Volunteers', 'Check-In'].includes(tabName);
    case 'Media':
      return ['Dashboard', 'Media', 'Sermons', 'Events', 'Announcements', 'Devotional', 'Worship Planning', 'Calendar'].includes(tabName);
    case 'Member':
      return ['Dashboard', 'Giving', 'Live Stream', 'Sermons', 'Events', 'Prayer Requests', 'Announcements', 'Devotional', 'Bookstore', 'Directory', 'Calendar', 'Pledges & Funds', 'Forms'].includes(tabName);
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
      setApiStatus(failures > 0 ? 'degraded' : 'connected');

      const settings = await track('settings', () => settingsApi.get(), { currencyCode: 'USD', currencySymbol: '$' });
      setCurrencyCode(settings.currencyCode || 'USD');
      setCurrencySymbol(settings.currencySymbol || '$');

      const membersData = await track('members', () => membersApi.getAll(), []);
      const membersFrontend = membersData.map(dbMemberToFrontend);
      setMembers(membersFrontend);

      if (currentUserEmail) {
        const currentUser = membersFrontend.find(m => m.email === currentUserEmail);
        if (currentUser) setCurrentMemberId(currentUser.id);
      }

      const visitorsData = await track('visitors', () => visitorsApi.getAll(), []);
      setVisitors(visitorsData.map(dbVisitorToFrontend));

      const attendanceData = await track('attendance', () => attendanceApi.getAll(), []);
      setAttendance(attendanceData.map(dbAttendanceToFrontend));

      const eventsData = await track('events', () => eventsApi.getAll(), []);
      setEvents(eventsData.map(dbEventToFrontend));

      const donationsData = await track('donations', () => donationsApi.getAll(), []);
      setGiving(donationsData.map(dbDonationToFrontend));

      const followUpsData = await track('followups', () => followupsApi.getAll(), []);
      setFollowUps(followUpsData.map(dbFollowUpToFrontend));

      const ministriesData = await track('ministries', () => ministriesApi.getAll(), []);
      setDepartments(ministriesData.map(dbMinistryToFrontend));

      const sermonsData = await track('sermons', () => sermonsApi.getAll(), []);
      setSermons(sermonsData.map(dbSermonToFrontend));

      const announcementsData = await track('announcements', () => announcementsApi.getAll(), []);
      setAnnouncements(announcementsData.map(dbAnnouncementToFrontend));

      const prayerData = await track('prayer', () => prayerApi.getAll(), []);
      setPrayerRequests(prayerData.map(dbPrayerToFrontend));

      const devotionalsData = await track('devotionals', () => devotionalsApi.getAll(), []);
      setDevotionals(devotionalsData.map(dbDevotionalToFrontend));

      const mediaData = await track('media', () => mediaApi.getAll(), []);
      setMediaAssets(mediaData.map(dbMediaToFrontend));

      const memberOptionsData = await track('member options', () => followupsApi.getMembers(), []);
      setMemberOptions(memberOptionsData.map(dbMemberToOption));

      const leaderOptionsData = await track('leader options', () => followupsApi.getLeaders(), []);
      setLeaderOptions(leaderOptionsData.map(dbLeaderToOption));

      const householdsData = await track('households', () => householdsApi.getAll(), []);
      setHouseholds(householdsData.map(dbHouseholdToFrontend));

      const fundsData = await track('funds', () => fundsApi.getAll(), []);
      setFunds(fundsData.map(dbFundToFrontend));

      const campaignsData = await track('campaigns', () => pledgesApi.getCampaigns(), []);
      setCampaigns(campaignsData.map(dbCampaignToFrontend));

      const pledgesData = await track('pledges', () => pledgesApi.getAll(), []);
      setPledges(pledgesData.map(dbPledgeToFrontend));

      const volRolesData = await track('volunteer roles', () => volunteersApi.getRoles(), []);
      setVolunteerRoles(volRolesData.map(dbVolunteerRoleToFrontend));

      const volAssignData = await track('volunteer assignments', () => volunteersApi.getAssignments(), []);
      setVolunteerAssignments(volAssignData.map(dbVolunteerAssignmentToFrontend));

      const songsData = await track('songs', () => worshipApi.getSongs(), []);
      setSongs(songsData.map(dbSongToFrontend));

      const plansData = await track('worship plans', () => worshipApi.getPlans(), []);
      setWorshipPlans(plansData.map(dbWorshipPlanToFrontend));

      const commsData = await track('communications', () => communicationsApi.getAll(), []);
      setCommunications(commsData.map(dbCommunicationToFrontend));

      const formsData = await track('forms', () => formsApi.getAll(), []);
      setCustomForms(formsData.map(dbFormToFrontend));

      const checkinData = await track('checkins', () => checkinApi.getAll(), []);
      setCheckIns(checkinData.map(dbCheckInToFrontend));

      const financeData = await track('finance', () => financeApi.getAll(), []);
      setTransactions(financeData.map(dbFinanceToFrontend));

      if (failures > 3) setApiStatus('offline');
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
    { name: 'Prayer Requests', icon: 'bi-heart', viewGroup: 'Church Life' },
    { name: 'Announcements', icon: 'bi-bell', viewGroup: 'Church Life' },
    { name: 'Devotional', icon: 'bi-book', viewGroup: 'Church Life' },
    { name: 'Bookstore', icon: 'bi-book-half', viewGroup: 'Church Life' },
    { name: 'Media', icon: 'bi-image', viewGroup: 'Church Life' },

    // ChMeetings-inspired modules
    { name: 'Calendar', icon: 'bi-calendar3', viewGroup: 'ChMeetings' },
    { name: 'Volunteers', icon: 'bi-person-workspace', viewGroup: 'ChMeetings' },
    { name: 'Worship Planning', icon: 'bi-music-note-beamed', viewGroup: 'ChMeetings' },
    { name: 'Pledges & Funds', icon: 'bi-piggy-bank', viewGroup: 'ChMeetings' },
    { name: 'Communications', icon: 'bi-envelope', viewGroup: 'ChMeetings' },
    { name: 'Check-In', icon: 'bi-qr-code', viewGroup: 'ChMeetings' },
    { name: 'Households', icon: 'bi-house-heart', viewGroup: 'ChMeetings' },
    { name: 'Forms', icon: 'bi-ui-checks', viewGroup: 'ChMeetings' },
    { name: 'Accounting', icon: 'bi-calculator', viewGroup: 'ChMeetings' },

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
      setActiveTab('Prayer Requests');
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
  const isPublicFormView = publicView === 'form';

  if (isVisitorSignupView) {
    return <VisitorSignupView />;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full animate-pulse">
            <i className="bi bi-church text-white text-2xl"></i>
          </div>
          <p className="text-slate-600 font-medium">Loading Bethel Baptist Church...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#1A202C] flex flex-col md:flex-row antialiased font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b from-white to-slate-50 text-slate-800 border-r border-slate-200/60 transition-all duration-300 ease-out flex flex-col justify-between shadow-lg ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200/60 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-amber-500/20">
              B
            </div>
            <div>
              <span className="block font-sans font-extrabold text-sm uppercase tracking-tight leading-tight text-slate-900">Bethel Baptist Church</span>
              <span className="block font-mono text-[9px] text-[#F59E0B] font-extrabold uppercase tracking-wider">Management Portal</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto px-0 py-6 space-y-6">
          {/* Groupings of Navigation links */}
          {['Core', 'Administration', 'Church Life', 'ChMeetings', 'Analytics'].map(group => {
            const items = sidebarNavItems.filter(item => item.viewGroup === group && isTabAllowedForRole(item.name, activeRole));
            if (items.length === 0) return null;
            return (
              <div key={group} className="space-y-1">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-6 pb-2">
                  {group}
                </span>
                <nav className="space-y-1">
                  {items.map(item => {
                    const iconClass = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveTab(item.name);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium transition-all duration-200 group relative ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-50 to-white text-slate-900 font-semibold border-l-4 border-[#F59E0B] shadow-sm' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 border-l-4 border-transparent'
                        }`}
                      >
                        <i className={`bi ${iconClass} text-sm shrink-0 transition-all duration-200 ${isActive ? 'text-[#F59E0B] scale-110' : 'text-slate-400 group-hover:scale-110 group-hover:text-slate-600'}`}></i>
                        <span className="relative">{item.name}</span>
                        {isActive && (
                          <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer (Clock, active user email) */}
        <div className="p-4 border-t border-slate-200/60 bg-gradient-to-r from-slate-50 to-white space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
              {apiStatus === 'connected' ? 'Live Synced' : apiStatus === 'degraded' ? 'Partial Sync' : 'Offline'}
            </span>
            <span className="font-bold flex items-center gap-1 text-slate-700">
              <i className="bi bi-clock text-[#F59E0B]"></i> {currentTime}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-50 text-[#F59E0B] rounded-lg flex items-center justify-center text-xs font-bold font-mono border border-amber-200">
              MC
            </div>
            <div className="overflow-hidden flex-1">
              <span className="block text-[10px] font-bold text-slate-800 truncate">{currentUserEmail}</span>
              <span className="block text-[9px] text-slate-400">{activeRole}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
              title="Logout"
            >
              <i className="bi bi-box-arrow-right text-sm"></i>
            </button>
          </div>
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 p-2 text-center text-[10px] text-slate-500 font-mono rounded-lg">
            <span className="text-[#F59E0B] font-bold">V.2.4.0</span> Stable
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200/60 px-6 py-4 flex items-center justify-between shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-xl border border-slate-200 transition-all"
            >
              <i className="bi bi-list text-lg"></i>
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">
                {activeTab}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Bethel Baptist Church Governance & Ministry Hub
              </span>
            </div>
          </div>

          {/* Role Based Access Switcher Component - PROACTIVE SELECTION */}
          <div className="flex items-center gap-3">
            {/* Mobile simplified badge */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-700 flex items-center gap-1 shadow-sm">
              <i className="bi bi-crown-fill text-sm text-amber-500"></i> {activeRole}
            </div>
          </div>
        </header>

        {/* Core dynamic Content Panels based on Active Navigation Tab */}
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
            />
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

    </div>
  );
}
