export type Role = 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LoanStatus = 'PENDING_GROUP_ADMIN' | 'PENDING_SUPER_ADMIN' | 'APPROVED' | 'REJECTED';
export type PaymentMode = 'UPI' | 'CASH';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  district: string;
  status: UserStatus;
  role: Role;
  group_id: string | null;
  group_name?: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  group_name: string;
  area: string;
  district: string;
  group_admin_id: string | null;
  group_admin_name?: string;
  group_admin_email?: string | null;
  group_admin_phone?: string | null;
  member_count?: number;
  created_at: string;
}

export interface LoanStatusEntry {
  status: LoanStatus;
  updated_at: string;
  updated_by_name: string;
  updated_by_role: string;
  note?: string;
}

export interface Loan {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  group_id: string;
  group_name: string;
  amount: number;
  payment_mode: PaymentMode;
  upi_email?: string;
  purpose?: string;
  status: LoanStatus;
  requested_at: string;
  status_history: LoanStatusEntry[];
}

export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: Role;
  text: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  author_name: string;
  created_at: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sent_at: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  preview_url?: string;
  info?: string;
}

export type CrisisType = 'HEALTH' | 'DOMESTIC' | 'ACCIDENT' | 'DISASTER' | 'OTHER';

export interface SosAlert {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  group_id: string;
  group_name: string;
  crisis_type: string;
  description: string;
  amount_requested?: number;
  status: 'ACTIVE' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
  resolution_note?: string;
}

export interface AttendanceEntry {
  user_id: string;
  user_name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface MeetingRecord {
  id: string;
  group_id: string;
  group_name: string;
  date: string;
  topic: string;
  attendance: AttendanceEntry[];
  total_savings_collected: number;
  resolutions: string;
  created_by_name: string;
  created_at: string;
}

export type Language = 'en' | 'ta';
