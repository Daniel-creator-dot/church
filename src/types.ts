/**
 * Types & Interfaces for Bethel Baptist Church Web Application
 */

export type Role = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Pastor' 
  | 'Church Administrator' 
  | 'Finance Officer' 
  | 'Department Leader' 
  | 'Media' 
  | 'Member';

export type MembershipStatus = 'Active' | 'Inactive' | 'Under Discipline';
export type BaptismStatus = 'Baptized' | 'Not Baptized';

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  familyGroup: string;
  department: string; // e.g. "Choir", "Ushers", "None"
  birthday: string; // YYYY-MM-DD
  baptismStatus: BaptismStatus;
  membershipStatus: MembershipStatus;
  joinDate: string; // YYYY-MM-DD
}

export type VisitorStatus = 'New' | 'Contacted' | 'In Progress' | 'Converted' | 'Lost';

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  email: string;
  visitDate: string; // YYYY-MM-DD
  invitedBy: string;
  prayerRequest: string;
  assignedFollowUpOfficer: string;
  status: VisitorStatus;
  followUpNotes: string;
}

export type ServiceType = 'Sunday Service' | 'Midweek Service' | 'Prayer Meeting' | 'Department Meeting' | 'Special Program';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  serviceType: ServiceType;
  headcount: number;
  attendedMemberIds: string[]; // List of member IDs
  notes: string;
}

export type GivingType = 'Tithe' | 'Offering' | 'Seed' | 'Project' | 'Welfare' | 'Thanksgiving';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'Cheque';

export interface GivingRecord {
  id: string;
  memberId?: string; // Optional (anonymous giving possible)
  donorName: string;
  date: string; // YYYY-MM-DD
  type: GivingType;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string; // YYYY-MM-DD
  theme: string;
  bibleVerse: string;
  notes: string; // Sermon content/points
  videoUrl?: string;
  audioUrl?: string;
}

export type EventCategory = 'Crusade' | 'Prayer Meeting' | 'Conference' | 'Wedding' | 'Funeral' | 'Retreat' | 'Special';

export interface ChurchEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  category: EventCategory;
  description: string;
  rsvps: string[]; // Array of names or emails
}

export type DepartmentName = 
  | 'Choir' 
  | 'Ushers' 
  | 'Media' 
  | 'Prayer Team' 
  | 'Protocol' 
  | 'Children Ministry' 
  | 'Welfare' 
  | 'Evangelism';

export interface Department {
  id: string;
  name: DepartmentName;
  leaderName: string; // Leader Name
  leaderId: string; // Member ID of leader
  membersCount: number;
  meetingSchedule: string;
  budget: number;
  spent: number;
  reports: { date: string; content: string }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  category: 'General' | 'Youth' | 'Men' | 'Women' | 'Department';
  status: 'Draft' | 'Published';
}

export type PrayerRequestStatus = 'Pending' | 'Prayed For' | 'Followed Up';
export type PrayerCategory = 'General' | 'Healing' | 'Family' | 'Financial' | 'Salvation' | 'Guidance' | 'Thanksgiving';

export interface PrayerRequest {
  id: string;
  submittedBy: string;
  email: string;
  request: string;
  isPrivate: boolean;
  status: PrayerRequestStatus;
  date: string; // YYYY-MM-DD
  notes?: string;
  category?: PrayerCategory;
  prayedCount?: number;
}

export type FollowUpCategory = 'Visitor' | 'Sick Visitation' | 'Inactive Member' | 'Counseling' | 'New Convert' | 'Home Visit';
export type FollowUpStatus = 'Pending' | 'In Progress' | 'Completed';

export interface FollowUpRecord {
  id: string;
  targetPersonId?: number;
  targetPersonName: string;
  category: FollowUpCategory;
  assignedToId?: number;
  assignedToName: string;
  status: FollowUpStatus;
  notes: string;
  dateCreated: string; // YYYY-MM-DD
}

export interface MemberOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status?: string;
}

export interface LeaderOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Devotional {
  date: string; // YYYY-MM-DD
  title: string;
  verse: string;
  reference: string;
  devotionText: string;
  prayerPoints: string[];
  declaration: string;
}

export type MediaAssetType = 'Photo' | 'Flyer' | 'Video' | 'Sermon' | 'Devotional' | 'Testimony';

export interface MediaAsset {
  id: string;
  title: string;
  type: MediaAssetType;
  url: string;
  approved: boolean;
  date: string; // YYYY-MM-DD
  submittedBy?: string;
}

