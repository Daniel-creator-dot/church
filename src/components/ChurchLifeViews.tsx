import React, { useState } from 'react';
import { donationsApi, eventsApi, sermonsApi, announcementsApi, prayerApi, devotionalsApi, mediaApi } from '../api';
import {
  frontendGivingToDb, dbDonationToFrontend, frontendEventToDb, dbEventToFrontend,
  frontendSermonToDb, dbSermonToFrontend, frontendAnnouncementToDb, dbAnnouncementToFrontend,
  frontendPrayerToDb, dbPrayerToFrontend, frontendDevotionalToDb, dbDevotionalToFrontend,
  frontendMediaToDb, dbMediaToFrontend
} from '../dataMapper';
import { getTodayString } from '../utils/date';
import { 
  Sermon, 
  GivingRecord, 
  ChurchEvent, 
  Announcement, 
  PrayerRequest, 
  Devotional, 
  MediaAsset, 
  Role,
  GivingType,
  PaymentMethod,
  EventCategory,
  MediaAssetType
} from '../types';

interface ChurchLifeViewsProps {
  activeSubView: 'Sermons' | 'Giving' | 'Events' | 'Prayer Requests' | 'Announcements' | 'Devotional' | 'Media';
  activeRole: Role;
  userEmail: string;
  currentMemberId?: string;
  currencySymbol?: string;
  currencyCode?: string;
  formatCurrency?: (amount: number) => string;

  sermons: Sermon[];
  onUpdateSermons: (newSermons: Sermon[]) => void;

  giving: GivingRecord[];
  onUpdateGiving: (newGiving: GivingRecord[]) => void;

  events: ChurchEvent[];
  onUpdateEvents: (newEvents: ChurchEvent[]) => void;

  announcements: Announcement[];
  onUpdateAnnouncements: (newAnnouncements: Announcement[]) => void;

  prayerRequests: PrayerRequest[];
  onUpdatePrayerRequests: (newPrayers: PrayerRequest[]) => void;

  devotionals: Devotional[];
  onUpdateDevotionals: (newDevotionals: Devotional[]) => void;

  mediaAssets: MediaAsset[];
  onUpdateMediaAssets: (newMedia: MediaAsset[]) => void;
  
  onRecordTransaction: (transaction: { type: 'Income' | 'Expense'; category: string; amount: number; description: string }) => void;
}

