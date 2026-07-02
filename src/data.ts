import {
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
  LiveStream
} from './types';

// Helper to format date relative to today's local time (2026-06-30)
const getDateOffset = (days: number): string => {
  const d = new Date('2026-06-30');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'M-101',
    name: 'David Nkansah',
    phone: '+233 24 123 4567',
    email: 'dnkansah29@gmail.com',
    location: 'Accra, Ghana',
    familyGroup: 'Shalom Fellowship',
    department: 'Media',
    birthday: '1992-04-15',
    baptismStatus: 'Baptized',
    membershipStatus: 'Active',
    joinDate: '2021-01-10'
  },
  {
    id: 'M-102',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 234-5678',
    email: 'sarah.j@morningchurch.org',
    location: 'Northside District',
    familyGroup: 'Grace Circle',
    department: 'Choir',
    birthday: '1988-11-23',
    baptismStatus: 'Baptized',
    membershipStatus: 'Active',
    joinDate: '2019-05-14'
  },
  {
    id: 'M-103',
    name: 'Brother James Taylor',
    phone: '+1 (555) 876-5432',
    email: 'james.t@gmail.com',
    location: 'Downtown Boulevard',
    familyGroup: 'Hope Fellowship',
    department: 'Prayer Team',
    birthday: '1975-08-05',
    baptismStatus: 'Baptized',
    membershipStatus: 'Active',
    joinDate: '2015-02-18'
  },
  {
    id: 'M-104',
    name: 'Deaconess Mary Mensah',
    phone: '+233 27 555 1212',
    email: 'mary.mensah@hotmail.com',
    location: 'Tema, Ghana',
    familyGroup: 'Shalom Fellowship',
    department: 'Welfare',
    birthday: '1968-01-30',
    baptismStatus: 'Baptized',
    membershipStatus: 'Active',
    joinDate: '2012-09-04'
  },
  {
    id: 'M-105',
    name: 'Mark Robertson',
    phone: '+1 (555) 432-1098',
    email: 'mark.rob@gmail.com',
    location: 'Eastside Suburbs',
    familyGroup: 'Grace Circle',
    department: 'Ushers',
    birthday: '1995-12-02',
    baptismStatus: 'Not Baptized',
    membershipStatus: 'Active',
    joinDate: '2024-02-10'
  },
  {
    id: 'M-106',
    name: 'Patricia Alabi',
    phone: '+234 803 123 4567',
    email: 'pat.alabi@yahoo.com',
    location: 'Lagos, Nigeria',
    familyGroup: 'Victory Cell',
    department: 'Children Ministry',
    birthday: '1990-06-12',
    baptismStatus: 'Baptized',
    membershipStatus: 'Active',
    joinDate: '2022-03-15'
  },
  {
    id: 'M-107',
    name: 'Samuel Owusu',
    phone: '+233 20 987 6543',
    email: 'sowusu@outlook.com',
    location: 'Kumasi, Ghana',
    familyGroup: 'Faith Fellowship',
    department: 'Protocol',
    birthday: '1982-10-08',
    baptismStatus: 'Baptized',
    membershipStatus: 'Active',
    joinDate: '2018-07-22'
  },
  {
    id: 'M-108',
    name: 'Grace Thompson',
    phone: '+1 (555) 765-4321',
    email: 'grace.thompson@gmail.com',
    location: 'West Hills',
    familyGroup: 'Hope Fellowship',
    department: 'Evangelism',
    birthday: '2001-03-14',
    baptismStatus: 'Not Baptized',
    membershipStatus: 'Inactive',
    joinDate: '2023-11-01'
  }
];

