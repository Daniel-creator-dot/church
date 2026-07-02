import { Member, ChurchEvent, GivingRecord, FollowUpRecord, MemberOption, LeaderOption, Visitor, AttendanceRecord, Department, Sermon, Announcement, PrayerRequest, Devotional, MediaAsset } from './types';

// Transform database member to frontend member
export function dbMemberToFrontend(dbMember: any): Member {
  return {
    id: `M-${dbMember.id}`,
    name: `${dbMember.first_name} ${dbMember.last_name}`,
    phone: dbMember.phone || '',
    email: dbMember.email || '',
    location: dbMember.address || '',
    familyGroup: 'Default', // DB doesn't have this field yet
    department: 'None', // DB doesn't have this field yet
    birthday: dbMember.date_of_birth || '',
    baptismStatus: 'Not Baptized', // DB doesn't have this field yet
    membershipStatus: dbMember.status === 'active' ? 'Active' : 'Inactive',
    joinDate: dbMember.membership_date?.split('T')[0] || ''
  };
}

// Transform frontend member to database member
export function frontendMemberToDb(member: Member): any {
  const nameParts = member.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return {
    first_name: firstName,
    last_name: lastName,
    email: member.email,
    phone: member.phone,
    address: member.location,
    date_of_birth: member.birthday,
    status: member.membershipStatus === 'Active' ? 'active' : 'inactive'
  };
}

// Transform database visitor to frontend visitor
export function dbVisitorToFrontend(dbVisitor: any): Visitor {
  return {
    id: `V-${dbVisitor.id}`,
    name: dbVisitor.name || '',
    phone: dbVisitor.phone || '',
    email: dbVisitor.email || '',
    visitDate: dbVisitor.visit_date?.split('T')[0] || '',
    invitedBy: dbVisitor.invited_by || '',
    prayerRequest: dbVisitor.prayer_request || '',
    assignedFollowUpOfficer: dbVisitor.assigned_follow_up_officer || '',
    status: (dbVisitor.status as any) || 'New',
    followUpNotes: dbVisitor.follow_up_notes || '',
  };
}

// Transform frontend visitor to database visitor
export function frontendVisitorToDb(visitor: Visitor): any {
  return {
    name: visitor.name,
    phone: visitor.phone,
    email: visitor.email,
    visit_date: visitor.visitDate,
    invited_by: visitor.invitedBy,
    prayer_request: visitor.prayerRequest,
    assigned_follow_up_officer: visitor.assignedFollowUpOfficer,
    status: visitor.status,
    follow_up_notes: visitor.followUpNotes,
  };
}

// Transform database event to frontend event
export function dbEventToFrontend(dbEvent: any): ChurchEvent {
  return {
    id: `E-${dbEvent.id}`,
    title: dbEvent.title,
    date: dbEvent.event_date,
    time: dbEvent.event_time || '00:00',
    location: dbEvent.location || '',
    category: 'Special',
    description: dbEvent.description || '',
    rsvps: dbEvent.rsvp_emails || []
  };
}

// Transform frontend event to database event
export function frontendEventToDb(event: ChurchEvent): any {
  return {
    title: event.title,
    description: event.description,
    event_date: event.date,
    event_time: event.time,
    location: event.location,
    capacity: null // DB has this but frontend doesn't
  };
}

// Transform database donation to frontend giving record
export function dbDonationToFrontend(dbDonation: any): GivingRecord {
  return {
    id: `G-${dbDonation.id}`,
    memberId: dbDonation.member_id ? `M-${dbDonation.member_id}` : undefined,
    donorName: dbDonation.first_name ? `${dbDonation.first_name} ${dbDonation.last_name}` : 'Anonymous',
    date: dbDonation.donation_date?.split('T')[0] || '',
    type: mapDonationType(dbDonation.donation_type),
    amount: parseFloat(dbDonation.amount),
    paymentMethod: 'Card', // DB doesn't have this field yet
    receiptNumber: `REC-${dbDonation.id}`
  };
}

// Transform frontend giving record to database donation
export function frontendGivingToDb(giving: GivingRecord): any {
  let memberId = null;
  if (giving.memberId && giving.memberId.startsWith('M-')) {
    memberId = parseInt(giving.memberId.replace('M-', ''));
  }
  
  return {
    member_id: memberId,
    amount: giving.amount,
    donation_type: mapFrontendDonationType(giving.type),
    notes: giving.receiptNumber || ''
  };
}