// Function to print receipt content only
const printReceipt = (receiptId: string) => {
  const receiptElement = document.getElementById(receiptId);
  if (!receiptElement) return;

  const printContent = receiptElement.innerHTML;
  const printWindow = window.open('', '', 'width=600,height=800');
  
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              color: #000;
            }
            .border-2 {
              border: 2px solid #000;
              padding: 20px;
            }
            .text-xl { font-size: 1.25rem; font-weight: 900; text-transform: uppercase; }
            .text-[10px] { font-size: 0.625rem; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.1em; }
            .font-extrabold { font-weight: 800; }
            .font-mono { font-family: monospace; }
            .text-slate-400 { color: #64748b; }
            .text-slate-900 { color: #0f172a; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .pt-4 { padding-top: 1rem; }
            .text-left { text-align: left; }
            .border-t { border-top: 1px solid #e2e8f0; }
            .text-xs { font-size: 0.75rem; }
            .font-medium { font-weight: 500; }
            .font-mono { font-family: monospace; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .font-semibold { font-weight: 600; }
            .badge-amber { 
              background: #fef3c7; 
              color: #92400e; 
              padding: 2px 8px; 
              border-radius: 9999px; 
              font-size: 0.625rem;
            }
            .bg-slate-50 { background: #f8fafc; }
            .p-4 { padding: 1rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .border-dashed { border-style: dashed; }
            .border-slate-300 { border-color: #cbd5e1; }
            .mt-6 { margin-top: 1.5rem; }
            .text-center { text-align: center; }
            .italic { font-style: italic; }
            .text-3xl { font-size: 1.875rem; }
            .block { display: block; }
          </style>
        </head>
        <body>
          <div class="border-2">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

export default function ChurchLifeViews({
  activeSubView,
  activeRole,
  userEmail,
  currentMemberId,
  sermons,
  onUpdateSermons,
  giving,
  onUpdateGiving,
  events,
  onUpdateEvents,
  announcements,
  onUpdateAnnouncements,
  prayerRequests,
  onUpdatePrayerRequests,
  devotionals,
  onUpdateDevotionals,
  mediaAssets,
  onUpdateMediaAssets,
  onRecordTransaction,
  currencySymbol = '$',
  currencyCode = 'USD',
  formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`,
}: ChurchLifeViewsProps) {

  // Form toggles
  const [showSermonForm, setShowSermonForm] = useState(false);
  const [showGivingForm, setShowGivingForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showDevotionalForm, setShowDevotionalForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);

  // Filter giving records based on role - members only see their own giving
  const filteredGiving = activeRole === 'Member' && currentMemberId
    ? giving.filter(g => g.memberId === currentMemberId)
    : giving;

  // Selected details
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(sermons[0] || null);
  const [selectedReceipt, setSelectedReceipt] = useState<GivingRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Fields - Sermons
  const [sermonTitle, setSermonTitle] = useState('');
  const [sermonSpeaker, setSermonSpeaker] = useState('');
  const [sermonTheme, setSermonTheme] = useState('');
  const [sermonVerse, setSermonVerse] = useState('');
  const [sermonNotes, setSermonNotes] = useState('');
  const [sermonAudio, setSermonAudio] = useState('');

  // Form Fields - Giving
  const [donorName, setDonorName] = useState('');
  const [givingType, setGivingType] = useState<GivingType>('Tithe');
  const [givingAmount, setGivingAmount] = useState(100);
  const [givingMethod, setGivingMethod] = useState<PaymentMethod>('Bank Transfer');

  // Form Fields - Events
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-07-05');
  const [eventTime, setEventTime] = useState('18:00');
  const [eventLocation, setEventLocation] = useState('Main Chapel');
  const [eventCategory, setEventCategory] = useState<EventCategory>('Crusade');
  const [eventDescription, setEventDescription] = useState('');

  // Form Fields - Announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'General' | 'Youth' | 'Men' | 'Women' | 'Department'>('General');
  const [annStatus, setAnnStatus] = useState<'Draft' | 'Published'>('Published');

  // Form Fields - Prayer Requests
  const [prayerSubmitter, setPrayerSubmitter] = useState('');
  const [prayerEmail, setPrayerEmail] = useState('');
  const [prayerRequestText, setPrayerRequestText] = useState('');
  const [prayerPrivate, setPrayerPrivate] = useState(false);

  // Form Fields - Devotionals
  const [devDate, setDevDate] = useState('2026-07-01');
  const [devTitle, setDevTitle] = useState('');
  const [devVerse, setDevVerse] = useState('');
  const [devReference, setDevReference] = useState('');
  const [devText, setDevText] = useState('');
  const [devPoints, setDevPoints] = useState('');
  const [devDeclaration, setDevDeclaration] = useState('');

  // Form Fields - Media/Testimonies
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaAssetType>('Testimony');
  const [mediaUrl, setMediaUrl] = useState('');

  // Media Sub-Tab state
  const [mediaSubTab, setMediaSubTab] = useState<'Projection' | 'Library'>('Projection');

  // Scripture Projection states
  const [projectionText, setProjectionText] = useState('For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.');
  const [projectionReference, setProjectionReference] = useState('John 3:16');
  const [projectionLiveText, setProjectionLiveText] = useState('Welcome to Bethel Baptist Church. Live Service is commencing soon.');
  const [projectionLiveReference, setProjectionLiveReference] = useState('Welcome Slide');
  const [projectionTheme, setProjectionTheme] = useState<'midnight' | 'heavenly' | 'gold' | 'pure' | 'purple'>('midnight');
  const [projectionFontSize, setProjectionFontSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl'>('text-3xl');
  const [projectionFontFamily, setProjectionFontFamily] = useState<'font-sans' | 'font-serif' | 'font-mono'>('font-serif');
  const [projectionClear, setProjectionClear] = useState(false);
  const [projectionLogo, setProjectionLogo] = useState(true);

  // Bible search selector states
  const [bibleBook, setBibleBook] = useState('John');
  const [bibleChapter, setBibleChapter] = useState('3');
  const [bibleVerse, setBibleVerse] = useState('16');
  const [customText, setCustomText] = useState('');

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // HANDLERS

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle) return;

    try {
      const saved = await sermonsApi.create(frontendSermonToDb({
        id: '',
        title: sermonTitle,
        speaker: sermonSpeaker,
        date: getTodayString(),
        theme: sermonTheme,
        bibleVerse: sermonVerse,
        notes: sermonNotes,
        audioUrl: sermonAudio || undefined
      }));
      const newSermon = dbSermonToFrontend(saved);
      onUpdateSermons([newSermon, ...sermons]);
      setSelectedSermon(newSermon);
      setSermonTitle('');
      setSermonSpeaker('');
      setSermonTheme('');
      setSermonVerse('');
      setSermonNotes('');
      setSermonAudio('');
      setShowSermonForm(false);
    } catch (error) {
      console.error('Failed to save sermon', error);
    }
  };

  const handleSaveGiving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || givingAmount <= 0) return;

    try {
      const saved = await donationsApi.create(frontendGivingToDb({
        id: '',
        memberId: currentMemberId,
        donorName,
        date: getTodayString(),
        type: givingType,
        amount: givingAmount,
        paymentMethod: givingMethod,
        receiptNumber: ''
      }));
      const newGivingRecord = dbDonationToFrontend(saved);
      onUpdateGiving([newGivingRecord, ...giving]);

      onRecordTransaction({
        type: 'Income',
        category: givingType,
        amount: givingAmount,
        description: `${givingType} contribution by ${donorName}`
      });

      setSelectedReceipt(newGivingRecord);
      setDonorName('');
      setGivingAmount(100);
      setShowGivingForm(false);
    } catch (error) {
      console.error('Failed to save giving', error);
    }
  };

  const handleEventRsvp = async (eventId: string) => {
    if (!currentMemberId) {
      alert('Please log in with a member account to RSVP.');
      return;
    }
    const memberDbId = parseInt(currentMemberId.replace('M-', ''));
    const eventDbId = parseInt(eventId.replace('E-', ''));

    try {
      await eventsApi.register(eventDbId, memberDbId);
      const registrations = await eventsApi.getRegistrations(eventDbId);
      const rsvpEmails = registrations.map((r: any) => r.email).filter(Boolean);
      const updated = events.map(ev => ev.id === eventId ? { ...ev, rsvps: rsvpEmails } : ev);
      onUpdateEvents(updated);
      alert('Thank you! Your RSVP is confirmed.');
    } catch (error) {
      console.error('Failed to RSVP', error);
      alert('RSVP failed. You may already be registered.');
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle) return;

    try {
      const saved = await eventsApi.create(frontendEventToDb({
        id: '',
        title: eventTitle,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        category: eventCategory,
        description: eventDescription,
        rsvps: []
      }));
      const newEvent = dbEventToFrontend(saved);
      onUpdateEvents([newEvent, ...events]);
      setEventTitle('');
      setEventDescription('');
      setShowEventForm(false);
    } catch (error) {
      console.error('Failed to save event', error);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle) return;

    try {
      const saved = await announcementsApi.create(frontendAnnouncementToDb({
        id: '',
        title: annTitle,
        content: annContent,
        date: getTodayString(),
        category: annCategory,
        status: annStatus
      }));
      const newAnn = dbAnnouncementToFrontend(saved);
      onUpdateAnnouncements([newAnn, ...announcements]);
      setAnnTitle('');
      setAnnContent('');
      setShowAnnouncementForm(false);
    } catch (error) {
      console.error('Failed to save announcement', error);
    }
  };

  const handleSavePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerRequestText) return;

    try {
      const saved = await prayerApi.create(frontendPrayerToDb({
        id: '',
        submittedBy: prayerSubmitter || 'Anonymous Member',
        email: prayerEmail || userEmail,
        request: prayerRequestText,
        isPrivate: prayerPrivate,
        status: 'Pending',
        date: getTodayString()
      }));
      const newPrayer = dbPrayerToFrontend(saved);
      onUpdatePrayerRequests([newPrayer, ...prayerRequests]);
      setPrayerSubmitter('');
      setPrayerEmail('');
      setPrayerRequestText('');
      setPrayerPrivate(false);
      setShowPrayerForm(false);
      alert('Your prayer request has been submitted to the pastoral desk.');
    } catch (error) {
      console.error('Failed to save prayer request', error);
    }
  };

  const handleUpdatePrayerStatus = async (prayerId: string, action: 'Prayed For' | 'Followed Up') => {
    const prayer = prayerRequests.find(p => p.id === prayerId);
    if (!prayer) return;

    try {
      const dbId = parseInt(prayerId.replace('PR-', ''));
      const saved = await prayerApi.update(dbId, frontendPrayerToDb({
        ...prayer,
        status: action,
        notes: `Marked as ${action.toLowerCase()} by ${activeRole} on ${getTodayString()}`
      }));
      const updated = prayerRequests.map(p => p.id === prayerId ? dbPrayerToFrontend(saved) : p);
      onUpdatePrayerRequests(updated);
    } catch (error) {
      console.error('Failed to update prayer status', error);
    }
  };

  const handleSaveDevotional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devTitle) return;

    try {
      const saved = await devotionalsApi.create(frontendDevotionalToDb({
        date: devDate,
        title: devTitle,
        verse: devVerse,
        reference: devReference,
        devotionText: devText,
        prayerPoints: devPoints.split('\n').filter(p => p.trim()),
        declaration: devDeclaration
      }));
      const newDev = dbDevotionalToFrontend(saved);
      onUpdateDevotionals([newDev, ...devotionals]);
      setDevTitle('');
      setDevVerse('');
      setDevReference('');
      setDevText('');
      setDevPoints('');
      setDevDeclaration('');
      setShowDevotionalForm(false);
      alert(`Devotional for ${devDate} published!`);
    } catch (error) {
      console.error('Failed to save devotional', error);
    }
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle) return;

    const defaultUrl = mediaType === 'Photo' ? 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&auto=format&fit=crop&q=60' :
                       mediaType === 'Flyer' ? 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800&auto=format&fit=crop&q=60' :
                       'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60';
    const isApproved = ['Super Admin', 'Pastor', 'Church Administrator'].includes(activeRole);

    try {
      const saved = await mediaApi.create(frontendMediaToDb({
        id: '',
        title: mediaTitle,
        type: mediaType,
        url: mediaUrl || defaultUrl,
        approved: isApproved,
        date: getTodayString(),
        submittedBy: activeRole === 'Member' ? userEmail : activeRole
      }));
      const newMedia = dbMediaToFrontend(saved);
      onUpdateMediaAssets([newMedia, ...mediaAssets]);
      setMediaTitle('');
      setMediaUrl('');
      setShowMediaForm(false);
      alert(newMedia.approved ? 'Media added successfully!' : 'Testimony submitted for pastoral approval.');
    } catch (error) {
      console.error('Failed to save media', error);
    }
  };

  // Approve Testimony
  const handleApproveTestimony = (mediaId: string) => {
    const updated = mediaAssets.map(m => m.id === mediaId ? { ...m, approved: true } : m);
    onUpdateMediaAssets(updated);
  };

  const isAdmin = ['Super Admin', 'Pastor', 'Church Administrator', 'Finance Officer'].includes(activeRole);

  // Active Today's Devotional Lookup
  const todayStr = getTodayString();
  const activeDevotional = devotionals.find(d => d.date === todayStr) || devotionals[0];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. SERMONS & SERVICE MODULE */}
      {activeSubView === 'Sermons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sermons Directory Sidebar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                  <i className="bi bi-volume-up-fill text-amber-500 text-base"></i> Sermons Catalog
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">Stream and read recent service outlines</p>
              </div>
              {isAdmin && (
                <button 
                  id="add-sermon-btn"
                  onClick={() => setShowSermonForm(true)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl p-1.5 transition-colors"
                  title="Upload Sermon"
                >
                  <i className="bi bi-plus-lg text-amber-500"></i>
                </button>
              )}
            </div>

            {/* Sermon Upload Form */}
            {showSermonForm && (
              <form onSubmit={handleSaveSermon} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Publish Sermon Outlines</h4>
                <input 
                  id="form-sermon-title"
                  type="text" required placeholder="Sermon Title *"
                  className="input-elegant"
                  value={sermonTitle}
                  onChange={(e) => setSermonTitle(e.target.value)}
                />
                <input 
                  id="form-sermon-speaker"
                  type="text" required placeholder="Speaker/Pastor *"
                  className="input-elegant"
                  value={sermonSpeaker}
                  onChange={(e) => setSermonSpeaker(e.target.value)}
                />
                <input 
                  id="form-sermon-theme"
                  type="text" placeholder="Service Theme / Outlines"
                  className="input-elegant"
                  value={sermonTheme}
                  onChange={(e) => setSermonTheme(e.target.value)}
                />
                <input 
                  id="form-sermon-verse"
                  type="text" placeholder="Key Bible Verse Reference"
                  className="input-elegant"
                  value={sermonVerse}
                  onChange={(e) => setSermonVerse(e.target.value)}
                />
                <textarea 
                  id="form-sermon-notes"
                  placeholder="Sermon notes and key points..."
                  className="input-elegant h-24 resize-none"
                  value={sermonNotes}
                  onChange={(e) => setSermonNotes(e.target.value)}
                />
                <input 
                  id="form-sermon-audio"
                  type="url" placeholder="Audio URL (optional)"
                  className="input-elegant"
                  value={sermonAudio}
                  onChange={(e) => setSermonAudio(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowSermonForm(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 text-xs">Publish Sermon</button>
                </div>
              </form>
            )}

            {/* Sermons List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sermons.map(sermon => (
                <button
                  key={sermon.id}
                  onClick={() => setSelectedSermon(sermon)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedSermon?.id === sermon.id
                      ? 'bg-amber-50 border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-800">{sermon.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{sermon.speaker} • {sermon.date}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sermon Details Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            {selectedSermon ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedSermon.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><i className="bi bi-person"></i> {selectedSermon.speaker}</span>
                    <span className="flex items-center gap-1"><i className="bi bi-calendar"></i> {selectedSermon.date}</span>
                    {selectedSermon.audioUrl && (
                      <span className="flex items-center gap-1 text-amber-600"><i className="bi bi-headphones"></i> Audio Available</span>
                    )}
                  </div>
                </div>

                {selectedSermon.theme && (
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 rounded-xl border border-amber-200">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Service Theme</h4>
                    <p className="text-sm text-slate-700">{selectedSermon.theme}</p>
                  </div>
                )}

                {selectedSermon.bibleVerse && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Key Scripture</h4>
                    <p className="text-sm text-slate-800 italic">{selectedSermon.bibleVerse}</p>
                  </div>
                )}

                {selectedSermon.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Sermon Notes</h4>
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                      {selectedSermon.notes}
                    </div>
                  </div>
                )}

                {selectedSermon.audioUrl && (
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <button className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white hover:bg-amber-600 transition-colors">
                        <i className="bi bi-play-fill"></i>
                      </button>
                      <div className="flex-1">
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-1/3"></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">12:34</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="bi bi-volume-up text-4xl text-slate-300 mb-4"></i>
                <p className="text-slate-500">Select a sermon to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 2. GIVING & TITHE RECORDING */}
      {activeSubView === 'Giving' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Record in-person giving */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 self-start">
            <div>
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <i className="bi bi-coin text-amber-500 text-base"></i> Giving & Tithes
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">Record in-person tithes, offerings, seed, project, and welfare contributions.</p>
            </div>

            <form onSubmit={handleSaveGiving} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Donor / Member Name *</label>
                <input 
                  id="form-giving-donor"
                  type="text" required
                  className="input-elegant"
                  placeholder="Full name or anonymous"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Giving category</label>
                  <select 
                    id="form-giving-cat"
                    className="input-elegant cursor-pointer"
                    value={givingType}
                    onChange={(e) => setGivingType(e.target.value as GivingType)}
                  >
                    <option value="Tithe">Tithe</option>
                    <option value="Offering">Offering</option>
                    <option value="Seed">Seed</option>
                    <option value="Project">Project Funds</option>
                    <option value="Welfare">Welfare contribution</option>
                    <option value="Thanksgiving">Thanksgiving</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Amount ({currencyCode}) *</label>
                  <input 
                    id="form-giving-amount"
                    type="number" required min="1"
                    className="input-elegant"
                    value={givingAmount}
                    onChange={(e) => setGivingAmount(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Payment Method Used</label>
                <select 
                  id="form-giving-method"
                  className="input-elegant cursor-pointer"
                  value={givingMethod}
                  onChange={(e) => setGivingMethod(e.target.value as PaymentMethod)}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cash">Cash Envelope</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800 leading-normal">
                <i className="bi bi-sparkles text-amber-500 text-sm shrink-0 mt-0.5"></i>
                <p>Upon submission, a formal receipt transaction key is generated. You can download and print receipts immediately from the ledger.</p>
              </div>

              <button 
                id="submit-giving-btn"
                type="submit" 
                className="btn-primary w-full text-xs"
              >
                Log Payment & Generate Receipt
              </button>
            </form>
          </div>

          {/* Giving Records Ledger Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Congregational Contributions Ledger</h3>
                <p className="text-[11px] text-slate-500 font-mono">Review recent transactions and access formal printable receipts.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-elegant">
                <thead>
                  <tr>
                    <th>Receipt / Date</th>
                    <th>Donor Name</th>
                    <th>Category</th>
                    <th>Method</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGiving.map(g => (
                    <tr key={g.id}>
                      <td className="font-mono">
                        <div className="font-bold text-slate-800">{g.receiptNumber}</div>
                        <div className="text-[10px] text-slate-400">{g.date}</div>
                      </td>
                      <td className="text-slate-800 font-bold">{g.donorName}</td>
                      <td>
                        <span className="badge-amber">
                          {g.type}
                        </span>
                      </td>
                      <td className="text-slate-500">{g.paymentMethod}</td>
                      <td className="text-right font-black text-slate-800 font-mono">{formatCurrency(g.amount)}</td>
                      <td className="text-center">
                        <button 
                          onClick={() => setSelectedReceipt(g)}
                          className="text-slate-400 hover:text-amber-500 p-1 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
                          title="Generate Receipt Document"
                        >
                          <i className="bi bi-printer text-base"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL DRAWER REPRESENTATION */}
      {selectedReceipt && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md p-8 relative space-y-6">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 font-bold text-lg"
            >
              ✕
            </button>
            
            {/* Printable Receipt Frame */}
            <div id="receipt-print-frame" className="border-2 border-slate-900 p-6 rounded-none space-y-6 bg-white text-center font-sans">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 uppercase">Bethel Baptist Church</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-mono">Official Payment Receipt</p>
              </div>

              <div className="space-y-4 pt-4 text-left border-t border-slate-200 text-xs font-medium">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Date Logged:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contributor:</span>
                  <span className="font-black text-slate-800">{selectedReceipt.donorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category Type:</span>
                  <span className="badge-amber text-[10px]">{selectedReceipt.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment channel:</span>
                  <span className="font-semibold text-slate-600">{selectedReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 mt-6 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Total Amount Received</span>
                <span className="text-3xl font-black text-slate-900 font-mono">{formatCurrency(selectedReceipt.amount)} {currencyCode}</span>
              </div>

              <div className="pt-4 text-center">
                <span className="text-[10px] text-slate-400 italic">"Honor the Lord with your wealth, with the firstfruits of all your crops." - Prov 3:9</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  printReceipt('receipt-print-frame');
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <i className="bi bi-printer text-base"></i> Print Document
              </button>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="btn-secondary flex-1"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EVENTS & PROGRAMS AGENDA */}
      {activeSubView === 'Events' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-2xl border border-slate-700 flex justify-between items-center shadow-lg">
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <i className="bi bi-calendar-event text-amber-500 text-base"></i> Events, Programs & Revivals
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">Manage conventions, crusades, weddings, and community outreaches. Reserve seats and register RSVP counts.</p>
            </div>
            {isAdmin && (
              <button 
                id="create-event-btn"
                onClick={() => setShowEventForm(true)}
                className="btn-primary text-xs"
              >
                <i className="bi bi-plus-lg"></i> Create Event
              </button>
            )}
          </div>

          {/* Create Event Form */}
          {showEventForm && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Launch New Program Event</h3>
              <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  id="form-event-title"
                  type="text" required placeholder="Event Program Title *"
                  className="input-elegant"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
                <input 
                  id="form-event-date"
                  type="date" required
                  className="input-elegant"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
                <input 
                  id="form-event-time"
                  type="time" required
                  className="input-elegant"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
                <input 
                  id="form-event-loc"
                  type="text" placeholder="Location/Chapel *" required
                  className="input-elegant"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
                <select 
                  id="form-event-cat"
                  className="input-elegant cursor-pointer"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                >
                  <option value="Crusade">Crusade</option>
                  <option value="Prayer Meeting">Prayer Meeting</option>
                  <option value="Conference">Conference</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Funeral">Funeral</option>
                  <option value="Retreat">Retreat</option>
                  <option value="Special">Special program</option>
                </select>
                <input 
                  id="form-event-desc"
                  type="text" placeholder="Short agenda description *" required
                  className="input-elegant md:col-span-2"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                />
                <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowEventForm(false)} className="btn-secondary text-xs">Cancel</button>
                  <button type="submit" className="btn-primary text-xs">Schedule Event</button>
                </div>
              </form>
            </div>
          )}

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(e => {
              const hasRsvpd = e.rsvps.includes(userEmail || 'member@morningchurch.org');
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between card-hover">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="badge-amber">
                        {e.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold font-mono flex items-center gap-1"><i className="bi bi-clock text-slate-400"></i> {e.time}</span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-800 leading-snug line-clamp-1">{e.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{e.description}</p>
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono">
                      <div className="flex items-center gap-1"><i className="bi bi-geo-alt text-slate-400 shrink-0"></i> <b>Location:</b> {e.location}</div>
                      <div className="flex items-center gap-1"><i className="bi bi-calendar-event text-slate-400 shrink-0"></i> <b>Date:</b> {e.date}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold font-mono">{e.rsvps.length} RSVPs</span>
                    <button 
                      id={`rsvp-btn-${e.id}`}
                      onClick={() => handleEventRsvp(e.id)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all ${
                        hasRsvpd 
                          ? 'badge-emerald' 
                          : 'btn-primary'
                      }`}
                    >
                      {hasRsvpd ? '✓ Registered' : 'RSVP / Register'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ANNOUNCEMENT SYSTEM */}
      {activeSubView === 'Announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Create Announcement */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 self-start">
            <div>
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <i className="bi bi-bell text-amber-500 text-base"></i> Write Announcement
              </h2>
              <p className="text-[11px] text-slate-450 font-mono">Post announcements to the bulletin or copy SMS / WhatsApp ready templates.</p>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Announcement Title *</label>
                <input 
                  id="form-ann-title"
                  type="text" required placeholder="e.g. Youth Camp Postponement"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Alert Target Group</label>
                <select 
                  id="form-ann-cat"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                >
                  <option value="General">General Congregation</option>
                  <option value="Youth">Youth Fellowship</option>
                  <option value="Men">Men’s Fellowship</option>
                  <option value="Women">Women’s Fellowship</option>
                  <option value="Department">Department Workers</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Alert Details / message *</label>
                <textarea 
                  id="form-ann-content"
                  required placeholder="Enter message outlines..."
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs h-32 resize-none focus:outline-none focus:border-[#F59E0B]"
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                />
              </div>

              <button 
                id="submit-ann-btn"
                type="submit" 
                disabled={!isAdmin}
                className="w-full bg-[#1A202C] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors disabled:opacity-50 border border-slate-900"
              >
                Publish on Bulletin Board
              </button>
            </form>
          </div>

          {/* Active Bulletin Board */}
          <div className="lg:col-span-2 bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ministry Announcements Bulletin</h3>
              <p className="text-[11px] text-slate-450 font-mono">Current published declarations, weekly guidelines, and department memos.</p>
            </div>

            <div className="space-y-4">
              {announcements.map(ann => {
                const isCopied = copiedId === ann.id;
                const shareText = `*MORNING CHURCH ANNOUNCEMENT*\n\n🔔 *${ann.title}*\n📅 Date: ${ann.date}\n👥 Group: ${ann.category}\n\n${ann.content}\n\n_Keep seeking God early!_`;
                const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

                return (
                  <div key={ann.id} className="p-5 bg-slate-50 border border-[#E2E8F0] rounded-none hover:bg-slate-100/50 transition-colors space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-none border border-amber-100 bg-[#FFFBEB] text-[#F59E0B]">
                        {ann.category} Bulletin
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">{ann.date}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800">{ann.title}</h4>
                    <p className="text-xs text-slate-650 leading-relaxed font-sans font-light">{ann.content}</p>

                    <div className="pt-2.5 border-t border-[#E2E8F0] flex justify-end gap-2 text-xs">
                      <button 
                        onClick={() => handleCopyText(shareText, ann.id)}
                        className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] text-slate-600 px-3.5 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 font-mono"
                        title="Copy SMS ready template"
                      >
                        {isCopied ? <i className="bi bi-check-lg text-emerald-600"></i> : <i className="bi bi-clipboard"></i>}
                        {isCopied ? 'Copied' : 'Copy SMS Outline'}
                      </button>
                      <a 
                        href={whatsappShare} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 font-mono"
                      >
                        <i className="bi bi-whatsapp text-emerald-600"></i> WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. PRAYER REQUESTS PLATFORM */}
      {activeSubView === 'Prayer Requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Submit Prayer Form */}
          <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6 self-start">
            <div>
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <i className="bi bi-heart-fill text-[#F59E0B] text-base"></i> Prayer Altar Request
              </h2>
              <p className="text-[11px] text-slate-450 font-mono">Share your prayer request privately with the Pastor or publicly for corporate prayer support.</p>
            </div>

            <form onSubmit={handleSavePrayer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Your Name</label>
                <input 
                  id="form-prayer-donor"
                  type="text" placeholder="Or leave blank for anonymous"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={prayerSubmitter}
                  onChange={(e) => setPrayerSubmitter(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Contact Email</label>
                <input 
                  id="form-prayer-email"
                  type="email" placeholder="For pastoral outreach"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={prayerEmail}
                  onChange={(e) => setPrayerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Prayer request Details *</label>
                <textarea 
                  id="form-prayer-request"
                  required placeholder="What would you like us to join you in prayer for?"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs h-32 resize-none focus:outline-none focus:border-[#F59E0B]"
                  value={prayerRequestText}
                  onChange={(e) => setPrayerRequestText(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-600 font-bold select-none">
                <input 
                  id="form-prayer-private"
                  type="checkbox" 
                  className="rounded-none border-slate-300 text-rose-600 focus:ring-transparent h-4 w-4"
                  checked={prayerPrivate}
                  onChange={(e) => setPrayerPrivate(e.target.checked)}
                />
                <i className="bi bi-lock-fill text-slate-500"></i> Private (Pastors only)
              </label>

              <button 
                id="submit-prayer-btn"
                type="submit" 
                className="w-full bg-[#1A202C] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors border border-slate-900"
              >
                Lay Request on Altar
              </button>
            </form>
          </div>

          {/* Corporate Prayer Chain public logs */}
          <div className="lg:col-span-2 bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Corporate Faith Prayer Altar</h3>
              <p className="text-[11px] text-slate-450 font-mono">Join the congregation in praying and standing in gaps for public requests.</p>
            </div>

            <div className="space-y-4">
              {prayerRequests.map(pr => {
                const isAuthorizedToSeePrivate = ['Super Admin', 'Pastor', 'Church Administrator'].includes(activeRole);
                
                // Skip rendering if private and user is not authorized
                if (pr.isPrivate && !isAuthorizedToSeePrivate) return null;

                return (
                  <div key={pr.id} className="p-5 bg-slate-50 border border-[#E2E8F0] rounded-none hover:bg-slate-100/50 transition-colors space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1"><i className="bi bi-person-fill text-slate-400"></i> {pr.submittedBy}</span>
                          {pr.isPrivate && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-[#FFFBEB] px-2 py-0.5 rounded-none border border-amber-200 flex items-center gap-1">
                              <i className="bi bi-lock-fill text-amber-600"></i> Private
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">SUBMITTED: {pr.date}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-none border border-amber-100 bg-[#FFFBEB] text-[#F59E0B]">
                          {pr.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-serif italic bg-white p-3.5 rounded-none border border-[#E2E8F0]">
                      "{pr.request}"
                    </p>

                    {pr.notes && (
                      <div className="text-[11px] text-slate-700 bg-slate-100 p-2.5 rounded-none border border-[#E2E8F0] font-mono flex items-center gap-1.5">
                        <i className="bi bi-sliders text-[#F59E0B]"></i> Pastoral Followup: <b>{pr.notes}</b>
                      </div>
                    )}

                    {['Super Admin', 'Pastor'].includes(activeRole) && (
                      <div className="pt-2 border-t border-[#E2E8F0] flex justify-end gap-1.5 text-xs">
                        {pr.status !== 'Prayed For' && (
                          <button 
                            id={`prayer-prayed-btn-${pr.id}`}
                            onClick={() => handleUpdatePrayerStatus(pr.id, 'Prayed For')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-none border border-emerald-200"
                          >
                            Mark: Prayed
                          </button>
                        )}
                        {pr.status !== 'Followed Up' && (
                          <button 
                            id={`prayer-followed-btn-${pr.id}`}
                            onClick={() => handleUpdatePrayerStatus(pr.id, 'Followed Up')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-none border border-slate-300"
                          >
                            Mark: Followed up
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. DEVOTIONAL / DAILY WORD */}
      {activeSubView === 'Devotional' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Active Devotional Main Screen */}
          <div className="lg:col-span-2 bg-white p-8 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
            {activeDevotional ? (
              <div className="space-y-6">
                <div className="space-y-2 border-b border-[#E2E8F0] pb-5 text-center">
                  <span className="text-[10px] text-[#F59E0B] font-extrabold uppercase bg-[#FFFBEB] border border-amber-100 px-3 py-1 rounded-none font-mono flex items-center justify-center gap-1.5 w-fit mx-auto">
                    <i className="bi bi-calendar-event text-[#F59E0B]"></i> Daily Devotional • {activeDevotional.date}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-[#1A202C] tracking-tight pt-2">{activeDevotional.title}</h2>
                </div>

                {/* Scripture Card */}
                <div className="bg-[#1A202C] text-slate-200 p-6 rounded-none border border-slate-900 text-center relative overflow-hidden space-y-3">
                  <div className="absolute left-0 right-0 top-0 h-1 bg-[#F59E0B]"></div>
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block font-mono">Scripture Reference</span>
                  <p className="text-sm md:text-base font-serif italic leading-relaxed text-slate-100 px-2">
                    "{activeDevotional.verse}"
                  </p>
                  <span className="block text-xs font-black text-amber-400 font-mono">— {activeDevotional.reference}</span>
                </div>

                {/* Devotion Article Text */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <i className="bi bi-book-half text-[#F59E0B]"></i> Morning Reflections
                  </h3>
                  <div className="text-xs text-slate-650 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeDevotional.devotionText}
                  </div>
                </div>

                {/* Devotional points split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E2E8F0]">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <i className="bi bi-heart-fill text-[#F59E0B]"></i> Prayer Declarations Points
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4">
                      {activeDevotional.prayerPoints.map((pt, idx) => (
                        <li key={idx} className="leading-relaxed font-light">{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 bg-[#FFFBEB] p-4 rounded-none self-start border border-amber-200">
                    <h4 className="text-[10px] font-extrabold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <i className="bi bi-chat-left-quote-fill text-[#F59E0B]"></i> Daily Declaration
                    </h4>
                    <p className="text-xs font-serif text-slate-700 italic leading-relaxed font-medium">
                      "{activeDevotional.declaration}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-20 font-mono">No active morning devotion published for today.</p>
            )}
          </div>

          {/* Admin Schedule Devotional Form Card */}
          <div className="bg-white p-6 rounded-none border border-[#E2E8F0] shadow-none space-y-6">
            <div>
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <i className="bi bi-sparkles text-[#F59E0B] text-base"></i> Publish Devotional
              </h2>
              <p className="text-[11px] text-slate-450 font-mono">Admin/Pastor tool to outline, schedule, and feed the flock with the Daily Word.</p>
            </div>

            <form onSubmit={handleSaveDevotional} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Publication Date</label>
                <input 
                  id="form-dev-date"
                  type="date" required
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={devDate}
                  onChange={(e) => setDevDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Devotional Theme Title *</label>
                <input 
                  id="form-dev-title"
                  type="text" required placeholder="e.g. Streams of Joy"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={devTitle}
                  onChange={(e) => setDevTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Key Scripture Verse *</label>
                  <input 
                    id="form-dev-verse"
                    type="text" required placeholder="Scripture text"
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                    value={devVerse}
                    onChange={(e) => setDevVerse(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Reference *</label>
                  <input 
                    id="form-dev-ref"
                    type="text" required placeholder="Genesis 1:1"
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                    value={devReference}
                    onChange={(e) => setDevReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Devotion Article Text *</label>
                <textarea 
                  id="form-dev-text"
                  required placeholder="Type reflection context outline..."
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs h-28 resize-none focus:outline-none focus:border-[#F59E0B]"
                  value={devText}
                  onChange={(e) => setDevText(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Prayer Points (one per line)</label>
                <textarea 
                  id="form-dev-points"
                  placeholder="Enter prayer directives..."
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs h-16 resize-none focus:outline-none focus:border-[#F59E0B]"
                  value={devPoints}
                  onChange={(e) => setDevPoints(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Daily Declaration Word</label>
                <input 
                  id="form-dev-dec"
                  type="text" placeholder="Spoken declaration"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                  value={devDeclaration}
                  onChange={(e) => setDevDeclaration(e.target.value)}
                />
              </div>

              <button 
                id="save-devotional-btn"
                type="submit" 
                disabled={!['Super Admin', 'Pastor', 'Church Administrator'].includes(activeRole)}
                className="w-full bg-[#1A202C] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-none transition-colors disabled:opacity-50 border border-slate-900"
              >
                Broadcast Daily Devotional
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. MEDIA LIBRARY & TESTIMONIES approval system + SCRIPTURE PROJECTION */}
      {activeSubView === 'Media' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Media View Header with Sub-tabs */}
          <div className="bg-[#1A202C] p-6 rounded-none border border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <i className="bi bi-display text-[#F59E0B] text-base"></i> Media & Scripture Projection System
              </h2>
              <p className="text-[11px] text-slate-300 font-mono">
                Project holy scriptures onto virtual sanctuary screens and coordinate flyers, praise testimony approvals.
              </p>
            </div>
            <div className="flex gap-2 bg-slate-800 p-1 border border-slate-700">
              <button
                id="tab-media-projection"
                onClick={() => setMediaSubTab('Projection')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-none flex items-center gap-1.5 ${
                  mediaSubTab === 'Projection' 
                    ? 'bg-[#F59E0B] text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <i className="bi bi-display"></i> Scripture Projector
              </button>
              <button
                id="tab-media-library"
                onClick={() => setMediaSubTab('Library')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-none flex items-center gap-1.5 ${
                  mediaSubTab === 'Library' 
                    ? 'bg-[#F59E0B] text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <i className="bi bi-folder-fill"></i> Media & Testimonies
              </button>
            </div>
          </div>

          {/* Sub-tab 1: SCRIPTURE PROJECTION WORKSPACE (FOR MEDIA TEAM) */}
          {mediaSubTab === 'Projection' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Operator Controller Panel (7 Columns) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Controller Header */}
                <div className="bg-white p-5 rounded-none border border-[#E2E8F0] space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                      <i className="bi bi-sliders text-[#F59E0B] text-base"></i> Operator Live Console
                    </span>
                    <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-extrabold uppercase px-2 py-0.5 tracking-wider font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Authoritative Console
                    </span>
                  </div>

                  {/* Preset Scriptures Grid */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1 font-mono">
                      <i className="bi bi-sparkles"></i> Quick-Fire Preset Scriptures
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
                        { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
                        { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
                        { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
                        { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
                        { ref: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.' },
                        { ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him.' },
                        { ref: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setProjectionReference(preset.ref);
                            setProjectionText(preset.text);
                          }}
                          className={`p-2 border text-[11px] font-bold uppercase tracking-tight text-left transition-colors truncate flex items-center gap-1 rounded-none ${
                            projectionReference === preset.ref 
                              ? 'border-[#F59E0B] bg-amber-50 text-slate-800' 
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          <i className="bi bi-book-half text-slate-400 shrink-0"></i> {preset.ref}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Scripture Lookup Selector & Custom Editor */}
                <div className="bg-white p-5 rounded-none border border-[#E2E8F0] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                    <i className="bi bi-search text-slate-500"></i> Bible Book & Custom Verses Builder
                  </span>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Bible Book</label>
                      <select
                        id="bible-book-select"
                        className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 cursor-pointer focus:ring-1 focus:ring-[#F59E0B]"
                        value={bibleBook}
                        onChange={(e) => {
                          const bk = e.target.value;
                          setBibleBook(bk);
                          // Auto build simple text to guide user
                          const refStr = `${bk} ${bibleChapter}:${bibleVerse}`;
                          setProjectionReference(refStr);
                          setProjectionText(`Behold, the Word of God from ${bk} Chapter ${bibleChapter}. Walk in His supreme light and absolute righteousness.`);
                        }}
                      >
                        {['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', 'Jude', 'Revelation'].map(bk => (
                          <option key={bk} value={bk}>{bk}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Chapter</label>
                      <input
                        id="bible-chapter-input"
                        type="number" min="1" max="150"
                        className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 focus:ring-1 focus:ring-[#F59E0B]"
                        value={bibleChapter}
                        onChange={(e) => {
                          const ch = e.target.value;
                          setBibleChapter(ch);
                          const refStr = `${bibleBook} ${ch}:${bibleVerse}`;
                          setProjectionReference(refStr);
                          setProjectionText(`Behold, the Word of God from ${bibleBook} Chapter ${ch}. Walk in His supreme light and absolute righteousness.`);
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Verse</label>
                      <input
                        id="bible-verse-input"
                        type="number" min="1" max="176"
                        className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 focus:ring-1 focus:ring-[#F59E0B]"
                        value={bibleVerse}
                        onChange={(e) => {
                          const vs = e.target.value;
                          setBibleVerse(vs);
                          const refStr = `${bibleBook} ${bibleChapter}:${vs}`;
                          setProjectionReference(refStr);
                          setProjectionText(`The Lord is gracious, full of infinite compassion, and righteous in all His ways. - Reference: ${bibleBook} ${bibleChapter}:${vs}.`);
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Translation</label>
                      <select className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 focus:ring-1 focus:ring-[#F59E0B]">
                        <option>KJV</option>
                        <option>NIV</option>
                        <option>ESV</option>
                        <option>NKJV</option>
                        <option>AMP</option>
                      </select>
                    </div>
                  </div>

                  {/* Manual Editor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
                        Active Reference & Content Text Editor
                      </label>
                      <span className="text-[10px] text-[#F59E0B] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-pencil-square text-[#F59E0B]"></i> Live Editable Text Box
                      </span>
                    </div>
                    <input
                      id="projection-ref-field"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#F59E0B]"
                      value={projectionReference}
                      onChange={(e) => setProjectionReference(e.target.value)}
                      placeholder="Reference (e.g. Genesis 1:1)"
                    />
                    <textarea
                      id="projection-text-field"
                      className="w-full bg-slate-50 border border-slate-200 p-3 text-xs font-medium text-slate-700 h-24 focus:ring-1 focus:ring-[#F59E0B] leading-relaxed"
                      value={projectionText}
                      onChange={(e) => setProjectionText(e.target.value)}
                      placeholder="Scripture content slides..."
                    />
                  </div>
                </div>

                {/* 3. Screen Style & Font Customization */}
                <div className="bg-white p-5 rounded-none border border-[#E2E8F0] space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                    <i className="bi bi-sliders text-[#F59E0B]"></i> Visual Projection Style Presets
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Theme Presets */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Theme Preset</label>
                      <select
                        id="style-theme-select"
                        className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 cursor-pointer focus:ring-1 focus:ring-[#F59E0B]"
                        value={projectionTheme}
                        onChange={(e) => setProjectionTheme(e.target.value as any)}
                      >
                        <option value="midnight">Midnight Worship (Solid Black)</option>
                        <option value="heavenly">Heavenly Grace (Navy Gradient)</option>
                        <option value="gold">Morning Gold (Charcoal & Amber)</option>
                        <option value="purple">Velvet Altar (Deep Violet)</option>
                        <option value="pure">Pure Tabernacle (Solid White)</option>
                      </select>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Font Face</label>
                      <select
                        id="style-font-family-select"
                        className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 cursor-pointer focus:ring-1 focus:ring-[#F59E0B]"
                        value={projectionFontFamily}
                        onChange={(e) => setProjectionFontFamily(e.target.value as any)}
                      >
                        <option value="font-serif">Playfair Serif (Editorial Style)</option>
                        <option value="font-sans">Inter Sans (Modern Standard)</option>
                        <option value="font-mono">JetBrains Mono (Technical Minimal)</option>
                      </select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Font Scale</label>
                      <select
                        id="style-font-size-select"
                        className="w-full bg-slate-50 border border-[#E2E8F0] text-xs font-bold p-2 cursor-pointer focus:ring-1 focus:ring-[#F59E0B]"
                        value={projectionFontSize}
                        onChange={(e) => setProjectionFontSize(e.target.value as any)}
                      >
                        <option value="text-xl">Text Scale: Extra Large (XL)</option>
                        <option value="text-2xl">Text Scale: 2X Large (2XL)</option>
                        <option value="text-3xl">Text Scale: 3X Large (3XL)</option>
                        <option value="text-4xl">Text Scale: 4X Large (4XL)</option>
                        <option value="text-5xl">Text Scale: 5X Large (5XL)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Action Command Bar */}
                <div className="bg-slate-900 p-4 rounded-none text-white flex flex-wrap justify-between items-center gap-3 border border-slate-950">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="bi bi-tv text-slate-400"></i> Projection Action Commands:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      id="action-logo-toggle"
                      onClick={() => {
                        setProjectionLogo(!projectionLogo);
                        setProjectionClear(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-none transition-colors flex items-center gap-1.5 ${
                        projectionLogo 
                          ? 'bg-[#F59E0B] border-amber-600 text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <i className="bi bi-heart-fill text-amber-500"></i> Welcome Logo Slide
                    </button>

                    <button
                      type="button"
                      id="action-clear-words"
                      onClick={() => {
                        setProjectionClear(!projectionClear);
                        setProjectionLogo(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-none transition-colors flex items-center gap-1.5 ${
                        projectionClear 
                          ? 'bg-rose-600 border-rose-700 text-white' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <i className="bi bi-x-circle text-rose-500"></i> Clear Words (Toggle)
                    </button>

                    <button
                      type="button"
                      id="action-send-live"
                      onClick={() => {
                        setProjectionLiveText(projectionText);
                        setProjectionLiveReference(projectionReference);
                        setProjectionClear(false);
                        setProjectionLogo(false);
                        alert(`Sent "${projectionReference}" live to the virtual sanctuary projectors!`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border border-emerald-700 flex items-center gap-1.5"
                    >
                      <i className="bi bi-broadcast text-emerald-100 animate-pulse"></i> Send Live to Screen
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Virtual Projector Monitor & Outputs (5 Columns) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                
                {/* 1. OPERATOR PREVIEW MONITOR */}
                <div className="bg-white p-4 rounded-none border border-[#E2E8F0] space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    <span className="flex items-center gap-1"><i className="bi bi-display text-slate-500"></i> Desk Preview Monitor</span>
                    <span className="text-slate-400">Not live</span>
                  </div>
                  <div className="bg-slate-50 p-4 border border-slate-200 h-32 flex flex-col justify-between overflow-y-auto">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Reference: {projectionReference || 'No selection'}</span>
                    <p className="text-xs text-slate-700 italic font-serif leading-relaxed line-clamp-3">
                      "{projectionText || 'Select a scripture or write custom verse...'}"
                    </p>
                    <div className="flex justify-end">
                      <span className="bg-slate-200 text-slate-600 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-none">Ready</span>
                    </div>
                  </div>
                </div>

                {/* 2. VIRTUAL SANCTUARY PROJECTOR SCREEN (LIVE OUTPUT) */}
                <div className="bg-white p-4 rounded-none border border-[#E2E8F0] space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest font-mono">
                    <span className="flex items-center gap-1">
                      <i className="bi bi-tv text-emerald-500"></i> Sanctuary live projection output
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Active Broadcast
                    </span>
                  </div>

                  {/* Visual simulated sanctuary output screen */}
                  <div 
                    id="projection-screen-display"
                    className={`aspect-video w-full flex flex-col justify-between p-6 text-center select-none shadow-md transition-all duration-550 border ${
                      projectionTheme === 'midnight' ? 'bg-black text-white border-slate-900' :
                      projectionTheme === 'heavenly' ? 'bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] text-slate-100 border-indigo-900' :
                      projectionTheme === 'gold' ? 'bg-[#111827] border-amber-500 border-2 text-amber-100' :
                      projectionTheme === 'purple' ? 'bg-gradient-to-tr from-[#1E0030] to-[#350050] text-[#F3E8FF] border-fuchsia-950' :
                      'bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    {/* Header line on projection */}
                    <div className="text-[10px] tracking-widest uppercase opacity-45 font-mono font-extrabold">
                      {projectionLogo ? 'MORNING CHURCH WORSHIP' : 'HOLY SCRIPTURES'}
                    </div>

                    {/* Central Display */}
                    <div className="flex-1 flex items-center justify-center p-2">
                      {projectionClear ? (
                        <div className="opacity-20 italic text-xs tracking-wider">
                          [Screen blanked by operator - waiting for sermon cue]
                        </div>
                      ) : projectionLogo ? (
                        <div className="space-y-3 animate-fade-in">
                          <div className="w-10 h-10 bg-[#F59E0B] rounded-none flex items-center justify-center text-white font-bold text-lg mx-auto shadow-sm border border-amber-400">
                            M
                          </div>
                          <h4 className="text-sm font-sans font-extrabold uppercase tracking-widest leading-none">
                            Bethel Baptist Church
                          </h4>
                          <span className="block text-[10px] font-mono tracking-widest text-amber-500 uppercase font-black">
                            "Thy Word Is Truth"
                          </span>
                        </div>
                      ) : (
                        <div className="animate-fade-in space-y-2">
                          <p className={`font-medium leading-relaxed font-sans ${projectionFontSize} ${projectionFontFamily} leading-snug tracking-tight px-4`}>
                            {projectionLiveText}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer citation on projection */}
                    <div className="text-[11px] font-extrabold tracking-widest uppercase font-mono opacity-80 text-amber-500">
                      {!projectionClear && !projectionLogo && projectionLiveReference}
                    </div>
                  </div>

                  {/* Live projection monitor controls */}
                  <div className="pt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Style: <b className="uppercase">{projectionTheme}</b></span>
                    <span>Scaling: <b className="uppercase">{projectionFontSize}</b></span>
                  </div>
                </div>

                {/* Info block */}
                <div className="bg-[#FFFBEB] p-4 border border-amber-100 space-y-1.5 text-xs text-slate-700">
                  <span className="font-extrabold uppercase text-[#F59E0B] tracking-wider flex items-center gap-1.5"><i className="bi bi-info-circle-fill text-[#F59E0B] text-sm"></i> Media Room Guidelines</span>
                  <p className="leading-relaxed">
                    Always queue your scripture slides <b>before</b> the Pastor starts reading the text. Click <b>"Send Live"</b> to project immediately. If the Pastor goes off-script or pauses to pray, hit <b>"Clear Words"</b> to keep the beautiful background template but conceal the text.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Sub-tab 2: CLASSIC MEDIA LIBRARY & TESTIMONIES approval system */}
          {mediaSubTab === 'Library' && (
            <div className="space-y-6 animate-fade-in">
              {/* Share Entry trigger card */}
              <div className="bg-slate-50 p-5 rounded-none border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Upload files, flyers & share testimonies</h3>
                  <p className="text-[11px] text-slate-400">Upload upcoming program flyers or submit public praise testimonies for the sanctuary.</p>
                </div>
                {!showMediaForm && (
                  <button 
                    id="submit-media-btn-inner"
                    onClick={() => setShowMediaForm(true)}
                    className="bg-[#1A202C] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-none transition-all"
                  >
                    + Share Entry
                  </button>
                )}
              </div>

              {/* Share Media Form */}
              {showMediaForm && (
                <div className="bg-white p-6 rounded-none border border-[#E2E8F0] animate-fade-in">
                  <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider font-mono">Share Testimony or Upload Graphic Asset</h3>
                  <form onSubmit={handleSaveMedia} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      id="form-media-title"
                      type="text" required placeholder="Media Asset Title / Praise focus *"
                      className="w-full bg-white border border-[#E2E8F0] rounded-none p-2.5 text-xs focus:outline-none focus:border-[#F59E0B]"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                    />
                    <select 
                      id="form-media-type"
                      className="w-full bg-white border border-[#E2E8F0] rounded-none p-2.5 text-xs focus:outline-none focus:border-[#F59E0B]"
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value as MediaAssetType)}
                    >
                      <option value="Photo">Church Event Photo</option>
                      <option value="Flyer">Flyer graphic</option>
                      <option value="Testimony">Praise Testimony outline</option>
                      <option value="Video">Video recording</option>
                    </select>
                    <input 
                      id="form-media-url"
                      type="text" placeholder="Cover Image URL / Photo Link"
                      className="w-full bg-white border border-[#E2E8F0] rounded-none p-2.5 text-xs focus:outline-none focus:border-[#F59E0B]"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                    />
                    <div className="md:col-span-3 flex justify-end gap-1.5 pt-2">
                      <button type="button" onClick={() => setShowMediaForm(false)} className="bg-white border border-[#E2E8F0] hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-none">Cancel</button>
                      <button type="submit" className="bg-[#1A202C] hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-none border border-slate-900">Submit Entry</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Media list grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaAssets.map(asset => {
                  const needsApproval = !asset.approved;
                  const isOfficer = ['Super Admin', 'Pastor', 'Church Administrator'].includes(activeRole);

                  return (
                    <div key={asset.id} className="bg-white rounded-none border border-[#E2E8F0] hover:border-slate-400 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                      <div className="space-y-3 relative">
                        {/* Simulated image cover */}
                        <img 
                          src={asset.url} 
                          alt={asset.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-44 object-cover rounded-none"
                        />
                        
                        <div className="p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-none border border-amber-100 bg-[#FFFBEB] text-[#F59E0B]">
                              {asset.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{asset.date}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{asset.title}</h4>
                          {asset.submittedBy && (
                            <p className="text-[10px] text-slate-400 font-mono">Submitted by: <b>{asset.submittedBy}</b></p>
                          )}
                        </div>
                      </div>

                      {/* Actions / approval footer */}
                      <div className="bg-slate-50 p-3.5 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                        {needsApproval ? (
                          isOfficer ? (
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-none border border-amber-100 bg-[#FFFBEB] text-amber-800 font-mono">Pending Approval</span>
                              <button 
                                id={`approve-media-btn-${asset.id}`}
                                onClick={() => handleApproveTestimony(asset.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-none transition-colors border border-emerald-600"
                              >
                                ✓ Approve
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold font-mono uppercase tracking-wider">Awaiting pastoral review</span>
                          )
                        ) : (
                          <div className="flex justify-between items-center w-full text-slate-400">
                            <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">✓ Active / Approved</span>
                            <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-[#F59E0B] text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 font-mono">
                              Open Link <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