export const INITIAL_VISITORS: Visitor[] = [
  {
    id: 'V-201',
    name: 'Emmanuel Boateng',
    phone: '+233 24 999 8888',
    email: 'eboateng@gmail.com',
    visitDate: getDateOffset(-2), // 2026-06-28 (Sunday)
    invitedBy: 'David Nkansah',
    prayerRequest: 'Praying for open doors in career and job searching.',
    assignedFollowUpOfficer: 'Pastor John',
    status: 'New',
    followUpNotes: 'Assigned follow up. Sent initial greeting message.'
  },
  {
    id: 'V-202',
    name: 'Linda Martinez',
    phone: '+1 (555) 123-0000',
    email: 'linda.m@example.com',
    visitDate: getDateOffset(-9), // 2026-06-21
    invitedBy: 'Sarah Jenkins',
    prayerRequest: 'Healings for mother diagnosed with diabetes.',
    assignedFollowUpOfficer: 'Deaconess Mary',
    status: 'Contacted',
    followUpNotes: 'Spoke with her over the phone. She felt welcomed and appreciated the choir sermon.'
  },
  {
    id: 'V-203',
    name: 'Christian Okoye',
    phone: '+234 812 345 6789',
    email: 'okoye.christian@outlook.com',
    visitDate: getDateOffset(-16), // 2026-06-14
    invitedBy: 'Patricia Alabi',
    prayerRequest: 'Spiritual strength and guidance.',
    assignedFollowUpOfficer: 'Brother James',
    status: 'Converted',
    followUpNotes: 'Successfully completed visitor class. Now added to department queue. Wants to join Ushers.'
  },
  {
    id: 'V-204',
    name: 'Sophia Anderson',
    phone: '+1 (555) 901-2345',
    email: 'sophia.a@gmail.com',
    visitDate: getDateOffset(-2), // 2026-06-28
    invitedBy: 'Social Media Ad',
    prayerRequest: 'Moving to a new house next week, safe trip and transition.',
    assignedFollowUpOfficer: 'Samuel Owusu',
    status: 'In Progress',
    followUpNotes: 'Sent WhatsApp text. She replied with thanksgiving.'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'A-301',
    date: getDateOffset(-2), // Sunday Service
    serviceType: 'Sunday Service',
    headcount: 145,
    attendedMemberIds: ['M-101', 'M-102', 'M-103', 'M-104', 'M-105', 'M-106', 'M-107'],
    notes: 'Sunday Worship and Thanksgiving Service. Beautiful atmosphere. 4 first-time visitors welcomed.'
  },
  {
    id: 'A-302',
    date: getDateOffset(-4), // Friday Prayer Meeting
    serviceType: 'Prayer Meeting',
    headcount: 68,
    attendedMemberIds: ['M-101', 'M-103', 'M-104', 'M-107'],
    notes: 'Mid-year Breakthrough Prayer Night. Strong move of God. Focusing on territorial breakthroughs.'
  },
  {
    id: 'A-303',
    date: getDateOffset(-6), // Midweek Service
    serviceType: 'Midweek Service',
    headcount: 80,
    attendedMemberIds: ['M-101', 'M-102', 'M-104', 'M-106'],
    notes: 'Bible Study on the book of Ephesians (Chapter 4 - Unity in Christ).'
  },
  {
    id: 'A-304',
    date: getDateOffset(-9), // Previous Sunday Service
    serviceType: 'Sunday Service',
    headcount: 138,
    attendedMemberIds: ['M-101', 'M-102', 'M-103', 'M-104', 'M-105', 'M-106', 'M-107', 'M-108'],
    notes: 'Father’s Day Sunday Celebration. Sermon focused on godly fatherhood.'
  }
];

export const INITIAL_GIVING: GivingRecord[] = [
  {
    id: 'G-401',
    memberId: 'M-101',
    donorName: 'David Nkansah',
    date: getDateOffset(-2),
    type: 'Tithe',
    amount: 500,
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'REC-2026-0001'
  },
  {
    id: 'G-402',
    memberId: 'M-102',
    donorName: 'Sarah Jenkins',
    date: getDateOffset(-2),
    type: 'Tithe',
    amount: 350,
    paymentMethod: 'Card',
    receiptNumber: 'REC-2026-0002'
  },
  {
    id: 'G-403',
    donorName: 'Anonymous Member',
    date: getDateOffset(-2),
    type: 'Offering',
    amount: 1250,
    paymentMethod: 'Cash',
    receiptNumber: 'REC-2026-0003'
  },
  {
    id: 'G-404',
    memberId: 'M-103',
    donorName: 'Brother James Taylor',
    date: getDateOffset(-2),
    type: 'Project',
    amount: 1000,
    paymentMethod: 'Cheque',
    receiptNumber: 'REC-2026-0004'
  },
  {
    id: 'G-405',
    memberId: 'M-104',
    donorName: 'Deaconess Mary Mensah',
    date: getDateOffset(-6),
    type: 'Welfare',
    amount: 200,
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'REC-2026-0005'
  },
  {
    id: 'G-406',
    memberId: 'M-106',
    donorName: 'Patricia Alabi',
    date: getDateOffset(-9),
    type: 'Seed',
    amount: 300,
    paymentMethod: 'Card',
    receiptNumber: 'REC-2026-0006'
  },
  {
    id: 'G-407',
    donorName: 'Visitor Thanksgiving',
    date: getDateOffset(-2),
    type: 'Thanksgiving',
    amount: 150,
    paymentMethod: 'Cash',
    receiptNumber: 'REC-2026-0007'
  }
];

