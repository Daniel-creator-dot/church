const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? '/api' : 'https://churchapi-z9bu.onrender.com/api');

// Generic API helper
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
    } catch {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

// Members API
export const membersApi = {
  getAll: () => apiCall('/members'),
  getById: (id: number) => apiCall(`/members/${id}`),
  create: (data: any) => apiCall('/members', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/members/${id}`, {
    method: 'DELETE',
  }),
};

// Events API
export const eventsApi = {
  getAll: () => apiCall('/events'),
  getById: (id: number) => apiCall(`/events/${id}`),
  create: (data: any) => apiCall('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/events/${id}`, {
    method: 'DELETE',
  }),
  register: (id: number, memberId: number) => apiCall(`/events/${id}/register`, {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId }),
  }),
  getRegistrations: (id: number) => apiCall(`/events/${id}/registrations`),
};

// Donations API
export const donationsApi = {
  getAll: () => apiCall('/donations'),
  getById: (id: number) => apiCall(`/donations/${id}`),
  create: (data: any) => apiCall('/donations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getStats: () => apiCall('/donations/stats/summary'),
};

// Ministries API
export const ministriesApi = {
  getAll: () => apiCall('/ministries'),
  getById: (id: number) => apiCall(`/ministries/${id}`),
  create: (data: any) => apiCall('/ministries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/ministries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/ministries/${id}`, {
    method: 'DELETE',
  }),
  getMembers: (id: number) => apiCall(`/ministries/${id}/members`),
  addMember: (id: number, memberId: number, role?: string) => apiCall(`/ministries/${id}/members`, {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId, role }),
  }),
  removeMember: (id: number, memberId: number) => apiCall(`/ministries/${id}/members/${memberId}`, {
    method: 'DELETE',
  }),
};

// Follow-ups API
export const followupsApi = {
  getAll: () => apiCall('/followups'),
  getById: (id: number) => apiCall(`/followups/${id}`),
  getMembers: () => apiCall('/followups/members/list'),
  getLeaders: () => apiCall('/followups/leaders/list'),
  create: (data: any) => apiCall('/followups', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/followups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/followups/${id}`, {
    method: 'DELETE',
  }),
};

// Visitors API
export const visitorsApi = {
  getAll: () => apiCall('/visitors'),
  create: (data: any) => apiCall('/visitors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/visitors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/visitors/${id}`, {
    method: 'DELETE',
  }),
};

// Attendance API
export const attendanceApi = {
  getAll: () => apiCall('/attendance'),
  getById: (id: number) => apiCall(`/attendance/${id}`),
  create: (data: any) => apiCall('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/attendance/${id}`, {
    method: 'DELETE',
  }),
};

// Settings API
export const settingsApi = {
  get: () => apiCall('/settings'),
  updateCurrency: (currencyCode: string, currencySymbol: string) => apiCall('/settings/currency', {
    method: 'PUT',
    body: JSON.stringify({ currencyCode, currencySymbol }),
  }),
};

// Health check
export const healthCheck = () => apiCall('/health');

