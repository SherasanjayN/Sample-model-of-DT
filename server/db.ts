import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
  district: string;
  password_hash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: 'USER' | 'GROUP_ADMIN' | 'SUPER_ADMIN';
  group_id: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  group_name: string;
  area: string;
  district: string;
  group_admin_id: string | null;
  created_at: string;
}

export interface LoanStatusEntry {
  status: 'PENDING_GROUP_ADMIN' | 'PENDING_SUPER_ADMIN' | 'APPROVED' | 'REJECTED';
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
  payment_mode: 'UPI' | 'CASH';
  upi_email?: string;
  purpose?: string;
  status: 'PENDING_GROUP_ADMIN' | 'PENDING_SUPER_ADMIN' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  status_history: LoanStatusEntry[];
}

export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
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
  html?: string;
  sent_at: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  delivery_mode?: 'REAL_SMTP' | 'DEV_ETHEREAL' | 'SIMULATED';
  preview_url?: string;
  info?: string;
  error_details?: string;
}

export interface SmtpConfig {
  enabled: boolean;
  provider: 'gmail' | 'custom' | 'ethereal';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from_name: string;
  from_email: string;
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

interface DatabaseSchema {
  users: User[];
  groups: Group[];
  loans: Loan[];
  messages: Message[];
  announcements: Announcement[];
  emails: EmailLog[];
  sos_alerts: SosAlert[];
  meetings: MeetingRecord[];
  smtp_config?: SmtpConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    groups: [],
    loans: [],
    messages: [],
    announcements: [],
    emails: [],
    sos_alerts: [],
    meetings: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.sos_alerts) this.data.sos_alerts = [];
        if (!this.data.meetings) this.data.meetings = [];
        if (!this.data.emails) this.data.emails = [];
      } catch (err) {
        console.error('Failed to read db.json, creating fresh state', err);
        this.seedDefaults();
        this.save();
        return;
      }
    } else {
      this.seedDefaults();
    }

    this.ensureSuperAdmin();
  }

  private seedDefaults() {
    const salt = bcrypt.genSaltSync(10);
    const superAdminPasswordHash = bcrypt.hashSync('Shera@0404', salt);
    const groupAdminPasswordHash = bcrypt.hashSync('Group@123', salt);
    const memberPasswordHash = bcrypt.hashSync('Member@123', salt);

    const superAdmin: User = {
      id: 'usr_super_admin_seed',
      name: 'Sanjay N (Super Admin)',
      phone: '9876543210',
      email: 'sherasanjayn@gmail.com',
      area: 'Chennai Central',
      district: 'Chennai',
      password_hash: superAdminPasswordHash,
      status: 'APPROVED',
      role: 'SUPER_ADMIN',
      group_id: null,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    };

    const groupAdmin1: User = {
      id: 'usr_ga_1',
      name: 'Kavitha Ramasamy (Group Admin)',
      phone: '9840112233',
      email: 'kavitha.ga@gmail.com',
      area: 'Mylapore',
      district: 'Chennai',
      password_hash: groupAdminPasswordHash,
      status: 'APPROVED',
      role: 'GROUP_ADMIN',
      group_id: 'grp_myla_01',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    };

    const member1: User = {
      id: 'usr_mem_1',
      name: 'Lakshmi Priya (Member)',
      phone: '9840223344',
      email: 'lakshmi.priya@gmail.com',
      area: 'Mylapore',
      district: 'Chennai',
      password_hash: memberPasswordHash,
      status: 'APPROVED',
      role: 'USER',
      group_id: 'grp_myla_01',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    };

    const groupAdmin2: User = {
      id: 'usr_ga_2',
      name: 'Meena Sundaram (Group Admin)',
      phone: '9840334455',
      email: 'meena.madurai@gmail.com',
      area: 'Simmakkal',
      district: 'Madurai',
      password_hash: groupAdminPasswordHash,
      status: 'APPROVED',
      role: 'GROUP_ADMIN',
      group_id: 'grp_mdu_01',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    };

    const group1: Group = {
      id: 'grp_myla_01',
      group_name: 'Mylapore Mahasakthi Kuzhu',
      area: 'Mylapore',
      district: 'Chennai',
      group_admin_id: 'usr_ga_1',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    };

    const group2: Group = {
      id: 'grp_mdu_01',
      group_name: 'Madurai Meenakshi Kuzhu',
      area: 'Simmakkal',
      district: 'Madurai',
      group_admin_id: 'usr_ga_2',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    };

    const announcements: Announcement[] = [
      {
        id: 'ann_1',
        title: 'Monthly Savings & Group Meeting Scheduled',
        message: 'All Magalir Kuzhu members are requested to complete monthly savings contribution before the 10th of every month. The general meeting will be hosted on coming Saturday.',
        author_name: 'Sanjay N (Super Admin)',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'ann_2',
        title: 'Micro-Loan Limit Cap Reminder',
        message: 'Members can apply for emergency loans up to ₹10,000 with 3-tier verification. Disbursals are processed immediately upon Super Admin final sanction.',
        author_name: 'Sanjay N (Super Admin)',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    const messages: Message[] = [
      {
        id: 'msg_1',
        group_id: 'grp_myla_01',
        sender_id: 'usr_ga_1',
        sender_name: 'Kavitha Ramasamy',
        sender_role: 'GROUP_ADMIN',
        text: 'Vanakkam to all members of Mylapore Mahasakthi Kuzhu! Welcome to our group chat.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'msg_2',
        group_id: 'grp_myla_01',
        sender_id: 'usr_mem_1',
        sender_name: 'Lakshmi Priya',
        sender_role: 'USER',
        text: 'Vanakkam Akka. Thank you! We can discuss our weekly meetings and loan applications here.',
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
    ];

    const loans: Loan[] = [
      {
        id: 'loan_sample_1',
        user_id: 'usr_mem_1',
        user_name: 'Lakshmi Priya',
        user_phone: '9840223344',
        user_email: 'lakshmi.priya@gmail.com',
        group_id: 'grp_myla_01',
        group_name: 'Mylapore Mahasakthi Kuzhu',
        amount: 8000,
        payment_mode: 'UPI',
        upi_email: 'lakshmi.priya@gmail.com',
        purpose: 'Organic vegetables cart expansion',
        status: 'PENDING_GROUP_ADMIN',
        requested_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        status_history: [
          {
            status: 'PENDING_GROUP_ADMIN',
            updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            updated_by_name: 'Lakshmi Priya',
            updated_by_role: 'USER',
            note: 'Loan request submitted with verified UPI email.',
          },
        ],
      },
    ];

    this.data = {
      users: [superAdmin, groupAdmin1, member1, groupAdmin2],
      groups: [group1, group2],
      loans,
      messages,
      announcements,
      emails: [],
      sos_alerts: [],
      meetings: [],
    };
  }

  private ensureSuperAdmin() {
    const adminEmail = 'sherasanjayn@gmail.com';
    const salt = bcrypt.genSaltSync(10);
    const superAdminPasswordHash = bcrypt.hashSync('Shera@0404', salt);

    const existing = this.data.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    if (!existing) {
      this.data.users.unshift({
        id: 'usr_super_admin_seed',
        name: 'Sanjay N (Super Admin)',
        phone: '9876543210',
        email: adminEmail,
        area: 'Chennai Central',
        district: 'Chennai',
        password_hash: superAdminPasswordHash,
        status: 'APPROVED',
        role: 'SUPER_ADMIN',
        group_id: null,
        created_at: new Date().toISOString(),
      });
      this.save();
    } else {
      existing.role = 'SUPER_ADMIN';
      existing.status = 'APPROVED';
      existing.password_hash = superAdminPasswordHash;
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to db.json', err);
    }
  }

  // Getters
  public getUsers(): User[] {
    return this.data.users;
  }

  public getGroups(): Group[] {
    return this.data.groups;
  }

  public getLoans(): Loan[] {
    return this.data.loans;
  }

  public getMessages(groupId?: string): Message[] {
    if (groupId) {
      return this.data.messages.filter(m => m.group_id === groupId);
    }
    return this.data.messages;
  }

  public getAnnouncements(): Announcement[] {
    return this.data.announcements;
  }

  public getEmails(): EmailLog[] {
    return this.data.emails || [];
  }

  public getSmtpConfig(): SmtpConfig | undefined {
    return this.data.smtp_config;
  }

  public setSmtpConfig(config: SmtpConfig): SmtpConfig {
    this.data.smtp_config = config;
    this.save();
    return config;
  }

  // User methods
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // Group methods
  public findGroupById(id: string): Group | undefined {
    return this.data.groups.find(g => g.id === id);
  }

  public addGroup(group: Group): Group {
    this.data.groups.push(group);
    this.save();
    return group;
  }

  public updateGroup(id: string, updates: Partial<Group>): Group | undefined {
    const group = this.findGroupById(id);
    if (!group) return undefined;
    Object.assign(group, updates);
    this.save();
    return group;
  }

  // Loan methods
  public findLoanById(id: string): Loan | undefined {
    return this.data.loans.find(l => l.id === id);
  }

  public addLoan(loan: Loan): Loan {
    this.data.loans.unshift(loan);
    this.save();
    return loan;
  }

  public updateLoan(id: string, updates: Partial<Loan>): Loan | undefined {
    const loan = this.findLoanById(id);
    if (!loan) return undefined;
    Object.assign(loan, updates);
    this.save();
    return loan;
  }

  // Message methods
  public addMessage(message: Message): Message {
    this.data.messages.push(message);
    this.save();
    return message;
  }

  // Announcement methods
  public addAnnouncement(announcement: Announcement): Announcement {
    this.data.announcements.unshift(announcement);
    this.save();
    return announcement;
  }

  // Email logs
  public addEmailLog(log: EmailLog): EmailLog {
    if (!this.data.emails) this.data.emails = [];
    this.data.emails.unshift(log);
    this.save();
    return log;
  }

  // SOS Emergency & Micro-Grant methods
  public getSosAlerts(groupId?: string): SosAlert[] {
    if (!this.data.sos_alerts) this.data.sos_alerts = [];
    if (groupId) {
      return this.data.sos_alerts.filter(s => s.group_id === groupId);
    }
    return this.data.sos_alerts;
  }

  public addSosAlert(alert: SosAlert): SosAlert {
    if (!this.data.sos_alerts) this.data.sos_alerts = [];
    this.data.sos_alerts.unshift(alert);
    this.save();
    return alert;
  }

  public resolveSosAlert(id: string, resolution_note: string): SosAlert | undefined {
    if (!this.data.sos_alerts) this.data.sos_alerts = [];
    const alert = this.data.sos_alerts.find(s => s.id === id);
    if (!alert) return undefined;
    alert.status = 'RESOLVED';
    alert.resolved_at = new Date().toISOString();
    alert.resolution_note = resolution_note;
    this.save();
    return alert;
  }

  // Meeting Minutes (MoM) & Attendance methods
  public getMeetings(groupId?: string): MeetingRecord[] {
    if (!this.data.meetings) this.data.meetings = [];
    if (groupId) {
      return this.data.meetings.filter(m => m.group_id === groupId);
    }
    return this.data.meetings;
  }

  public addMeeting(meeting: MeetingRecord): MeetingRecord {
    if (!this.data.meetings) this.data.meetings = [];
    this.data.meetings.unshift(meeting);
    this.save();
    return meeting;
  }
}

export const db = new Database();