export const INITIAL_SERMONS: Sermon[] = [
  {
    id: 'S-501',
    title: 'Answering the Morning Call',
    speaker: 'Pastor John Wilson',
    date: getDateOffset(-2),
    theme: 'Morning devotion, seeking God early, priority in spiritual life',
    bibleVerse: 'Psalm 63:1 - "O God, you are my God; early will I seek you..."',
    notes: `### Introduction
Seeking God early establishes the tone of your life. When the morning rises, where do your eyes turn?

### Key Points:
1. **Priority of Presence**: Before talking to people, talk to God. The morning altar prepares you for the struggles of the midday.
2. **The Discipline of Seeking**: Seeking early is a choice of love. It requires putting down the phone, waking up 15 minutes earlier, and declaring His lordship.
3. **The Yield of Early Devotion**: Peace, direction, and spiritual strength.

### Practical Steps:
- Dedicate the first 10 minutes of your day to prayer.
- Declare Psalm 91 before getting out of bed.
- Write down one thing you hear in the stillness.`,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'S-502',
    title: 'The Blueprint of Unity',
    speaker: 'Pastor John Wilson',
    date: getDateOffset(-6),
    theme: 'Unity, church departments, working together for Christ',
    bibleVerse: 'Ephesians 4:16 - "From whom the whole body, joined and held together by every supporting ligament..."',
    notes: `### Introduction
The church is not a building, but a body. No part is minor. Each department has a crucial assignment.

### Key Points:
1. **The Interdependence of Grace**: The Choir needs the Ushers; the Ushers need the Media; the Media needs the Prayer Team.
2. **Guarding against Friction**: Friction comes when we look at our department as superior. Humility is the grease that keeps the machine of ministry moving.
3. **The Combined Yield**: A perfect testimony of Christ's love to visitors.

### Conclusion:
Serve with joy, knowing that even the smallest task holds eternal weight.`,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'S-503',
    title: 'Covenant Blessings of Giving',
    speaker: 'Dr. Samuel Boateng',
    date: getDateOffset(-16),
    theme: 'Finance, Tithe, Generosity, Faithfulness',
    bibleVerse: 'Malachi 3:10 - "Bring the whole tithe into the storehouse, that there may be food in my house..."',
    notes: `### Introduction
Giving is not transaction; it is translation. We translate temporal paper money into eternal seeds of trust and obedience.

### Key Points:
1. **The Heart Behind the Hand**: God looks at the giver before the gift. 2 Cor 9:7 tells us God loves a cheerful giver.
2. **Breaking Financial Strongholds**: Faithfulness in tithes represents taking God as your financial senior partner.
3. **Open Windows of Heaven**: Pouring out blessings that cannot be contained.`
  }
];

