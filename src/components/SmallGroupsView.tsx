import React, { useState, useEffect } from 'react';
import { SmallGroup, GroupMember, GroupMeeting, Member, Role } from '../types';
import { groupsApi } from '../api';
import { dbGroupToFrontend, dbGroupMemberToFrontend, dbGroupMeetingToFrontend, frontendGroupToDb } from '../innovationMapper';
import { getTodayString } from '../utils/date';

interface SmallGroupsViewProps {
  activeRole: Role;
  members: Member[];
}

export default function SmallGroupsView({ activeRole, members }: SmallGroupsViewProps) {
  const [groups, setGroups] = useState<SmallGroup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [meetingDay, setMeetingDay] = useState('Sunday');
  const [meetingTime, setMeetingTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [addMemberId, setAddMemberId] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingAttendance, setMeetingAttendance] = useState(0);

  const isAdmin = ['Super Admin', 'Pastor', 'Church Administrator', 'Department Leader'].includes(activeRole);
  const selected = groups.find(g => g.id === selectedId);

  const loadGroups = async () => {
    const data = await groupsApi.getAll();
    setGroups(data.map(dbGroupToFrontend));
  };

  const loadGroupDetail = async (id: string) => {
    const dbId = parseInt(id, 10);
    const [mems, meets] = await Promise.all([
      groupsApi.getMembers(dbId),
      groupsApi.getMeetings(dbId),
    ]);
    setGroupMembers(mems.map(dbGroupMemberToFrontend));
    setMeetings(meets.map(dbGroupMeetingToFrontend));
  };

  useEffect(() => { loadGroups().catch(console.error); }, []);

  useEffect(() => {
    if (selectedId) loadGroupDetail(selectedId).catch(console.error);
  }, [selectedId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const saved = await groupsApi.create(frontendGroupToDb({ name, description, leaderName, meetingDay, meetingTime, location, maxMembers: 12, isActive: true }));
    setGroups([dbGroupToFrontend(saved), ...groups]);
    setShowForm(false);
    setName(''); setDescription(''); setLeaderName(''); setLocation('');
  };

  const handleAddMember = async () => {
    if (!selectedId || !addMemberId) return;
    await groupsApi.addMember(parseInt(selectedId, 10), parseInt(addMemberId, 10));
    await loadGroupDetail(selectedId);
    await loadGroups();
    setAddMemberId('');
  };

  const handleLogMeeting = async () => {
    if (!selectedId) return;
    await groupsApi.logMeeting(parseInt(selectedId, 10), {
      meeting_date: getTodayString(),
      topic: meetingTopic,
      attendance_count: meetingAttendance,
    });
    await loadGroupDetail(selectedId);
    setMeetingTopic('');
    setMeetingAttendance(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-teal-50 to-white p-6 rounded-2xl border border-teal-100">
        <h3 className="text-lg font-bold text-slate-800">
          <i className="bi bi-people-fill text-teal-600 mr-2"></i>Small Groups & Cell Fellowship
        </h3>
        <p className="text-sm text-slate-500 mt-1">Life groups for discipleship, prayer, and community — track members and meeting attendance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {isAdmin && (
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary w-full text-xs">
              <i className="bi bi-plus-lg mr-1"></i> New Group
            </button>
          )}
          {groups.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedId === g.id ? 'bg-teal-50 border-teal-300' : 'bg-white border-slate-200 hover:border-teal-200'}`}
            >
              <div className="font-semibold text-slate-800">{g.name}</div>
              <div className="text-xs text-slate-500 mt-1">{g.leaderName || 'No leader'} · {g.memberCount || 0}/{g.maxMembers}</div>
              <div className="text-[10px] text-teal-600 mt-1">{g.meetingDay} {g.meetingTime} · {g.location || 'TBD'}</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selected ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <i className="bi bi-diagram-3 text-4xl mb-3 block"></i>
              Select a group to manage members and meetings
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-lg text-slate-800">{selected.name}</h4>
                <p className="text-sm text-slate-500 mt-1">{selected.description || 'No description'}</p>
                <div className="flex flex-wrap gap-3 mt-4 text-xs">
                  <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full"><i className="bi bi-person mr-1"></i>{selected.leaderName}</span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full"><i className="bi bi-calendar mr-1"></i>{selected.meetingDay} {selected.meetingTime}</span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full"><i className="bi bi-geo-alt mr-1"></i>{selected.location || 'TBD'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h5 className="font-bold text-sm uppercase text-slate-600">Members ({groupMembers.length})</h5>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)} className="input-elegant flex-1 text-xs">
                        <option value="">Add member...</option>
                        {members.filter(m => m.membershipStatus === 'Active').map(m => (
                          <option key={m.id} value={m.id.replace('M-', '')}>{m.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={handleAddMember} className="btn-primary text-xs px-3">Add</button>
                    </div>
                  )}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {groupMembers.map(m => (
                      <div key={m.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs">
                        <span className="font-medium">{m.memberName}</span>
                        <span className="text-teal-600">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h5 className="font-bold text-sm uppercase text-slate-600">Meeting Log</h5>
                  {isAdmin && (
                    <div className="space-y-2">
                      <input value={meetingTopic} onChange={e => setMeetingTopic(e.target.value)} placeholder="Topic" className="input-elegant text-xs" />
                      <div className="flex gap-2">
                        <input type="number" value={meetingAttendance} onChange={e => setMeetingAttendance(+e.target.value)} placeholder="Attendance" className="input-elegant text-xs flex-1" min={0} />
                        <button type="button" onClick={handleLogMeeting} className="btn-primary text-xs">Log</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {meetings.map(m => (
                      <div key={m.id} className="p-2 bg-slate-50 rounded-lg text-xs">
                        <div className="font-medium">{m.topic || 'Meeting'}</div>
                        <div className="text-slate-500">{m.meetingDate} · {m.attendanceCount} attended</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content p-6 space-y-4 max-w-md">
            <h3 className="font-bold text-lg">New Small Group</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Group name" className="input-elegant w-full" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input-elegant w-full h-20" />
              <input value={leaderName} onChange={e => setLeaderName(e.target.value)} placeholder="Leader name" className="input-elegant w-full" />
              <div className="grid grid-cols-2 gap-2">
                <select value={meetingDay} onChange={e => setMeetingDay(e.target.value)} className="input-elegant">
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d}>{d}</option>)}
                </select>
                <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="input-elegant" />
              </div>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="input-elegant w-full" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
