import { SmallGroup, GroupMember, GroupMeeting, Book, LiveStream, DiscipleshipStep, PathwayProgress } from './types';

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

export function dbBookToFrontend(db: any): Book {
  const pages = Array.isArray(db.pages) ? db.pages : (typeof db.pages === 'string' ? JSON.parse(db.pages) : []);
  return {
    id: `BK-${db.id}`,
    title: db.title,
    author: db.author || '',
    price: parseFloat(db.price) || 0,
    description: db.description || '',
    coverUrl: db.cover_url || '',
    pages: pages.map((p: string, i: number) => p.startsWith('Page') ? p : `Page ${i + 1}:\n\n${p}`),
  };
}

export function frontendBookToDb(book: Partial<Book>): any {
  return {
    title: book.title,
    author: book.author,
    price: book.price,
    description: book.description,
    cover_url: book.coverUrl,
    pages: book.pages || [],
  };
}

export function dbLiveStreamToFrontend(db: any): LiveStream {
  return {
    id: `LS-${db.id}`,
    title: db.title,
    speaker: db.speaker || '',
    date: db.stream_date?.split('T')[0] || '',
    time: db.stream_time || '',
    status: db.status || 'Upcoming',
    embedUrl: db.embed_url || '',
    description: db.description || '',
  };
}

export function frontendLiveStreamToDb(stream: Partial<LiveStream>): any {
  return {
    title: stream.title,
    speaker: stream.speaker,
    stream_date: stream.date,
    stream_time: stream.time,
    status: stream.status,
    embed_url: stream.embedUrl,
    description: stream.description,
  };
}

export function dbDiscipleshipStepToFrontend(db: any): DiscipleshipStep {
  return {
    id: String(db.id),
    title: db.title,
    description: db.description || '',
    category: db.category || 'New Convert',
    sortOrder: db.sort_order || 0,
    isActive: db.is_active !== false,
  };
}

export function dbPathwayProgressToFrontend(db: any): PathwayProgress {
  return {
    id: String(db.id),
    memberId: String(db.member_id),
    stepId: String(db.step_id),
    stepTitle: db.title || '',
    stepDescription: db.description || '',
    category: db.category || '',
    status: db.status || 'Pending',
    completedDate: db.completed_date?.split('T')[0],
    notes: db.notes || '',
  };
}