export const INITIAL_EVENTS: ChurchEvent[] = [
  {
    id: 'E-601',
    title: 'Mid-Year Glory Crusade 2026',
    date: getDateOffset(4), // Future Crusade
    time: '18:00',
    location: 'Morning Church Main Arena & Outdoor Park',
    category: 'Crusade',
    description: 'A 3-day outdoor power, miracles, salvation, and breakthrough revival. Invite friends, family, and the sick.',
    rsvps: ['dnkansah29@gmail.com', 'sophia.a@gmail.com', 'eboateng@gmail.com']
  },
  {
    id: 'E-602',
    title: 'Youth Sound Mind Conference',
    date: getDateOffset(11), // Future Conference
    time: '10:00',
    location: 'Youth Fellowship Hall',
    category: 'Conference',
    description: 'Empowering young leaders with career development skills, spiritual mental health toolkits, and interactive panel sessions with industry professionals.',
    rsvps: ['dnkansah29@gmail.com', 'sarah.j@morningchurch.org']
  },
  {
    id: 'E-603',
    title: 'Department Leaders Prayer Retreat',
    date: getDateOffset(-3), // Past event
    time: '07:00',
    location: 'Mount Sinai Prayer Campground',
    category: 'Retreat',
    description: 'An intensive fasting, planning, and prayer gathering for all department heads and executive workers.',
    rsvps: ['mary.mensah@hotmail.com', 'james.t@gmail.com', 'sarah.j@morningchurch.org']
  },
  {
    id: 'E-604',
    title: 'All-Night Prayer & Deliverance Service',
    date: getDateOffset(18),
    time: '22:00',
    location: 'Main Chapel',
    category: 'Prayer Meeting',
    description: 'Waging spiritual warfare, breaking yokes, and speaking divine declarations over the second half of the year.',
    rsvps: []
  }
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'D-01',
    name: 'Choir',
    leaderName: 'Sarah Jenkins',
    leaderId: 'M-102',
    membersCount: 18,
    meetingSchedule: 'Saturdays at 4:00 PM',
    budget: 1500,
    spent: 450,
    reports: [
      { date: getDateOffset(-2), content: 'Sustained rehearsal for the Mid-Year Crusade. Added 2 new choir gowns.' },
      { date: getDateOffset(-9), content: 'Special music piece performed excellently. Attendance was 15 singers.' }
    ]
  },
  {
    id: 'D-02',
    name: 'Ushers',
    leaderName: 'Mark Robertson',
    leaderId: 'M-105',
    membersCount: 12,
    meetingSchedule: 'Saturdays at 5:00 PM',
    budget: 800,
    spent: 120,
    reports: [
      { date: getDateOffset(-2), content: 'Welcomed 145 members and visitors seamlessly. Handled sitting arrangements without incident.' }
    ]
  },
  {
    id: 'D-03',
    name: 'Media',
    leaderName: 'David Nkansah',
    leaderId: 'M-101',
    membersCount: 8,
    meetingSchedule: 'Wednesdays at 5:30 PM',
    budget: 3500,
    spent: 1850,
    reports: [
      { date: getDateOffset(-2), content: 'Sunday service live broadcast had 400 virtual viewers. Set up a new sound mixer.' },
      { date: getDateOffset(-6), content: 'Midweek live stream executed. Audio quality improved significantly.' }
    ]
  },
  {
    id: 'D-04',
    name: 'Prayer Team',
    leaderName: 'Brother James Taylor',
    leaderId: 'M-103',
    membersCount: 15,
    meetingSchedule: 'Mondays and Fridays at 6:00 PM',
    budget: 500,
    spent: 50,
    reports: [
      { date: getDateOffset(-4), content: 'Led the breakthrough prayer night. Strong spiritual presence.' }
    ]
  },
  {
    id: 'D-05',
    name: 'Protocol',
    leaderName: 'Samuel Owusu',
    leaderId: 'M-107',
    membersCount: 6,
    meetingSchedule: 'Saturdays at 3:00 PM',
    budget: 600,
    spent: 150,
    reports: []
  },
  {
    id: 'D-06',
    name: 'Children Ministry',
    leaderName: 'Patricia Alabi',
    leaderId: 'M-106',
    membersCount: 10,
    meetingSchedule: 'Saturdays at 2:00 PM',
    budget: 1200,
    spent: 380,
    reports: [
      { date: getDateOffset(-2), content: 'Children Sunday School had 32 children. Taught on "Obedience of David". Prepared light snacks.' }
    ]
  },
  {
    id: 'D-07',
    name: 'Welfare',
    leaderName: 'Deaconess Mary Mensah',
    leaderId: 'M-104',
    membersCount: 9,
    meetingSchedule: 'First Sunday of each month at 1:00 PM',
    budget: 2000,
    spent: 900,
    reports: [
      { date: getDateOffset(-6), content: 'Disbursed welfare funds to 2 bereaved members. Visited Sister Beatrice at the hospital.' }
    ]
  },
  {
    id: 'D-08',
    name: 'Evangelism',
    leaderName: 'Grace Thompson',
    leaderId: 'M-108',
    membersCount: 14,
    meetingSchedule: 'Saturdays at 10:00 AM',
    budget: 1000,
    spent: 300,
    reports: [
      { date: getDateOffset(-9), content: 'Morning tract distribution at West Hills. Had 5 fruitful discussions; 2 promised to visit.' }
    ]
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ANN-701',
    title: 'Mid-Year Crusade Flyers Available!',
    content: 'Please pick up hardcopy flyers from the Protocol desk or download the digital flyer from the media library to share on your WhatsApp status and Facebook pages. Let us aggressively evangelize for the upcoming 3-day Crusade!',
    date: getDateOffset(-1),
    category: 'General',
    status: 'Published'
  },
  {
    id: 'ANN-702',
    title: 'Choir Special Rehearsals',
    content: 'All Choir singers are required to attend an intensive rehearsal this Friday at 5:00 PM in preparation for the crusade ministration. Please be punctual.',
    date: getDateOffset(-2),
    category: 'Department',
    status: 'Published'
  },
  {
    id: 'ANN-703',
    title: 'Welfare Seed Support',
    content: 'The Welfare team is organizing special food and clothing donations for local shelters. Dropping points are located in the Children Ministry Hall. Let us bless others as God has blessed us.',
    date: getDateOffset(-3),
    category: 'General',
    status: 'Published'
  },
  {
    id: 'ANN-704',
    title: 'Couples Fellowship Launch',
    content: 'We are launching the "Knot in Heaven" couples fellowship next month. Sign-up forms are available at the administration office.',
    date: getDateOffset(1),
    category: 'General',
    status: 'Draft'
  }
];