// Transform database follow-up to frontend follow-up
export function dbFollowUpToFrontend(dbFollowUp: any): FollowUpRecord {
  return {
    id: `F-${dbFollowUp.id}`,
    targetPersonId: dbFollowUp.target_person_id,
    targetPersonName: dbFollowUp.target_person_name,
    category: mapFollowUpCategory(dbFollowUp.category),
    assignedToId: dbFollowUp.assigned_to_id,
    assignedToName: dbFollowUp.assigned_to_name,
    status: mapFollowUpStatus(dbFollowUp.status),
    notes: dbFollowUp.notes || '',
    dateCreated: dbFollowUp.created_at?.split('T')[0] || ''
  };
}

// Transform frontend follow-up to database follow-up
export function frontendFollowUpToDb(followUp: FollowUpRecord): any {
  return {
    target_person_id: followUp.targetPersonId,
    target_person_name: followUp.targetPersonName,
    category: mapFrontendFollowUpCategory(followUp.category),
    assigned_to_id: followUp.assignedToId,
    assigned_to_name: followUp.assignedToName,
    status: mapFrontendFollowUpStatus(followUp.status),
    notes: followUp.notes
  };
}

// Transform database member to member option
export function dbMemberToOption(dbMember: any): MemberOption {
  return {
    id: dbMember.id,
    first_name: dbMember.first_name,
    last_name: dbMember.last_name,
    email: dbMember.email,
    status: dbMember.status
  };
}

// Transform database leader to leader option
export function dbLeaderToOption(dbLeader: any): LeaderOption {
  return {
    id: dbLeader.id,
    first_name: dbLeader.first_name,
    last_name: dbLeader.last_name,
    email: dbLeader.email
  };
}

// Helper: Map donation types
function mapDonationType(dbType: string | null): any {
  const typeMap: { [key: string]: any } = {
    'tithe': 'Tithe',
    'offering': 'Offering',
    'seed': 'Seed',
    'project': 'Project',
    'welfare': 'Welfare',
    'thanksgiving': 'Thanksgiving'
  };
  return typeMap[dbType || ''] || 'Offering';
}

function mapFrontendDonationType(frontendType: any): string {
  const typeMap: { [key: string]: string } = {
    'Tithe': 'tithe',
    'Offering': 'offering',
    'Seed': 'seed',
    'Project': 'project',
    'Welfare': 'welfare',
    'Thanksgiving': 'thanksgiving'
  };
  return typeMap[frontendType] || 'offering';
}

// Helper: Map follow-up categories
function mapFollowUpCategory(dbCategory: string): any {
  const categoryMap: { [key: string]: any } = {
    'visitor': 'Visitor',
    'sick visitation': 'Sick Visitation',
    'inactive member': 'Inactive Member',
    'counseling': 'Counseling',
    'new convert': 'New Convert',
    'home visit': 'Home Visit'
  };
  return categoryMap[dbCategory?.toLowerCase() || ''] || 'Visitor';
}

function mapFrontendFollowUpCategory(frontendCategory: any): string {
  const categoryMap: { [key: string]: string } = {
    'Visitor': 'Visitor',
    'Sick Visitation': 'Sick Visitation',
    'Inactive Member': 'Inactive Member',
    'Counseling': 'Counseling',
    'New Convert': 'New Convert',
    'Home Visit': 'Home Visit'
  };
  return categoryMap[frontendCategory] || 'Visitor';
}

// Helper: Map follow-up status
function mapFollowUpStatus(dbStatus: string): any {
  const statusMap: { [key: string]: any } = {
    'pending': 'Pending',
    'in progress': 'In Progress',
    'completed': 'Completed'
  };
  return statusMap[dbStatus?.toLowerCase() || ''] || 'Pending';
}

function mapFrontendFollowUpStatus(frontendStatus: any): string {
  const statusMap: { [key: string]: string } = {
    'Pending': 'Pending',
    'In Progress': 'In Progress',
    'Completed': 'Completed'
  };
  return statusMap[frontendStatus] || 'Pending';
}

// Transform database attendance to frontend attendance record
export function dbAttendanceToFrontend(dbAttendance: any): AttendanceRecord {
  return {
    id: `A-${dbAttendance.id}`,
    date: dbAttendance.service_date?.split('T')[0] || '',
    serviceType: mapServiceType(dbAttendance.service_type),
    headcount: dbAttendance.headcount || 0,
    attendedMemberIds: dbAttendance.attended_member_ids || [],
    notes: dbAttendance.notes || ''
  };
}

// Transform frontend attendance to database attendance
export function frontendAttendanceToDb(attendance: AttendanceRecord): any {
  return {
    service_date: attendance.date,
    service_type: mapFrontendServiceType(attendance.serviceType),
    headcount: attendance.headcount,
    attended_member_ids: attendance.attendedMemberIds,
    notes: attendance.notes
  };
}