export interface FinanceTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Income' | 'Expense';
  category: string; // e.g. "Tithe", "Offering", "Salaries", "Utilities", "Maintenance", "Welfare"
  amount: number;
  description: string;
  approvedBy: string;
}

export interface Church {
  id: string;
  name: string;
  location: string;
  pastor: string;
  foundedDate: string;
  membersCount: number;
  email: string;
  phone: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  description: string;
  coverUrl: string;
  pages: string[];
}

export interface LiveStream {
  id: string;
  title: string;
  speaker: string;
  date: string;
  time: string;
  status: 'Live' | 'Upcoming' | 'Completed';
  embedUrl: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

// --- ChMeetings-inspired types ---

export interface Household {
  id: string;
  name: string;
  address: string;
  primaryMemberId?: string;
  primaryMemberName?: string;
  memberCount: number;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  isActive: boolean;
}

export interface PledgeCampaign {
  id: string;
  name: string;
  description: string;
  goalAmount: number;
  startDate: string;
  endDate: string;
  fundId?: string;
  fundName?: string;
  totalPledged: number;
  totalFulfilled: number;
}

export interface Pledge {
  id: string;
  campaignId: string;
  campaignName?: string;
  memberId?: string;
  memberName?: string;
  pledgorName: string;
  pledgedAmount: number;
  fulfilledAmount: number;
  frequency: string;
}

export interface VolunteerRole {
  id: string;
  name: string;
  description: string;
  ministryId?: string;
  ministryName?: string;
}

export interface VolunteerAssignment {
  id: string;
  eventId?: string;
  eventTitle?: string;
  memberId: string;
  memberName: string;
  roleId?: string;
  roleName: string;
  assignmentDate: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  theme: string;
  lyrics: string;
}

export interface WorshipPlanItem {
  id?: string;
  itemType: 'song' | 'prayer' | 'sermon' | 'announcement' | 'offering' | 'other';
  title: string;
  songId?: string;
  songTitle?: string;
  durationMinutes?: number;
  assignedTo: string;
  sortOrder: number;
  notes: string;
}

export interface WorshipPlan {
  id: string;
  title: string;
  serviceDate: string;
  serviceType: string;
  notes: string;
  items?: WorshipPlanItem[];
}

export interface Communication {
  id: string;
  subject: string;
  body: string;
  channel: 'email' | 'sms' | 'push';
  targetGroup: string;
  ministryName?: string;
  status: string;
  sentAt: string;
  sentBy: string;
}

export interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: { label: string; type: string; required?: boolean }[];
  isPublic: boolean;
  isAnonymous: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  submitterName: string;
  submitterEmail: string;
  responses: Record<string, string>;
  submittedAt: string;
}

export interface CheckInRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  memberId: string;
  memberName: string;
  email: string;
  checkinTime: string;
  checkoutTime?: string;
  familyTag?: string;
}

// Innovation modules

export interface SmallGroup {
  id: string;
  name: string;
  description: string;
  leaderId?: string;
  leaderName: string;
  meetingDay: string;
  meetingTime: string;
  location: string;
  maxMembers: number;
  isActive: boolean;
  memberCount?: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  email: string;
  phone: string;
  role: string;
  joinedDate: string;
}

export interface GroupMeeting {
  id: string;
  groupId: string;
  meetingDate: string;
  topic: string;
  attendanceCount: number;
  notes: string;
}

export interface DashboardInsights {
  monthlyGiving: number;
  lastMonthGiving: number;
  givingChangePercent: number;
  visitorFunnel: { status: string; count: number }[];
  actionItems: { type: string; label: string; count: number; tab: string }[];
  volunteerSchedule: { assignment_date: string; role_name: string; assigned: number }[];
  attendanceTrend: { date: string; serviceType: string; headcount: number }[];
  atRiskMembers: { id: number; name: string; email: string; phone: string }[];
  upcomingBirthdays: { id: number; name: string; birthday: string }[];
  smallGroups: { total_groups: number; total_members: number };
  topEngaged: { id: number; name: string; checkins: number; recentGiving: number }[];
}

export interface DiscipleshipStep {
  id: string;
  title: string;
  description: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PathwayProgress {
  id: string;
  memberId: string;
  stepId: string;
  stepTitle: string;
  stepDescription: string;
  category: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedDate?: string;
  notes?: string;
}

export interface PathwayOverview {
  id: number;
  name: string;
  completed: number;
  total: number;
}