export const INITIAL_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'P-801',
    submittedBy: 'David Nkansah',
    email: 'dnkansah29@gmail.com',
    request: 'Praying for full recovery and health for my father who is currently recuperating from surgery. May God reinforce his bones and grant complete restoration.',
    isPrivate: false,
    status: 'Prayed For',
    date: getDateOffset(-3),
    notes: 'Lifted in corporate prayers during Friday Prayer meeting. Pastor called him to encourage him.'
  },
  {
    id: 'P-802',
    submittedBy: 'Grace Thompson',
    email: 'grace.thompson@gmail.com',
    request: 'I am taking a professional licensing examination on July 5th. Praying for divine wisdom, recall, and outstanding success without anxiety.',
    isPrivate: false,
    status: 'Pending',
    date: getDateOffset(-1)
  },
  {
    id: 'P-803',
    submittedBy: 'Anonymous Sister',
    email: 'member@morningchurch.org',
    request: 'Confidential: Marital restoration and understanding in my home. There is severe tension and silence.',
    isPrivate: true,
    status: 'Followed Up',
    date: getDateOffset(-5),
    notes: 'Referred to Pastor for counseling. Counseling session scheduled.'
  },
  {
    id: 'P-804',
    submittedBy: 'Emmanuel Boateng',
    email: 'eboateng@gmail.com',
    request: 'Looking for a sustainable breakthrough in my newly launched agricultural export business. Praying for clients, connections, and smooth custom clearances.',
    isPrivate: false,
    status: 'Pending',
    date: getDateOffset(-2)
  }
];

export const INITIAL_FOLLOW_UPS: FollowUpRecord[] = [
  {
    id: 'F-901',
    targetName: 'Emmanuel Boateng',
    type: 'Visitor',
    assignedTo: 'Pastor John Wilson',
    status: 'Ongoing',
    notes: 'First time visitor on Sunday. Assigned Pastor John. First welcome message sent. He is very responsive and interested in joining the agricultural cell.',
    dateCreated: getDateOffset(-1)
  },
  {
    id: 'F-902',
    targetName: 'Brother Matthew (Sick)',
    type: 'Sick',
    assignedTo: 'Deaconess Mary Mensah',
    status: 'Completed',
    notes: 'Visitations team went to the hospital to pray with him and deliver a welfare envelope. He was highly encouraged and is recovering well at home now.',
    dateCreated: getDateOffset(-5)
  },
  {
    id: 'F-903',
    targetName: 'Sister Grace Thompson (Inactive)',
    type: 'Inactive',
    assignedTo: 'Grace Thompson',
    status: 'Pending',
    notes: 'Member has missed Sunday services for 3 consecutive weeks. Need to check if everything is alright or if work schedule is conflicting.',
    dateCreated: getDateOffset(-2)
  },
  {
    id: 'F-904',
    targetName: 'Timothy Cole (New Convert)',
    type: 'New Convert',
    assignedTo: 'Evangelism Team',
    status: 'Ongoing',
    notes: 'Accepted Christ during the Friday prayer night altar call. Registered for basic converts class starting this Sunday.',
    dateCreated: getDateOffset(-3)
  }
];