// Helper: Map service types
function mapServiceType(dbType: string | null): any {
  const typeMap: { [key: string]: any } = {
    'sunday service': 'Sunday Service',
    'midweek service': 'Midweek Service',
    'prayer meeting': 'Prayer Meeting',
    'department meeting': 'Department Meeting',
    'special program': 'Special Program'
  };
  return typeMap[dbType?.toLowerCase() || ''] || 'Sunday Service';
}

function mapFrontendServiceType(frontendType: any): string {
  const typeMap: { [key: string]: string } = {
    'Sunday Service': 'sunday service',
    'Midweek Service': 'midweek service',
    'Prayer Meeting': 'prayer meeting',
    'Department Meeting': 'department meeting',
    'Special Program': 'special program'
  };
  return typeMap[frontendType] || 'sunday service';
}

export function dbMinistryToFrontend(dbMinistry: any): Department {
  return {
    id: `D-${dbMinistry.id}`,
    name: dbMinistry.name as Department['name'],
    leaderName: dbMinistry.leader_name || 'Vacant',
    leaderId: dbMinistry.leader_id ? `M-${dbMinistry.leader_id}` : '',
    membersCount: parseInt(dbMinistry.member_count) || 0,
    meetingSchedule: dbMinistry.description || '',
    budget: 0,
    spent: 0,
    reports: []
  };
}

export function frontendDepartmentToDb(dept: Department): any {
  let leaderId = null;
  if (dept.leaderId && dept.leaderId.startsWith('M-')) {
    leaderId = parseInt(dept.leaderId.replace('M-', ''));
  }
  return {
    name: dept.name,
    description: dept.meetingSchedule,
    leader_id: leaderId
  };
}

export function dbSermonToFrontend(db: any): Sermon {
  return {
    id: `S-${db.id}`,
    title: db.title,
    speaker: db.speaker || '',
    date: db.sermon_date?.split('T')[0] || '',
    theme: db.theme || '',
    bibleVerse: db.bible_verse || '',
    notes: db.notes || '',
    videoUrl: db.video_url || undefined,
    audioUrl: db.audio_url || undefined
  };
}

export function frontendSermonToDb(sermon: Sermon): any {
  return {
    title: sermon.title,
    speaker: sermon.speaker,
    sermon_date: sermon.date,
    theme: sermon.theme,
    bible_verse: sermon.bibleVerse,
    notes: sermon.notes,
    video_url: sermon.videoUrl,
    audio_url: sermon.audioUrl
  };
}

export function dbAnnouncementToFrontend(db: any): Announcement {
  return {
    id: `ANN-${db.id}`,
    title: db.title,
    content: db.content || '',
    date: db.announcement_date?.split('T')[0] || '',
    category: db.category || 'General',
    status: db.status || 'Published'
  };
}

export function frontendAnnouncementToDb(ann: Announcement): any {
  return {
    title: ann.title,
    content: ann.content,
    announcement_date: ann.date,
    category: ann.category,
    status: ann.status
  };
}

export function dbPrayerToFrontend(db: any): PrayerRequest {
  return {
    id: `PR-${db.id}`,
    submittedBy: db.submitted_by || '',
    email: db.email || '',
    request: db.request || '',
    isPrivate: db.is_private || false,
    status: db.status || 'Pending',
    date: db.request_date?.split('T')[0] || '',
    notes: db.notes || ''
  };
}

export function frontendPrayerToDb(prayer: PrayerRequest): any {
  return {
    submitted_by: prayer.submittedBy,
    email: prayer.email,
    request: prayer.request,
    is_private: prayer.isPrivate,
    status: prayer.status,
    request_date: prayer.date,
    notes: prayer.notes
  };
}

export function dbDevotionalToFrontend(db: any): Devotional {
  return {
    date: db.devotional_date?.split('T')[0] || '',
    title: db.title,
    verse: db.scripture || '',
    reference: db.author || '',
    devotionText: db.content || '',
    prayerPoints: [],
    declaration: ''
  };
}

export function frontendDevotionalToDb(dev: Devotional): any {
  return {
    title: dev.title,
    content: dev.devotionText,
    devotional_date: dev.date,
    scripture: dev.verse || dev.reference,
    author: dev.reference
  };
}

export function dbMediaToFrontend(db: any): MediaAsset {
  return {
    id: `MED-${db.id}`,
    title: db.title,
    type: (db.media_type || 'Photo') as MediaAsset['type'],
    url: db.url || '',
    approved: true,
    date: db.upload_date?.split('T')[0] || '',
    submittedBy: db.description || undefined
  };
}

export function frontendMediaToDb(media: MediaAsset): any {
  return {
    title: media.title,
    media_type: media.type,
    url: media.url,
    description: media.submittedBy || '',
    upload_date: media.date
  };
}