// Sermons API
export const sermonsApi = {
  getAll: () => apiCall('/sermons'),
  create: (data: any) => apiCall('/sermons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/sermons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/sermons/${id}`, { method: 'DELETE' }),
};

// Announcements API
export const announcementsApi = {
  getAll: () => apiCall('/announcements'),
  create: (data: any) => apiCall('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/announcements/${id}`, { method: 'DELETE' }),
};

// Prayer requests API
export const prayerApi = {
  getAll: () => apiCall('/prayer'),
  getWall: () => apiCall('/prayer/wall'),
  pray: (id: number) => apiCall(`/prayer/${id}/pray`, { method: 'POST' }),
  create: (data: any) => apiCall('/prayer', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/prayer/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/prayer/${id}`, { method: 'DELETE' }),
};

// Devotionals API
export const devotionalsApi = {
  getAll: () => apiCall('/devotionals'),
  create: (data: any) => apiCall('/devotionals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/devotionals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/devotionals/${id}`, { method: 'DELETE' }),
};

// Media API
export const mediaApi = {
  getAll: () => apiCall('/media'),
  create: (data: any) => apiCall('/media', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/media/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/media/${id}`, { method: 'DELETE' }),
};

// --- ChMeetings-inspired APIs ---

export const householdsApi = {
  getAll: () => apiCall('/households'),
  create: (data: any) => apiCall('/households', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/households/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMembers: (id: number) => apiCall(`/households/${id}/members`),
  getUnassignedMembers: () => apiCall('/households/unassigned-members'),
  addMember: (householdId: number, memberId: number) =>
    apiCall(`/households/${householdId}/members`, { method: 'POST', body: JSON.stringify({ member_id: memberId }) }),
  removeMember: (householdId: number, memberId: number) =>
    apiCall(`/households/${householdId}/members/${memberId}`, { method: 'DELETE' }),
  regenerateCode: (id: number) => apiCall(`/households/${id}/regenerate-code`, { method: 'POST' }),
};

export const fundsApi = {
  getAll: () => apiCall('/funds'),
  create: (data: any) => apiCall('/funds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/funds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const pledgesApi = {
  getCampaigns: () => apiCall('/pledges/campaigns'),
  createCampaign: (data: any) => apiCall('/pledges/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (campaignId?: number) => apiCall(campaignId ? `/pledges?campaign_id=${campaignId}` : '/pledges'),
  create: (data: any) => apiCall('/pledges', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/pledges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const volunteersApi = {
  getRoles: () => apiCall('/volunteers/roles'),
  createRole: (data: any) => apiCall('/volunteers/roles', { method: 'POST', body: JSON.stringify(data) }),
  getAssignments: () => apiCall('/volunteers/assignments'),
  createAssignment: (data: any) => apiCall('/volunteers/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id: number, data: any) => apiCall(`/volunteers/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sendReminders: (data: { days?: number; sent_by: string }) => apiCall('/volunteers/remind', { method: 'POST', body: JSON.stringify(data) }),
  sendSmsReminders: (data: { days?: number; sent_by: string }) => apiCall('/volunteers/remind-sms', { method: 'POST', body: JSON.stringify(data) }),
};

export const worshipApi = {
  getSongs: () => apiCall('/worship/songs'),
  createSong: (data: any) => apiCall('/worship/songs', { method: 'POST', body: JSON.stringify(data) }),
  getPlans: () => apiCall('/worship/plans'),
  getPlan: (id: number) => apiCall(`/worship/plans/${id}`),
  createPlan: (data: any) => apiCall('/worship/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: number, data: any) => apiCall(`/worship/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addPlanItem: (planId: number, data: any) => apiCall(`/worship/plans/${planId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updatePlanItem: (planId: number, itemId: number, data: any) => apiCall(`/worship/plans/${planId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanItem: (planId: number, itemId: number) => apiCall(`/worship/plans/${planId}/items/${itemId}`, { method: 'DELETE' }),
  reorderPlanItems: (planId: number, itemIds: number[]) => apiCall(`/worship/plans/${planId}/items/reorder`, { method: 'PUT', body: JSON.stringify({ itemIds }) }),
};

export const communicationsApi = {
  getAll: () => apiCall('/communications'),
  send: (data: any) => apiCall('/communications', { method: 'POST', body: JSON.stringify(data) }),
};

export const formsApi = {
  getAll: () => apiCall('/forms'),
  create: (data: any) => apiCall('/forms', { method: 'POST', body: JSON.stringify(data) }),
  getSubmissions: (id: number) => apiCall(`/forms/${id}/submissions`),
  submit: (id: number, data: any) => apiCall(`/forms/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  ensureVipNomination: () => apiCall('/forms/vip-nomination', { method: 'POST', body: JSON.stringify({}) }),
};

export const financeApi = {
  getAll: () => apiCall('/finance'),
  getSummary: () => apiCall('/finance/summary'),
  create: (data: any) => apiCall('/finance', { method: 'POST', body: JSON.stringify(data) }),
};

export const checkinApi = {
  getAll: (eventId?: number) => apiCall(eventId ? `/checkin?event_id=${eventId}` : '/checkin'),
  getQr: (eventId: number) => apiCall(`/checkin/qr/${eventId}`),
  getSundayQr: () => apiCall('/checkin/sunday-qr'),
  getSundayStats: () => apiCall('/checkin/sunday-stats'),
  getVipProgramQr: () => apiCall('/checkin/vip-program-qr'),
  getVipNominationQr: () => apiCall('/checkin/vip-nomination-qr'),
  getVipProgramStats: () => apiCall('/checkin/vip-program-stats'),
  vipProgramCheckIn: (data: { full_name: string; phone: string }) =>
    apiCall('/checkin/vip-program', { method: 'POST', body: JSON.stringify(data) }),
  lookupFamily: (data: { phone?: string; family_code?: string }) =>
    apiCall('/checkin/lookup-family', { method: 'POST', body: JSON.stringify(data) }),
  familyCheckIn: (data: { event_id: number; member_ids: number[] }) => apiCall('/checkin/family', { method: 'POST', body: JSON.stringify(data) }),
  checkIn: (data: any) => apiCall('/checkin', { method: 'POST', body: JSON.stringify(data) }),
  publicCheckIn: (data: any) => apiCall('/checkin/public', { method: 'POST', body: JSON.stringify(data) }),
  checkOut: (id: number) => apiCall(`/checkin/${id}/checkout`, { method: 'PUT' }),
};

export const messagingApi = {
  getConfig: () => apiCall('/messaging/config'),
  updateConfig: (data: {
    provider?: string;
    smsEnabled?: boolean;
    intekApiKey?: string;
    intekSender?: string;
    intekApiUrl?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioFromNumber?: string;
    clearIntekApiKey?: boolean;
    clearTwilioAuthToken?: boolean;
  }) => apiCall('/messaging/config', { method: 'PUT', body: JSON.stringify(data) }),
  testSms: (data: { phone: string; message?: string }) =>
    apiCall('/messaging/test', { method: 'POST', body: JSON.stringify(data) }),
  getOutbox: (limit?: number) => apiCall(limit ? `/messaging/outbox?limit=${limit}` : '/messaging/outbox'),
};

// Auth API
export const bootstrapApi = {
  load: (opts?: { memberId?: number; email?: string }) => {
    const params = new URLSearchParams();
    if (opts?.memberId) params.set('member_id', String(opts.memberId));
    if (opts?.email) params.set('email', opts.email);
    const qs = params.toString();
    return apiCall(qs ? `/bootstrap?${qs}` : '/bootstrap');
  },
};

// Auth API
export const authApi = {
  login: (email: string, password: string) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  register: (data: any) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  forgotPassword: (email: string) => apiCall('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (data: any) => apiCall('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Insights API
export const insightsApi = {
  getDashboard: () => apiCall('/insights/dashboard'),
};

// Small groups API
export const groupsApi = {
  getAll: () => apiCall('/groups'),
  create: (data: any) => apiCall('/groups', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/groups/${id}`, { method: 'DELETE' }),
  getMembers: (id: number) => apiCall(`/groups/${id}/members`),
  addMember: (id: number, memberId: number, role?: string) => apiCall(`/groups/${id}/members`, {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId, role }),
  }),
  removeMember: (groupId: number, memberId: number) => apiCall(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),
  getMeetings: (id: number) => apiCall(`/groups/${id}/meetings`),
  logMeeting: (id: number, data: any) => apiCall(`/groups/${id}/meetings`, { method: 'POST', body: JSON.stringify(data) }),
};

export const booksApi = {
  getAll: () => apiCall('/books'),
  create: (data: any) => apiCall('/books', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPurchases: (memberId: number) => apiCall(`/books/purchases/${memberId}`),
  purchase: (bookId: number, data: any) => apiCall(`/books/${bookId}/purchase`, { method: 'POST', body: JSON.stringify(data) }),
};

export const liveStreamsApi = {
  getAll: () => apiCall('/livestreams'),
  create: (data: any) => apiCall('/livestreams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/livestreams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/livestreams/${id}`, { method: 'DELETE' }),
};

export const discipleshipApi = {
  getSteps: () => apiCall('/discipleship/steps'),
  createStep: (data: any) => apiCall('/discipleship/steps', { method: 'POST', body: JSON.stringify(data) }),
  getProgress: (memberId: number) => apiCall(`/discipleship/progress/${memberId}`),
  getOverview: () => apiCall('/discipleship/overview'),
  updateProgress: (data: any) => apiCall('/discipleship/progress', { method: 'POST', body: JSON.stringify(data) }),
};