export const INITIAL_DEVOTIONALS: Devotional[] = [
  {
    date: '2026-06-30', // Today's date!
    title: 'The Altar of the Morning',
    verse: 'Early in the morning, while it was still dark, Jesus got up, left the house, and went out to a secluded place, and was praying there.',
    reference: 'Mark 1:35',
    devotionText: `Waking up early is more than just beat-the-traffic protocol; it is a declaration of priority. In Mark 1:35, we find the Savior Himself withdrawing before the demands of the day could grab His attention. If Jesus—being perfect and divine—found it crucial to receive His marching orders from the Father in the morning quiet, how much more do we need it?

When we prayerfully align our minds early, we prepare ourselves to handle whatever storms, decisions, or negotiations the day holds. The morning altar anchors the soul so that the midday pressures do not drift us away. Seek Him early, and watch the day fall into divine alignment.`,
    prayerPoints: [
      'Father, I give You the first fruit of my day, my thoughts, and my energy.',
      'Grace to establish a daily morning prayer altar and maintain discipline in Your Presence.',
      'Order my steps today; let my words represent Your kingdom.'
    ],
    declaration: 'Today, I am guided by divine wisdom. I seek God early, and His favor goes before me like a shield!'
  },
  {
    date: '2026-07-01', // Tomorrow
    title: 'Rivers in the Wasteland',
    verse: 'Behold, I will do something new, now it will spring forth; will you not be aware of it? I will even make a roadway in the wilderness, rivers in the desert.',
    reference: 'Isaiah 43:19',
    devotionText: `We often look at dry seasons in our lives as signs of spiritual abandonment. Yet, God specializes in using barren backdrops to display His supernatural irrigation. He doesn't just guide you out of the desert; He forms rivers right inside it.

If you are facing a wilderness in your business, family, or health, realize that this is exactly where the 'new thing' is slated to spring forth. Guard your focus. Do not keep crying about past glories or Egyptian support. Look forward, obey the next command, and watch divine waters gush out.`,
    prayerPoints: [
      'Father, remove spiritual blindness; let me see the rivers You are creating in my desert.',
      'I receive grace to release past failures and walk boldly into the new doors You are opening.',
      'Deliver my family and career from every form of dry spell.'
    ],
    declaration: 'My desert is turning into an oasis! God is doing a new thing in my life, and I walk in full awareness of it.'
  },
  {
    date: '2026-06-29', // Yesterday
    title: 'The Shield of Active Faith',
    verse: 'In addition to all, taking up the shield of faith with which you will be able to extinguish all the flaming arrows of the evil one.',
    reference: 'Ephesians 6:16',
    devotionText: `Faith is not passive optimism. It is described as a shield—something you must actively "take up". The arrows of doubt, sickness, failure, and anxiety are constantly in flight. They will hit if there is no barrier.

The shield of faith is your spoken agreement with God's Word. When the enemy fires "You will fail", faith lifts the shield: "I am more than a conqueror." When the arrow of "You are sick" flies, faith answers: "By His stripes, I am healed." Keep your shield active.`,
    prayerPoints: [
      'Father, I lift up my shield of faith against every negative voice and prediction.',
      'I declare my trust in Your written Word and promise over my current circumstances.',
      'Strengthen my inner man to stand immovable in times of trial.'
    ],
    declaration: 'My shield of faith is lifted high. No flaming arrow of doubt or sickness can penetrate my life!'
  }
];

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'MED-001',
    title: 'Mid-Year Glory Crusade Flyer',
    type: 'Flyer',
    url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=800&auto=format&fit=crop&q=60',
    approved: true,
    date: getDateOffset(-2)
  },
  {
    id: 'MED-002',
    title: 'Youth Sound Mind Guest Speaker Graphic',
    type: 'Flyer',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=60',
    approved: true,
    date: getDateOffset(-1)
  },
  {
    id: 'MED-003',
    title: 'Testimony: Healed of Chronic Knee Pain',
    type: 'Testimony',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop&q=60',
    approved: true,
    date: getDateOffset(-2),
    submittedBy: 'Linda Martinez'
  },
  {
    id: 'MED-004',
    title: 'Sunday Worship Service Live Stream Recording',
    type: 'Video',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
    approved: true,
    date: getDateOffset(-2)
  },
  {
    id: 'MED-005',
    title: 'Testimony: Job Breakthrough After 1 Year of Waiting',
    type: 'Testimony',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
    approved: false, // Needs approval!
    date: getDateOffset(0),
    submittedBy: 'Samuel Owusu'
  }
];

