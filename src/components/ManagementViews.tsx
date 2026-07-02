import React, { useState } from 'react';
import { membersApi, visitorsApi, attendanceApi, followupsApi, ministriesApi } from '../api';
import { frontendMemberToDb, frontendVisitorToDb, frontendAttendanceToDb, dbAttendanceToFrontend, frontendFollowUpToDb, dbFollowUpToFrontend, frontendDepartmentToDb, dbMinistryToFrontend } from '../dataMapper';
import { getTodayString } from '../utils/date';
import { 
  Member, 
  Visitor, 
  AttendanceRecord, 
  Department, 
  FollowUpRecord, 
  Role,
  MembershipStatus,
  BaptismStatus,
  VisitorStatus,
  ServiceType,
  FollowUpCategory,
  FollowUpStatus,
  DepartmentName,
  MemberOption,
  LeaderOption
} from '../types';

interface ManagementViewsProps {
  activeSubView: 'Members' | 'Visitors' | 'Attendance' | 'Departments' | 'Follow Up';
  activeRole: Role;
  
  members: Member[];
  onUpdateMembers: (newMembers: Member[]) => void;
  
  visitors: Visitor[];
  onUpdateVisitors: (newVisitors: Visitor[]) => void;
  
  attendance: AttendanceRecord[];
  onUpdateAttendance: (newAttendance: AttendanceRecord[]) => void;
  
  departments: Department[];
  onUpdateDepartments: (newDepts: Department[]) => void;
  
  followUps: FollowUpRecord[];
  onUpdateFollowUps: (newFollowUps: FollowUpRecord[]) => void;
  
  memberOptions: MemberOption[];
  leaderOptions: LeaderOption[];
}

