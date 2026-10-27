import {
  User,
  Group,
  Loan,
  Message,
  Announcement,
  EmailLog,
  SosAlert,
  MeetingRecord,
  SmtpStatusResponse,
  SmtpConfigInfo,
} from './types';

let currentToken: string | null = localStorage.getItem('mk_token');

export function setApiToken(token: string | null) {
  currentToken = token;
  if (token) {
    localStorage.setItem('mk_token', token);
  } else {
    localStorage.removeItem('mk_token');
  }
}

export function getApiToken(): string | null {
  return currentToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data && typeof data === 'object' && data.error ? data.error : `Request failed with status ${res.status}`;
    const err: any = new Error(errorMsg);
    err.details = data?.details;
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; phone: string; email: string; area: string; district: string; password: string }) =>
    request<{ message: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User; group: Group | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () =>
    request<{ user: User; group: Group | null }>('/api/auth/me'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  // Users
  getPendingUsers: () =>
    request<User[]>('/api/users/pending'),

  getUsers: () =>
    request<User[]>('/api/users'),

  approveUser: (id: string, body: { group_id?: string; is_group_admin?: boolean }) =>
    request<{ message: string; user: User }>(`/api/users/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  rejectUser: (id: string) =>
    request<{ message: string; user: User }>(`/api/users/${id}/reject`, {
      method: 'POST',
    }),

  allocateUserGroup: (id: string, groupId: string) =>
    request<{ message: string; user: User }>(`/api/users/${id}/allocate-group`, {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId }),
    }),

  assignUserRole: (id: string, role: 'USER' | 'GROUP_ADMIN') =>
    request<{ message: string; user: User }>(`/api/users/${id}/assign-role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Groups
  getGroups: () =>
    request<Group[]>('/api/groups'),

  getGroup: (id: string) =>
    request<Group & { members: User[]; group_admin: User | null }>(`/api/groups/${id}`),

  suggestGroups: (area: string, district: string) =>
    request<{ exact_matches: Group[]; district_matches: Group[]; all_groups: Group[] }>(
      `/api/groups/suggest?area=${encodeURIComponent(area)}&district=${encodeURIComponent(district)}`
    ),

  createGroup: (body: { group_name: string; area: string; district: string; group_admin_id?: string }) =>
    request<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  setGroupAdmin: (groupId: string, userId: string) =>
    request<{ message: string; group: Group }>(`/api/groups/${groupId}/set-admin`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  // Loans
  getLoans: () =>
    request<Loan[]>('/api/loans'),

  getLoan: (id: string) =>
    request<Loan>(`/api/loans/${id}`),

  submitLoanRequest: (body: { amount: number; payment_mode: 'UPI' | 'CASH'; upi_email?: string; purpose?: string }) =>
    request<{ message: string; loan: Loan }>('/api/loans/request', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  groupApproveLoan: (id: string, note?: string) =>
    request<{ message: string; loan: Loan }>(`/api/loans/${id}/group-approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  groupRejectLoan: (id: string, note?: string) =>
    request<{ message: string; loan: Loan }>(`/api/loans/${id}/group-reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  superApproveLoan: (id: string, note?: string) =>
    request<{ message: string; loan: Loan; emailResult?: any }>(`/api/loans/${id}/super-approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  superRejectLoan: (id: string, note?: string) =>
    request<{ message: string; loan: Loan }>(`/api/loans/${id}/super-reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Messages / Chat
  getMessages: (groupId: string) =>
    request<{ group: { id: string; name: string; area: string; district: string }; messages: Message[] }>(
      `/api/groups/${groupId}/messages`
    ),

  sendMessage: (groupId: string, text: string) =>
    request<Message>(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Announcements
  getAnnouncements: () =>
    request<Announcement[]>('/api/announcements'),

  createAnnouncement: (body: { title: string; message: string }) =>
    request<Announcement>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Emails audit & SMTP configuration
  getEmails: () =>
    request<EmailLog[]>('/api/emails'),

  getSmtpConfig: () =>
    request<SmtpStatusResponse>('/api/emails/smtp-config'),

  saveSmtpConfig: (body: Partial<SmtpConfigInfo> & { pass?: string }) =>
    request<{
      message: string;
      verified: boolean;
      verification_message?: string;
      verification_error?: string;
      config: SmtpConfigInfo;
    }>('/api/emails/smtp-config', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifySmtp: (body?: Partial<SmtpConfigInfo> & { pass?: string }) =>
    request<{ success: boolean; message: string; error?: string }>('/api/emails/verify-smtp', {
      method: 'POST',
      body: JSON.stringify(body || {}),
    }),

  resetSmtpToSandbox: () =>
    request<{ message: string; active_mode: string }>('/api/emails/reset-smtp', {
      method: 'POST',
    }),

  sendTestEmail: (body: { to?: string; userName?: string; amount?: number }) =>
    request<{ message: string; log: EmailLog; delivery_mode: string }>('/api/emails/test', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // SOS Emergency & Micro-Grant
  getSosAlerts: () =>
    request<SosAlert[]>('/api/sos'),

  createSosAlert: (body: { crisis_type: string; description: string; amount_requested?: number }) =>
    request<{ message: string; alert: SosAlert }>('/api/sos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resolveSosAlert: (id: string, resolution_note?: string) =>
    request<{ message: string; alert: SosAlert }>(`/api/sos/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_note }),
    }),

  // Meetings (MoM) & Attendance
  getMeetings: () =>
    request<MeetingRecord[]>('/api/meetings'),

  createMeeting: (body: {
    group_id?: string;
    date: string;
    topic: string;
    attendance: Array<{ user_id: string; user_name: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }>;
    total_savings_collected: number;
    resolutions: string;
  }) =>
    request<{ message: string; meeting: MeetingRecord }>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