export const INITIAL_FINANCE_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: 'FT-001',
    date: getDateOffset(-2),
    type: 'Income',
    category: 'Tithe',
    amount: 850,
    description: 'Sunday Service Tithes (M-101: 500, M-102: 350)',
    approvedBy: 'Finance Officer'
  },
  {
    id: 'FT-002',
    date: getDateOffset(-2),
    type: 'Income',
    category: 'Offering',
    amount: 1250,
    description: 'Sunday Service Corporate Offering',
    approvedBy: 'Finance Officer'
  },
  {
    id: 'FT-003',
    date: getDateOffset(-2),
    type: 'Income',
    category: 'Project Funds',
    amount: 1000,
    description: 'Brother James Taylor contribution to Temple Project',
    approvedBy: 'Finance Officer'
  },
  {
    id: 'FT-004',
    date: getDateOffset(-5),
    type: 'Expense',
    category: 'Welfare Disbursements',
    amount: 500,
    description: 'Hospital visit welfare support for Sister Beatrice',
    approvedBy: 'Super Admin'
  },
  {
    id: 'FT-005',
    date: getDateOffset(-4),
    type: 'Expense',
    category: 'Utilities',
    amount: 320,
    description: 'Chapel Electricity Bill payment',
    approvedBy: 'Church Administrator'
  },
  {
    id: 'FT-006',
    date: getDateOffset(-6),
    type: 'Income',
    category: 'Welfare',
    amount: 200,
    description: 'Deaconess Mary welfare donation seed',
    approvedBy: 'Finance Officer'
  },
  {
    id: 'FT-007',
    date: getDateOffset(-9),
    type: 'Income',
    category: 'Seed',
    amount: 300,
    description: 'Patricia Alabi seed offering',
    approvedBy: 'Finance Officer'
  },
  {
    id: 'FT-008',
    date: getDateOffset(-10),
    type: 'Expense',
    category: 'Maintenance',
    amount: 450,
    description: 'Repairing main generator batteries',
    approvedBy: 'Super Admin'
  }
];

