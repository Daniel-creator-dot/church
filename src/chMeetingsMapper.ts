import {
  Household, Fund, PledgeCampaign, Pledge, VolunteerRole, VolunteerAssignment,
  Song, WorshipPlan, WorshipPlanItem, Communication, CustomForm, CheckInRecord, FinanceTransaction, ChurchEvent
} from './types';

export function dbHouseholdToFrontend(db: any): Household {
  return {
    id: `HH-${db.id}`,
    name: db.name,
    address: db.address || '',
    primaryMemberId: db.primary_member_id ? `M-${db.primary_member_id}` : undefined,
    primaryMemberName: db.primary_member_name || '',
    memberCount: parseInt(db.member_count) || 0,
  };
}

export function dbFundToFrontend(db: any): Fund {
  return {
    id: `FND-${db.id}`,
    name: db.name,
    description: db.description || '',
    goalAmount: parseFloat(db.goal_amount) || 0,
    raisedAmount: parseFloat(db.raised_amount) || 0,
    isActive: db.is_active !== false,
  };
}

export function dbCampaignToFrontend(db: any): PledgeCampaign {
  return {
    id: `PC-${db.id}`,
    name: db.name,
    description: db.description || '',
    goalAmount: parseFloat(db.goal_amount) || 0,
    startDate: db.start_date?.split('T')[0] || '',
    endDate: db.end_date?.split('T')[0] || '',
    fundId: db.fund_id ? `FND-${db.fund_id}` : undefined,
    fundName: db.fund_name || '',
    totalPledged: parseFloat(db.total_pledged) || 0,
    totalFulfilled: parseFloat(db.total_fulfilled) || 0,
  };
}

export function dbPledgeToFrontend(db: any): Pledge {
  return {
    id: `PL-${db.id}`,
    campaignId: `PC-${db.campaign_id}`,
    campaignName: db.campaign_name || '',
    memberId: db.member_id ? `M-${db.member_id}` : undefined,
    memberName: db.member_name || '',
    pledgorName: db.pledgor_name || db.member_name || '',
    pledgedAmount: parseFloat(db.pledged_amount) || 0,
    fulfilledAmount: parseFloat(db.fulfilled_amount) || 0,
    frequency: db.frequency || 'one-time',
  };
}

export function dbVolunteerRoleToFrontend(db: any): VolunteerRole {
  return {
    id: `VR-${db.id}`,
    name: db.name,
    description: db.description || '',
    ministryId: db.ministry_id ? `D-${db.ministry_id}` : undefined,
    ministryName: db.ministry_name || '',
  };
}

export function dbVolunteerAssignmentToFrontend(db: any): VolunteerAssignment {
  return {
    id: `VA-${db.id}`,
    eventId: db.event_id ? `E-${db.event_id}` : undefined,
    eventTitle: db.event_title || '',
    memberId: `M-${db.member_id}`,
    memberName: db.member_name || '',
    roleId: db.role_id ? `VR-${db.role_id}` : undefined,
    roleName: db.role_name || '',
    assignmentDate: db.assignment_date?.split('T')[0] || '',
    status: db.status || 'Scheduled',
    notes: db.notes || '',
  };
}

export function dbSongToFrontend(db: any): Song {
  return {
    id: `SONG-${db.id}`,
    title: db.title,
    artist: db.artist || '',
    key: db.song_key || '',
    theme: db.theme || '',
    lyrics: db.lyrics || '',
  };
}

export function dbWorshipPlanItemToFrontend(item: any): WorshipPlanItem {
  return {
    id: `WPI-${item.id}`,
    itemType: item.item_type,
    title: item.title,
    songId: item.song_id ? `SONG-${item.song_id}` : undefined,
    songTitle: item.song_title || '',
    durationMinutes: item.duration_minutes,
    assignedTo: item.assigned_to || '',
    sortOrder: item.sort_order || 0,
    notes: item.notes || '',
  };
}

export function frontendWorshipItemToDb(item: Partial<WorshipPlanItem>): any {
  let songId = null;
  if (item.songId?.startsWith('SONG-')) songId = parseInt(item.songId.replace('SONG-', ''));
  return {
    item_type: item.itemType,
    title: item.title,
    song_id: songId,
    duration_minutes: item.durationMinutes,
    assigned_to: item.assignedTo,
    notes: item.notes,
    sort_order: item.sortOrder,
  };
}

export function dbWorshipPlanToFrontend(db: any): WorshipPlan {
  return {
    id: `WP-${db.id}`,
    title: db.title,
    serviceDate: db.service_date?.split('T')[0] || '',
    serviceType: db.service_type || 'Sunday Service',
    notes: db.notes || '',
    items: db.items?.map((item: any) => dbWorshipPlanItemToFrontend(item)),
  };
}

export function dbCommunicationToFrontend(db: any): Communication {
  return {
    id: `COM-${db.id}`,
    subject: db.subject,
    body: db.body || '',
    channel: db.channel || 'email',
    targetGroup: db.target_group || 'all',
    ministryName: db.ministry_name || '',
    status: db.status || 'Sent',
    sentAt: db.sent_at || '',
    sentBy: db.sent_by || '',
  };
}

export function dbFormToFrontend(db: any): CustomForm {
  const fields = typeof db.fields === 'string' ? JSON.parse(db.fields) : (db.fields || []);
  return {
    id: `FORM-${db.id}`,
    title: db.title,
    description: db.description || '',
    fields,
    isPublic: db.is_public || false,
    isAnonymous: db.is_anonymous || false,
  };
}

export function dbCheckInToFrontend(db: any): CheckInRecord {
  return {
    id: `CI-${db.id}`,
    eventId: `E-${db.event_id}`,
    eventTitle: db.event_title || '',
    memberId: `M-${db.member_id}`,
    memberName: db.member_name || '',
    email: db.email || '',
    checkinTime: db.checkin_time || '',
    checkoutTime: db.checkout_time || undefined,
    familyTag: db.family_tag || '',
  };
}

export function dbFinanceToFrontend(db: any): FinanceTransaction {
  return {
    id: `FT-${db.id}`,
    date: db.transaction_date?.split('T')[0] || '',
    type: db.type as 'Income' | 'Expense',
    category: db.category || '',
    amount: parseFloat(db.amount) || 0,
    description: db.description || '',
    approvedBy: db.approved_by || '',
  };
}

export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export function getEventsForDate(events: ChurchEvent[], dateStr: string): ChurchEvent[] {
  return events.filter(e => e.date === dateStr);
}
