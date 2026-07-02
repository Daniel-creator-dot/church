import { SmallGroup, GroupMember, GroupMeeting } from './types';

export function dbGroupToFrontend(db: any): SmallGroup {
  return {
    id: String(db.id),
    name: db.name,
    description: db.description || '',
    leaderId: db.leader_id ? String(db.leader_id) : undefined,
    leaderName: db.leader_name || '',
    meetingDay: db.meeting_day || '',
    meetingTime: db.meeting_time || '',
    location: db.location || '',
    maxMembers: db.max_members || 12,
    isActive: db.is_active !== false,
    memberCount: db.member_count,
  };
}

export function frontendGroupToDb(group: Partial<SmallGroup>): any {
  return {
    name: group.name,
    description: group.description,
    leader_id: group.leaderId ? parseInt(group.leaderId, 10) : null,
    leader_name: group.leaderName,
    meeting_day: group.meetingDay,
    meeting_time: group.meetingTime,
    location: group.location,
    max_members: group.maxMembers,
    is_active: group.isActive,
  };
}

export function dbGroupMemberToFrontend(db: any): GroupMember {
  return {
    id: String(db.id),
    groupId: String(db.group_id),
    memberId: String(db.member_id),
    memberName: `${db.first_name || ''} ${db.last_name || ''}`.trim(),
    email: db.email || '',
    phone: db.phone || '',
    role: db.role || 'Member',
    joinedDate: db.joined_date?.split('T')[0] || '',
  };
}

export function dbGroupMeetingToFrontend(db: any): GroupMeeting {
  return {
    id: String(db.id),
    groupId: String(db.group_id),
    meetingDate: db.meeting_date?.split('T')[0] || '',
    topic: db.topic || '',
    attendanceCount: db.attendance_count || 0,
    notes: db.notes || '',
  };
}