export const INITIAL_CHURCHES: Church[] = [
  {
    id: 'C-001',
    name: 'Morning Church Main Arena',
    location: 'Accra, Ghana',
    pastor: 'Pastor John Wilson',
    foundedDate: '2020-01-01',
    membersCount: 145,
    email: 'info@morningchurch.org',
    phone: '+233 24 123 4567'
  },
  {
    id: 'C-002',
    name: 'Morning Church Grace Cathedral',
    location: 'London, UK',
    pastor: 'Pastor Sarah Jenkins',
    foundedDate: '2023-05-15',
    membersCount: 82,
    email: 'grace@morningchurch.org',
    phone: '+44 20 7946 0192'
  },
  {
    id: 'C-003',
    name: 'Morning Church Resurrection Temple',
    location: 'Houston, Texas, USA',
    pastor: 'Dr. Samuel Boateng',
    foundedDate: '2025-09-01',
    membersCount: 54,
    email: 'resurrection@morningchurch.org',
    phone: '+1 (555) 918-2045'
  }
];

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'BK-001',
    title: 'The Power of Seeking God Early',
    author: 'Pastor John Wilson',
    price: 15.00,
    description: 'Learn the secrets of establishing a highly disciplined, spiritually robust morning prayer altar to unlock daily breakthrough.',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=60',
    pages: [
      'Page 1: The Altar of the Dawn.\n\nSeeking God early is more than an early bird special; it is an act of spiritual dominance. When you rise while it is still dark, you capture the gates of the day. In this book, we will study how our savior Jesus Christ always departed to a solitary place to receive instructions for His day.',
      'Page 2: Establishing the Routine.\n\nDiscipline is the bridge between desire and accomplishment. To build a robust morning altar, start with 15 minutes of uninterrupted prayer, praise, and Bible study. Do not look at your smartphone or respond to emails. The morning belongs to the Lord.',
      'Page 3: Spiritual Yields.\n\nThe early morning hours carry an unparalleled quietness. Your mind is uncluttered, and your spirit is fertile. As you pour out your heart, expect divine alignment, supernatural favor, and strategic wisdom for your business, career, and family.'
    ]
  },
  {
    id: 'BK-002',
    title: 'Financial Altar & Covenant Blessings',
    author: 'Dr. Samuel Boateng',
    price: 20.00,
    description: 'A comprehensive biblical blueprint to building a prosperous financial house, breaking debt strongholds, and walking in covenant abundance.',
    coverUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=60',
    pages: [
      'Page 1: The Foundations of Covenant Wealth.\n\nWealth in the kingdom of God is not measured by the size of your bank account, but by the size of your obedience. God establishes His covenant on earth through your giving. Tithing is the opening key; generous seed-sowing is the multiplier.',
      'Page 2: Overcoming Financial Strife.\n\nTo break free from financial anxiety, you must shift your perspective from transaction to translation. Do not view tithing as a tax; view it as partnering with the Almighty. He promises to rebuke the devourer on your behalf.',
      'Page 3: Strategic Generosity.\n\nWhen you give to the house of God, you activate spiritual laws. Invest in welfare, fund crusades, and support the spread of the gospel. The harvest is not just money; it is safety, wisdom, and open doors that no man can shut.'
    ]
  },
  {
    id: 'BK-003',
    title: 'The Blueprint of Unity & Ministry',
    author: 'Pastor John Wilson',
    price: 12.00,
    description: 'Discover the divine architecture behind effective church departments, building strong teams, and keeping ministerial joints well-supplied.',
    coverUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop&q=60',
    pages: [
      'Page 1: The Ligaments of the Ministry.\n\nThe church is not a one-man show; it is an organized, interdependent body of Christ. The Ushers need the Prayer team; the Choir needs the Media; and the Media needs the Pastoral oversight. When one joint fails, the whole body suffers.',
      'Page 2: Guarding Against Departmental Pride.\n\nPride is the silent killer of unity. No department is superior to another. The Protocol officer at the entrance performs an assignment as holy as the preacher at the pulpit. Serve with humility and seek first the corporate vision.',
      'Page 3: The Synergy of Harmony.\n\nWhen a congregation operates in complete harmony, visitors experience the love of Christ before they even hear the sermon. It creates a smooth path for the Holy Spirit to work miracles and convert souls. Stand united!'
    ]
  }
];

export const INITIAL_LIVESTREAMS: LiveStream[] = [
  {
    id: 'LS-001',
    title: 'Sunday Mid-Year Glory Celebration Service',
    speaker: 'Pastor John Wilson',
    date: '2026-07-05',
    time: '09:00 AM',
    status: 'Upcoming',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Join us live this Sunday for an explosive service filled with powerful worship, testimonies, and a life-transforming sermon.'
  },
  {
    id: 'LS-002',
    title: 'All-Night Breakthrough & Deliverance Live Stream',
    speaker: 'Dr. Samuel Boateng',
    date: '2026-06-30', // Matches today's date!
    time: '10:00 PM',
    status: 'Live',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'We are LIVE! Tune in from wherever you are for our monthly breakthrough night. Prepare your prayer altar.'
  },
  {
    id: 'LS-003',
    title: 'Midweek Study: The Walk of Faith',
    speaker: 'Pastor Sarah Jenkins',
    date: '2026-07-02',
    time: '06:30 PM',
    status: 'Upcoming',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'A deep-dive, interactive study on the faith blueprints in Hebrews Chapter 11. Bring your notebooks and questions.'
  }
];

// Local Storage Helper Utilities
export const loadData = <T>(key: string, initialData: T): T => {
  try {
    const saved = localStorage.getItem(`morning_church_${key}`);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (e) {
    console.error(`Failed to load key "${key}" from localStorage:`, e);
  }
  return initialData;
};

export const saveData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`morning_church_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save key "${key}" to localStorage:`, e);
  }
};
