import React, { useState, useEffect, useRef } from 'react';
import { LiveStream, Role } from '../types';
import { getTodayString } from '../utils/date';
import { liveStreamsApi } from '../api';
import { dbLiveStreamToFrontend, frontendLiveStreamToDb } from '../innovationMapper';

interface LiveStreamViewProps {
  activeRole: Role;
  liveStreams: LiveStream[];
  onUpdateLiveStreams: (newStreams: LiveStream[]) => void;
}

interface ChatMessage {
  id: string;
  user: string;
  role: string;
  message: string;
  timestamp: string;
}

const INITIAL_CHATS: ChatMessage[] = [
  { id: '1', user: 'Sister Sarah Jenkins', role: 'Choir Leader', message: 'The choir worship was so powerful today! Amen!', timestamp: '10:02 PM' },
  { id: '2', user: 'David Nkansah', role: 'Media Officer', message: 'Connection is stable. Glad to have everyone tuning in globally!', timestamp: '10:03 PM' },
  { id: '3', user: 'Brother James Taylor', role: 'Prayer Team', message: 'Amen! Standing in faith for miraculous breakthroughs tonight!', timestamp: '10:04 PM' },
  { id: '4', user: 'Linda Martinez', role: 'Member', message: 'Greetings from Kumasi! Tuning in with my entire family.', timestamp: '10:05 PM' },
  { id: '5', user: 'Deaconess Mary Mensah', role: 'Welfare Officer', message: 'May God restore and heal everyone suffering from any illness tonight.', timestamp: '10:06 PM' },
];