export default function ManagementViews({
  activeSubView,
  activeRole,
  members,
  onUpdateMembers,
  visitors,
  onUpdateVisitors,
  attendance,
  onUpdateAttendance,
  departments,
  onUpdateDepartments,
  followUps,
  onUpdateFollowUps,
  memberOptions,
  leaderOptions
}: ManagementViewsProps) {
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  // Modals / Form States
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showDeptReportForm, setShowDeptReportForm] = useState<string | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState<DepartmentName>('Choir');
  const [newDepartmentLeaderId, setNewDepartmentLeaderId] = useState('');
  const [newDepartmentLeaderName, setNewDepartmentLeaderName] = useState('');
  const [newDepartmentMeetingSchedule, setNewDepartmentMeetingSchedule] = useState('Sunday 8:00 AM');
  const [visitorLink, setVisitorLink] = useState('');

  // Edit target states
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editVisitorId, setEditVisitorId] = useState<string | null>(null);

  // Department report state
  const [newDeptReport, setNewDeptReport] = useState('');

  // Individual Form Fields
  // Members Form Fields
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberLocation, setMemberLocation] = useState('');
  const [memberGroup, setMemberGroup] = useState('');
  const [memberDept, setMemberDept] = useState('None');
  const [memberBirthday, setMemberBirthday] = useState('1995-01-01');
  const [memberBaptism, setMemberBaptism] = useState<BaptismStatus>('Not Baptized');
  const [memberStatus, setMemberStatus] = useState<MembershipStatus>('Active');

  // Visitor Form Fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorInvitedBy, setVisitorInvitedBy] = useState('');
  const [visitorRequest, setVisitorRequest] = useState('');
  const [visitorOfficer, setVisitorOfficer] = useState('');
  const [visitorStatus, setVisitorStatus] = useState<VisitorStatus>('New');
  const [visitorNotes, setVisitorNotes] = useState('');

  // Attendance Form Fields
  const [attendanceDate, setAttendanceDate] = useState(getTodayString());
  const [attendanceService, setAttendanceService] = useState<ServiceType>('Sunday Service');
  const [attendanceHeadcount, setAttendanceHeadcount] = useState(100);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [selectedAttendants, setSelectedAttendants] = useState<string[]>([]);

  // Follow-up Form Fields
  const [followTargetId, setFollowTargetId] = useState<number | null>(null);
  const [followTargetName, setFollowTargetName] = useState('');
  const [followType, setFollowType] = useState<FollowUpCategory>('Visitor');
  const [followAssignedId, setFollowAssignedId] = useState<number | null>(null);
  const [followAssignedName, setFollowAssignedName] = useState('');
  const [followNotes, setFollowNotes] = useState('');

  // Reset helper functions
  const resetMemberForm = () => {
    setMemberName('');
    setMemberPhone('');
    setMemberEmail('');
    setMemberLocation('');
    setMemberGroup('');
    setMemberDept('None');
    setMemberBirthday('1995-01-01');
    setMemberBaptism('Not Baptized');
    setMemberStatus('Active');
    setEditMemberId(null);
    setShowMemberForm(false);
  };

  const handleEditMember = (member: Member) => {
    setEditMemberId(member.id);
    setMemberName(member.name);
    setMemberPhone(member.phone);
    setMemberEmail(member.email);
    setMemberLocation(member.location);
    setMemberGroup(member.familyGroup);
    setMemberDept(member.department);
    setMemberBirthday(member.birthday || '1995-01-01');
    setMemberBaptism(member.baptismStatus);
    setMemberStatus(member.membershipStatus);
    setShowMemberForm(true);
  };

  const resetVisitorForm = () => {
    setVisitorName('');
    setVisitorPhone('');
    setVisitorEmail('');
    setVisitorInvitedBy('');
    setVisitorRequest('');
    setVisitorOfficer('');
    setVisitorStatus('New');
    setVisitorNotes('');
    setEditVisitorId(null);
    setShowVisitorForm(false);
  };

  const resetAttendanceForm = () => {
    setAttendanceDate(getTodayString());
    setAttendanceService('Sunday Service');
    setAttendanceHeadcount(100);
    setAttendanceNotes('');
    setSelectedAttendants([]);
    setShowAttendanceForm(false);
  };

  const resetFollowUpForm = () => {
    setFollowTargetId(null);
    setFollowTargetName('');
    setFollowType('Visitor');
    setFollowAssignedId(null);
    setFollowAssignedName('');
    setFollowNotes('');
    setShowFollowUpForm(false);
  };

  const resetDepartmentForm = () => {
    setNewDepartmentName('Choir');
    setNewDepartmentLeaderId('');
    setNewDepartmentLeaderName('');
    setNewDepartmentMeetingSchedule('Sunday 8:00 AM');
    setShowDeptForm(false);
  };

  // HANDLERS
  
  // Create / Edit Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName) return;

    try {
      if (editMemberId) {
        const updatedMember = await membersApi.update(parseInt(editMemberId.replace('M-', '')), {
          ...frontendMemberToDb({
            id: editMemberId,
            name: memberName,
            phone: memberPhone,
            email: memberEmail,
            location: memberLocation,
            familyGroup: memberGroup,
            department: memberDept,
            birthday: memberBirthday,
            baptismStatus: memberBaptism,
            membershipStatus: memberStatus,
            joinDate: members.find(m => m.id === editMemberId)?.joinDate || new Date().toISOString().split('T')[0],
          }),
          date_of_birth: memberBirthday,
          status: memberStatus === 'Active' ? 'active' : 'inactive',
        });

        const refreshed = members.map(m => m.id === editMemberId ? {
          ...m,
          name: memberName,
          phone: memberPhone,
          email: memberEmail,
          location: memberLocation,
          familyGroup: memberGroup,
          department: memberDept,
          birthday: memberBirthday,
          baptismStatus: memberBaptism,
          membershipStatus: memberStatus,
        } : m);
        onUpdateMembers(refreshed);
      } else {
        const createdMember = await membersApi.create({
          ...frontendMemberToDb({
            id: '',
            name: memberName,
            phone: memberPhone,
            email: memberEmail,
            location: memberLocation,
            familyGroup: memberGroup,
            department: memberDept,
            birthday: memberBirthday,
            baptismStatus: memberBaptism,
            membershipStatus: memberStatus,
            joinDate: new Date().toISOString().split('T')[0],
          }),
          date_of_birth: memberBirthday,
          status: memberStatus === 'Active' ? 'active' : 'inactive',
        });

        const newMember: Member = {
          id: `M-${createdMember.id}`,
          name: `${createdMember.first_name} ${createdMember.last_name}`,
          phone: createdMember.phone || '',
          email: createdMember.email || '',
          location: createdMember.address || '',
          familyGroup: memberGroup,
          department: memberDept,
          birthday: memberBirthday,
          baptismStatus: memberBaptism,
          membershipStatus: memberStatus,
          joinDate: createdMember.membership_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        };
        onUpdateMembers([newMember, ...members]);
      }
      resetMemberForm();
    } catch (error) {
      console.error('Failed to save member', error);
    }
  };

  // Create / Edit Visitor
  const handleSaveVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName) return;

    try {
      const payload = {
        ...frontendVisitorToDb({
          id: editVisitorId || '',
          name: visitorName,
          phone: visitorPhone,
          email: visitorEmail,
          visitDate: new Date().toISOString().split('T')[0],
          invitedBy: visitorInvitedBy,
          prayerRequest: visitorRequest,
          assignedFollowUpOfficer: visitorOfficer,
          status: visitorStatus,
          followUpNotes: visitorNotes,
        }),
        visit_date: new Date().toISOString().split('T')[0],
      };

      const savedVisitor = editVisitorId
        ? await visitorsApi.update(parseInt(editVisitorId.replace('V-', '')), payload)
        : await visitorsApi.create(payload);

      const newVisitor: Visitor = {
        id: `V-${savedVisitor.id}`,
        name: savedVisitor.name || visitorName,
        phone: savedVisitor.phone || visitorPhone,
        email: savedVisitor.email || visitorEmail,
        visitDate: savedVisitor.visit_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        invitedBy: savedVisitor.invited_by || visitorInvitedBy,
        prayerRequest: savedVisitor.prayer_request || visitorRequest,
        assignedFollowUpOfficer: savedVisitor.assigned_follow_up_officer || visitorOfficer,
        status: savedVisitor.status || visitorStatus,
        followUpNotes: savedVisitor.follow_up_notes || visitorNotes,
      };

      if (editVisitorId) {
        onUpdateVisitors(visitors.map(v => v.id === editVisitorId ? newVisitor : v));
      } else {
        onUpdateVisitors([newVisitor, ...visitors]);
      }
      resetVisitorForm();
    } catch (error) {
      console.error('Failed to save visitor', error);
    }
  };

  // Create Attendance Record
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const saved = await attendanceApi.create(frontendAttendanceToDb({
        id: '',
        date: attendanceDate,
        serviceType: attendanceService,
        headcount: attendanceHeadcount,
        attendedMemberIds: selectedAttendants,
        notes: attendanceNotes
      }));
      const newRecord = dbAttendanceToFrontend(saved);
      onUpdateAttendance([newRecord, ...attendance]);
      resetAttendanceForm();
    } catch (error) {
      console.error('Failed to save attendance', error);
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followTargetName) return;

    try {
      const saved = await followupsApi.create(frontendFollowUpToDb({
        id: '',
        targetPersonId: followTargetId,
        targetPersonName: followTargetName,
        category: followType,
        assignedToId: followAssignedId,
        assignedToName: followAssignedName || 'Unassigned',
        status: 'Pending',
        notes: followNotes,
        dateCreated: getTodayString()
      }));
      const newRecord = dbFollowUpToFrontend(saved);
      onUpdateFollowUps([newRecord, ...followUps]);
      resetFollowUpForm();
    } catch (error) {
      console.error('Failed to save follow-up', error);
    }
  };

  const handleToggleFollowUpStatus = async (f: FollowUpRecord) => {
    const nextStatus: FollowUpStatus = 
      f.status === 'Pending' ? 'In Progress' : 
      f.status === 'In Progress' ? 'Completed' : 'Pending';

    try {
      const dbId = parseInt(f.id.replace('F-', ''));
      const saved = await followupsApi.update(dbId, frontendFollowUpToDb({ ...f, status: nextStatus }));
      const updated = followUps.map(record => record.id === f.id ? dbFollowUpToFrontend(saved) : record);
      onUpdateFollowUps(updated);
    } catch (error) {
      console.error('Failed to update follow-up', error);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartmentName) return;

    try {
      const saved = await ministriesApi.create(frontendDepartmentToDb({
        id: '',
        name: newDepartmentName,
        leaderName: newDepartmentLeaderName || 'Vacant',
        leaderId: newDepartmentLeaderId || '',
        membersCount: 0,
        meetingSchedule: newDepartmentMeetingSchedule,
        budget: 0,
        spent: 0,
        reports: []
      }));
      const newDepartment = dbMinistryToFrontend(saved);
      onUpdateDepartments([newDepartment, ...departments]);
      resetDepartmentForm();
    } catch (error) {
      console.error('Failed to save department', error);
    }
  };

  // Add Department Report
  const handleAddDeptReport = (deptId: string) => {
    if (!newDeptReport) return;
    const updated = departments.map(d => {
      if (d.id === deptId) {
        return {
          ...d,
          reports: [
            { date: new Date().toISOString().split('T')[0], content: newDeptReport },
            ...d.reports
          ]
        };
      }
      return d;
    });
    onUpdateDepartments(updated);
    setNewDeptReport('');
    setShowDeptReportForm(null);
  };

  // FILTER LOGIC
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || m.department === filterDept;
    const matchesStatus = filterStatus === 'All' || m.membershipStatus === filterStatus;

    if (activeRole === 'Department Leader') {
      return matchesSearch && matchesDept && matchesStatus && m.department !== 'None';
    }

    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = a.date.includes(searchTerm) || a.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || a.serviceType === filterType;
    return matchesSearch && matchesType;
  });

  const filteredFollowUps = followUps.filter(f => {
    const matchesSearch = f.targetPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.assignedToName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || f.category === filterType;
    const matchesStatus = filterStatus === 'All' || f.status === filterStatus;

    if (activeRole === 'Department Leader') {
      const targetMember = members.find(m => m.name === f.targetPersonName);
      return matchesSearch && matchesType && matchesStatus && Boolean(targetMember && targetMember.department !== 'None');
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const canManageMembers = ['Pastor', 'Church Administrator', 'Department Leader'].includes(activeRole);
  const canManageDepartments = ['Pastor', 'Church Administrator'].includes(activeRole);
  const canModifyDept = activeRole === 'Pastor' || activeRole === 'Church Administrator' || activeRole === 'Department Leader';

  const generateVisitorLink = () => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}${window.location.pathname}?view=visitor-signup`;
    setVisitorLink(link);
    navigator.clipboard?.writeText(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. MEMBERS MANAGEMENT */}
      {activeSubView === 'Members' && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search members by name or email..."
                className="input-elegant pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="input-elegant px-3 py-2.5 cursor-pointer"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Choir">Choir</option>
                <option value="Ushers">Ushers</option>
                <option value="Media">Media</option>
                <option value="Prayer Team">Prayer Team</option>
                <option value="Protocol">Protocol</option>
                <option value="Children Ministry">Children Ministry</option>
                <option value="Welfare">Welfare</option>
                <option value="Evangelism">Evangelism</option>
                <option value="None">None</option>
              </select>
              <select
                className="input-elegant px-3 py-2.5 cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Under Discipline">Under Discipline</option>
              </select>
            </div>
          </div>

          {canManageMembers && (
            <button
              onClick={() => {
                resetMemberForm();
                setShowMemberForm(true);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <i className="bi bi-plus-lg"></i> Add New Member
            </button>
          )}

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map(member => (
              <div key={member.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 card-hover">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{member.name}</h3>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${
                      member.membershipStatus === 'Active' ? 'badge-emerald' : 'badge-amber'
                    }`}>
                      {member.membershipStatus}
                    </span>
                    {canManageMembers && (
                      <button
                        type="button"
                        onClick={() => handleEditMember(member)}
                        className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-telephone text-slate-400"></i> {member.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="bi bi-geo-alt text-slate-400"></i> {member.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="bi bi-building text-slate-400"></i> {member.department}
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="bi bi-calendar text-slate-400"></i> Joined {member.joinDate}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Member Form Modal */}
          {showMemberForm && (
            <div className="modal-backdrop">
              <div className="modal-content p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-800">{editMemberId ? 'Edit Member' : 'Add New Member'}</h3>
                <form onSubmit={handleSaveMember} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    className="input-elegant"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="input-elegant"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="input-elegant"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                  />
                  <input
                    type="date"
                    className="input-elegant"
                    value={memberBirthday}
                    onChange={(e) => setMemberBirthday(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    className="input-elegant"
                    value={memberLocation}
                    onChange={(e) => setMemberLocation(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select
                      className="input-elegant flex-1 cursor-pointer"
                      value={memberDept}
                      onChange={(e) => setMemberDept(e.target.value)}
                    >
                      <option value="None">No Department</option>
                      <option value="Choir">Choir</option>
                      <option value="Ushers">Ushers</option>
                      <option value="Media">Media</option>
                      <option value="Prayer Team">Prayer Team</option>
                      <option value="Protocol">Protocol</option>
                      <option value="Children Ministry">Children Ministry</option>
                      <option value="Welfare">Welfare</option>
                      <option value="Evangelism">Evangelism</option>
                    </select>
                    <select
                      className="input-elegant flex-1 cursor-pointer"
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value as MembershipStatus)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Under Discipline">Under Discipline</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetMemberForm}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      {editMemberId ? 'Update' : 'Add'} Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. VISITORS MANAGEMENT */}
      {activeSubView === 'Visitors' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Visitors Management</h3>
                <p className="text-sm text-slate-500">Track and follow up with first-time visitors.</p>
              </div>
              <button
                onClick={() => setShowVisitorForm(true)}
                className="btn-primary"
              >
                Add Visitor
              </button>
            </div>
            <div className="rounded-xl border border-dashed border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-800">Shareable visitor signup link</p>
                  <p className="text-xs text-amber-700">Visitors can submit their own details through this link.</p>
                </div>
                <button
                  type="button"
                  onClick={generateVisitorLink}
                  className="btn-secondary"
                >
                  Generate Link
                </button>
              </div>
              {visitorLink && (
                <p className="mt-2 break-all text-xs text-slate-600 font-medium">{visitorLink} (copied)</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisitors.map(visitor => (
              <div key={visitor.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 card-hover">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800">{visitor.name}</h4>
                    <p className="text-xs text-slate-500">{visitor.email}</p>
                  </div>
                  <span className={`badge ${
                    visitor.status === 'Converted' ? 'badge-emerald' : 
                    visitor.status === 'New' ? 'badge-amber' : 'badge-slate'
                  }`}>{visitor.status}</span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2"><i className="bi bi-telephone text-slate-400"></i> {visitor.phone}</div>
                  <div className="flex items-center gap-2"><i className="bi bi-calendar text-slate-400"></i> {visitor.visitDate}</div>
                  <div className="flex items-center gap-2"><i className="bi bi-person-check text-slate-400"></i> {visitor.invitedBy || '—'}</div>
                </div>
              </div>
            ))}
          </div>

          {showVisitorForm && (
            <div className="modal-backdrop">
              <div className="modal-content p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-800">{editVisitorId ? 'Edit Visitor' : 'Add Visitor'}</h3>
                <form onSubmit={handleSaveVisitor} className="space-y-3">
                  <input type="text" placeholder="Full Name" required className="input-elegant" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
                  <input type="email" placeholder="Email" className="input-elegant" value={visitorEmail} onChange={(e) => setVisitorEmail(e.target.value)} />
                  <input type="tel" placeholder="Phone" className="input-elegant" value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} />
                  <input type="text" placeholder="Invited by" className="input-elegant" value={visitorInvitedBy} onChange={(e) => setVisitorInvitedBy(e.target.value)} />
                  <textarea placeholder="Prayer request" className="input-elegant h-24 resize-none" value={visitorRequest} onChange={(e) => setVisitorRequest(e.target.value)} />
                  <input type="text" placeholder="Follow-up officer" className="input-elegant" value={visitorOfficer} onChange={(e) => setVisitorOfficer(e.target.value)} />
                  <select className="input-elegant cursor-pointer" value={visitorStatus} onChange={(e) => setVisitorStatus(e.target.value as VisitorStatus)}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <textarea placeholder="Follow-up notes" className="input-elegant h-20 resize-none" value={visitorNotes} onChange={(e) => setVisitorNotes(e.target.value)} />
                  <div className="flex gap-2">
                    <button type="button" onClick={resetVisitorForm} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">Save Visitor</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ATTENDANCE MANAGEMENT */}
      {activeSubView === 'Attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Attendance Management</h3>
            <p className="text-sm text-slate-500">Record and track service attendance.</p>
          </div>
        </div>
      )}

      {/* 4. DEPARTMENTS MANAGEMENT */}
      {activeSubView === 'Departments' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Departments</h3>
              <p className="text-sm text-slate-500">Manage ministry departments and assign leaders.</p>
            </div>
            {canManageDepartments && (
              <button
                onClick={() => setShowDeptForm(true)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <i className="bi bi-plus-lg"></i> Add Department
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => (
              <div key={dept.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 card-hover">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-0.5 rounded-full">
                      {dept.name}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">{dept.membersCount} Workers</span>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Department Leader</span>
                    <span className="text-sm font-semibold text-slate-800">{dept.leaderName || 'Vacant'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showDeptForm && (
            <div className="modal-backdrop">
              <div className="modal-content p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Add New Department</h3>
                <form onSubmit={handleSaveDepartment} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Department name"
                    className="input-elegant"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value as DepartmentName)}
                  />
                  <select
                    className="input-elegant cursor-pointer"
                    value={newDepartmentLeaderId}
                    onChange={(e) => {
                      const selectedLeader = leaderOptions.find(option => option.id.toString() === e.target.value);
                      setNewDepartmentLeaderId(e.target.value);
                      setNewDepartmentLeaderName(selectedLeader ? `${selectedLeader.first_name} ${selectedLeader.last_name}` : '');
                    }}
                  >
                    <option value="">Select department leader from database</option>
                    {leaderOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.first_name} {option.last_name} ({option.email})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Meeting schedule"
                    className="input-elegant"
                    value={newDepartmentMeetingSchedule}
                    onChange={(e) => setNewDepartmentMeetingSchedule(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={resetDepartmentForm} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">Add Department</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PASTORAL FOLLOW-UP SYSTEM */}
      {activeSubView === 'Follow Up' && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                type="text"
                placeholder="Search follow-ups by name or assignee..."
                className="input-elegant pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="input-elegant px-3 py-2.5 cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="New Convert">New Convert</option>
                <option value="Visitor">Visitor</option>
                <option value="Sick">Sick Visitation</option>
                <option value="Inactive">Inactive Member</option>
                <option value="Counseling">Counseling</option>
                <option value="Home Visit">Home Visit</option>
              </select>
              <select
                className="input-elegant px-3 py-2.5 cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Follow-Up Request Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 self-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="bi bi-telephone-outbound-fill text-amber-500 text-xl"></i> Assign Follow-up Officer
                </h2>
                <p className="text-xs text-slate-500">Track and assign sick visitations, inactive members, counseling requests, and first-time converters.</p>
              </div>

              <form onSubmit={handleSaveFollowUp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Person Name *</label>
                  <select 
                    id="form-follow-target"
                    required
                    className="input-elegant cursor-pointer"
                    value={followTargetId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value ? parseInt(e.target.value) : null;
                      const selectedMember = memberOptions.find(m => m.id === selectedId);
                      setFollowTargetId(selectedId);
                      setFollowTargetName(selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : '');
                    }}
                  >
                    <option value="">Select a member...</option>
                    {memberOptions.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Category Type</label>
                  <select 
                    id="form-follow-type"
                    className="input-elegant cursor-pointer"
                    value={followType}
                    onChange={(e) => setFollowType(e.target.value as FollowUpCategory)}
                  >
                    <option value="New Convert">New Convert</option>
                    <option value="Visitor">Visitor</option>
                    <option value="Sick">Sick Member</option>
                    <option value="Inactive">Inactive Member</option>
                    <option value="Counseling">Counseling</option>
                    <option value="Home Visit">Home Visit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned To (Leader / Pastor Name)</label>
                  <select 
                    id="form-follow-assignee"
                    className="input-elegant cursor-pointer"
                    value={followAssignedId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value ? parseInt(e.target.value) : null;
                      const selectedLeader = leaderOptions.find(l => l.id === selectedId);
                      setFollowAssignedId(selectedId);
                      setFollowAssignedName(selectedLeader ? `${selectedLeader.first_name} ${selectedLeader.last_name}` : '');
                    }}
                  >
                    <option value="">Select a leader...</option>
                    {leaderOptions.map(leader => (
                      <option key={leader.id} value={leader.id}>
                        {leader.first_name} {leader.last_name} ({leader.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Task Assignment Details</label>
                  <textarea 
                    id="form-follow-notes"
                    className="input-elegant h-20 resize-none"
                    placeholder="Provide precise details, phone number, address, or prayer focus for the assigned visitation officer..."
                    value={followNotes}
                    onChange={(e) => setFollowNotes(e.target.value)}
                  />
                </div>

                <button 
                  id="save-followup-btn"
                  type="submit" 
                  className="btn-primary w-full text-xs"
                >
                  Launch Follow-up Directive
                </button>
              </form>
            </div>

            {/* Active Follow-up Log Items */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-md font-bold text-slate-800">Care & Follow-up Directives Log</h3>
                <p className="text-xs text-slate-500">Review, update statuses, and monitor pastoral visitations and member wellness audits.</p>
              </div>

              <div className="space-y-4">
                {filteredFollowUps.map(f => (
                  <div key={f.id} className="p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl space-y-3 hover:border-amber-200 hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className={`inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          f.category === 'Sick Visitation' ? 'badge-rose' :
                          f.category === 'New Convert' ? 'badge-emerald' :
                          f.category === 'Inactive Member' ? 'badge-amber' :
                          'badge-slate'
                        }`}>
                          {f.category} Directive
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 pt-1">
                          👥 Target: <span className="text-amber-600">{f.targetPersonName}</span>
                        </h4>
                        <p className="text-xs text-slate-500">Assigned: <b>{f.assignedToName}</b> • Created {f.dateCreated}</p>
                      </div>

                      <div className="text-right">
                        <button 
                          onClick={() => handleToggleFollowUpStatus(f)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
                            f.status === 'Completed' ? 'badge-emerald' :
                            f.status === 'In Progress' ? 'badge-amber' :
                            'badge-slate'
                          }`}
                          title="Click to toggle status step"
                        >
                          {f.status === 'Completed' ? '✓ Completed' : f.status}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200/50 p-3 rounded-lg">
                      {f.notes || 'No description provided.'}
                    </p>
                  </div>
                ))}
                {filteredFollowUps.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-12">No active follow-up logs found matching filters.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
