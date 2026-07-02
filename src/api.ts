const API_BASE_URL = 'http://localhost:3001/api';

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
    throw new Error(`API error: ${response.status} ${response.statusText}`);
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

// Auth API
export const authApi = {
  login: (email: string, password: string) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
};