export default function LiveStreamView({
  activeRole,
  liveStreams,
  onUpdateLiveStreams
}: LiveStreamViewProps) {
  const [showForm, setShowForm] = useState(false);
  
  // Selected stream
  const [selectedStreamId, setSelectedStreamId] = useState<string>(() => {
    const live = liveStreams.find(s => s.status === 'Live');
    return live ? live.id : (liveStreams[0]?.id || '');
  });

  const activeStream = liveStreams.find(s => s.id === selectedStreamId) || liveStreams[0];

  // Chat state
  const [chats, setChats] = useState<ChatMessage[]>(INITIAL_CHATS);
  const [newChatText, setNewChatText] = useState('');
  const [heartsCount, setHeartsCount] = useState(148);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('20:00');
  const [embedUrl, setEmbedUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Live' | 'Upcoming' | 'Completed'>('Upcoming');

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // Simulate incoming chats randomly if active stream is LIVE
  useEffect(() => {
    if (!activeStream || activeStream.status !== 'Live') return;

    const names = ['Emmanuel Boateng', 'Patricia Alabi', 'Mark Robertson', 'Samuel Owusu', 'Grace Thompson'];
    const roles = ['Visitor', 'Children Ministry', 'Ushers', 'Protocol', 'Evangelism'];
    const messages = [
      'Glory to God! What anointed teaching!',
      'Receiving every word of prophecy!',
      'Amen! The favor of God is on my life.',
      'So glad I tuned in tonight. Beautiful sound quality.',
      'We lift high the shield of faith!',
      'My family is blessed and highly favored!'
    ];

    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setChats(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          user: randomName,
          role: randomRole,
          message: randomMsg,
          timestamp
        }
      ]);
    }, 12000); // Add chat message every 12 seconds

    return () => clearInterval(interval);
  }, [activeStream]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      user: 'David Nkansah (You)',
      role: activeRole,
      message: newChatText,
      timestamp
    };

    setChats(prev => [...prev, userMessage]);
    setNewChatText('');
  };

  const handleSaveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !speaker) return;

    try {
      const saved = await liveStreamsApi.create(frontendLiveStreamToDb({
        title, speaker, date, time, status,
        embedUrl: embedUrl || 'https://www.youtube.com/embed/jfKfPfyJRdk',
        description,
      }));
      const newStream = dbLiveStreamToFrontend(saved);
      let updatedStreams = liveStreams;
      if (status === 'Live') {
        updatedStreams = liveStreams.map(s => s.status === 'Live' ? { ...s, status: 'Completed' as const } : s);
      }
      onUpdateLiveStreams([newStream, ...updatedStreams]);
      setSelectedStreamId(newStream.id);
      resetForm();
    } catch (error) {
      console.error('Failed to save stream', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSpeaker('');
    setDate(getTodayString());
    setTime('20:00');
    setEmbedUrl('');
    setDescription('');
    setStatus('Upcoming');
    setShowForm(false);
  };

  const updateStatus = async (id: string, newStatus: 'Live' | 'Upcoming' | 'Completed') => {
    try {
      const stream = liveStreams.find(s => s.id === id);
      if (!stream) return;
      const dbId = parseInt(id.replace('LS-', ''), 10);
      const saved = await liveStreamsApi.update(dbId, frontendLiveStreamToDb({ ...stream, status: newStatus }));
      const updated = liveStreams.map(s => {
        if (s.id === id) return dbLiveStreamToFrontend(saved);
        if (newStatus === 'Live' && s.status === 'Live') return { ...s, status: 'Completed' as const };
        return s;
      });
      onUpdateLiveStreams(updated);
    } catch (error) {
      console.error('Failed to update stream status', error);
    }
  };

  const canManage = ['Super Admin', 'Pastor', 'Church Administrator', 'Media'].includes(activeRole);

  return (
    <div className="space-y-6 animate-fade-in" id="livestream-view">
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <i className="bi bi-broadcast text-rose-500 animate-pulse text-xl"></i> Live Broadcast & Virtual Sanctuary
          </h2>
          <p className="text-xs text-slate-500">
            Tune in to live broadcasts, view upcoming services, and join the virtual fellowship chat.
          </p>
        </div>
        {canManage && !showForm && (
          <button 
            id="btn-schedule-stream"
            onClick={() => setShowForm(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <i className="bi bi-plus text-rose-500 text-base font-bold"></i> Schedule Live Stream
          </button>
        )}
      </div>

      {/* Stream Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Configure Live Broadcast Segment
          </h3>
          <form onSubmit={handleSaveStream} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Broadcast Title *</label>
              <input 
                id="stream-title-input"
                type="text" required
                className="input-elegant"
                placeholder="e.g. Sunday Breakthrough Service"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Main Preacher/Speaker *</label>
              <input 
                id="stream-speaker-input"
                type="text" required
                className="input-elegant"
                placeholder="e.g. Pastor John Wilson"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Stream URL (Youtube Embed)</label>
              <input 
                id="stream-url-input"
                type="text"
                className="input-elegant"
                placeholder="https://www.youtube.com/embed/..."
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Scheduled Date</label>
              <input 
                id="stream-date-input"
                type="date"
                className="input-elegant"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Scheduled Time</label>
              <input 
                id="stream-time-input"
                type="text"
                className="input-elegant"
                placeholder="e.g. 06:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Broadcast Status</label>
              <select 
                id="stream-status-input"
                className="input-elegant cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="Upcoming">Upcoming Broadcast</option>
                <option value="Live">Live Now</option>
                <option value="Completed">Completed / Archive</option>
              </select>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Stream Description</label>
              <textarea 
                id="stream-desc-input"
                rows={2}
                className="input-elegant resize-none"
                placeholder="Tell virtual members what the message focuses on..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="btn-secondary text-xs">Cancel</button>
              <button type="submit" className="btn-danger text-xs">Schedule Broadcast</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Stream Interface Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Video Console & Details */}
        <div className="lg:col-span-2 space-y-6">
          {activeStream ? (
            <div className="space-y-4">
              {/* Virtual iFrame/Mock Player wrapper */}
              <div className="relative aspect-video w-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden group rounded-2xl">
                {activeStream.status === 'Live' || activeStream.status === 'Completed' ? (
                  <iframe 
                    id="live-stream-player"
                    src={activeStream.embedUrl} 
                    title={activeStream.title} 
                    className="w-full h-full border-0 rounded-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center border border-slate-600">
                      <i className="bi bi-calendar3 text-amber-500 text-2xl"></i>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded-xl font-bold uppercase tracking-wider">
                        UPCOMING BROADCAST
                      </span>
                      <h4 className="text-sm font-bold text-slate-300 uppercase pt-2">{activeStream.title}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Date: {activeStream.date} • Time: {activeStream.time}
                      </p>
                    </div>
                    <button 
                      onClick={() => alert("Notification registered! We'll alert you via email when this campus stream goes live.")}
                      className="btn-secondary text-xs"
                    >
                      <i className="bi bi-bell-fill text-amber-500 mr-1 text-xs"></i> Remind Me
                    </button>
                  </div>
                )}

                {/* Live Floating Badge */}
                {activeStream.status === 'Live' && (
                  <div className="absolute top-4 left-4 bg-rose-600 text-white border border-rose-500 px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-xl flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE NOW
                  </div>
                )}
              </div>

              {/* Stream Meta */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-900 uppercase tracking-tight">{activeStream.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Ministering: <b className="text-slate-800">{activeStream.speaker}</b></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium font-mono">
                      <i className="bi bi-people text-rose-500 text-sm"></i>
                      <span>{activeStream.status === 'Live' ? '284 Watching Live' : 'Archive views: 420'}</span>
                    </div>
                    <button 
                      onClick={() => setHeartsCount(prev => prev + 1)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <i className="bi bi-heart-fill text-rose-600 animate-bounce text-xs"></i> {heartsCount}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Message Focus:</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{activeStream.description}</p>
                </div>

                {/* Management status controls */}
                {canManage && (
                  <div className="bg-slate-50 border border-slate-200 p-4 flex flex-wrap gap-2 items-center justify-between rounded-xl">
                    <span className="text-[10px] font-mono font-bold text-slate-500">ADMIN CONTROLS:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(activeStream.id, 'Live')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 ${
                          activeStream.status === 'Live' 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <i className="bi bi-broadcast text-xs"></i> Go Live
                      </button>
                      <button
                        onClick={() => updateStatus(activeStream.id, 'Upcoming')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 ${
                          activeStream.status === 'Upcoming' 
                            ? 'bg-amber-500 text-white border-amber-500' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <i className="bi bi-calendar-event text-xs"></i> Schedule
                      </button>
                      <button
                        onClick={() => updateStatus(activeStream.id, 'Completed')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-none border flex items-center gap-1 ${
                          activeStream.status === 'Completed' 
                            ? 'bg-[#1A202C] text-white border-slate-800' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <i className="bi bi-check-circle text-xs"></i> Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-12 text-center bg-white border border-[#E2E8F0]">No broadcasts scheduled.</p>
          )}
        </div>

        {/* Right column: Interactive Live Altar Chat */}
        <div className="bg-white border border-[#E2E8F0] flex flex-col h-[480px] lg:h-auto justify-between overflow-hidden">
          {/* Chat Header */}
          <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <i className="bi bi-chat-left-text text-[#F59E0B] text-sm"></i> Live Sanctuary Altar Chat
            </span>
            <span className="text-[10px] font-mono bg-emerald-600 text-white border border-emerald-500 px-2 py-0.5 uppercase tracking-widest font-bold animate-pulse">
              SYNCED
            </span>
          </div>

          {/* Chat messages queue */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {chats.map(c => (
              <div key={c.id} className="text-xs space-y-0.5">
                <div className="flex justify-between items-baseline gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 font-sans">{c.user}</span>
                    <span className="text-[9px] font-semibold bg-slate-150 text-slate-500 px-1.5 py-0.2 rounded-none uppercase">
                      {c.role}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">{c.timestamp}</span>
                </div>
                <p className="text-slate-600 bg-white p-2.5 rounded-none border border-slate-100 shadow-xs leading-relaxed">
                  {c.message}
                </p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-150 bg-slate-50 flex gap-2 shrink-0">
            <input 
              id="live-chat-input"
              type="text"
              placeholder="Type your praise, prayer, or amen..."
              className="flex-1 bg-white border border-slate-200 text-xs px-3 py-2 rounded-none focus:outline-hidden"
              value={newChatText}
              onChange={(e) => setNewChatText(e.target.value)}
            />
            <button 
              id="btn-send-chat"
              type="submit"
              className="bg-[#1A202C] hover:bg-slate-800 text-white p-2.5 rounded-none border border-slate-850 shrink-0 inline-flex items-center justify-center transition-all"
            >
              <i className="bi bi-send text-xs"></i>
            </button>
          </form>
        </div>
      </div>

      {/* Broadcast Schedule Segment */}
      <div className="bg-white p-6 rounded-none border border-[#E2E8F0] space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Campus Broadcast Schedules & Archive logs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {liveStreams.map(s => {
            const isCurrent = s.id === selectedStreamId;
            return (
              <div 
                key={s.id}
                onClick={() => setSelectedStreamId(s.id)}
                className={`p-4 border cursor-pointer transition-all space-y-3 ${
                  isCurrent 
                    ? 'border-[#F59E0B] bg-[#FFFBEB]/10' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`px-2 py-0.5 rounded-none font-bold uppercase tracking-wider border ${
                    s.status === 'Live' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                    s.status === 'Upcoming' ? 'bg-[#FFFBEB] text-[#F59E0B] border-amber-200' :
                    'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {s.status}
                  </span>
                  <span className="font-mono text-slate-400">{s.date}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate">{s.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Preacher: {s.speaker}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <i className="bi bi-clock text-xs"></i>
                  <span>Scheduled {s.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
