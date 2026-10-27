import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { User, Group, Loan, Announcement, EmailLog } from '../types';
import { LoanTimeline } from './LoanTimeline';
import { GroupChat } from './GroupChat';
import { AnnouncementsFeed } from './AnnouncementsFeed';
import { SosAlertBanner } from './SosAlertBanner';
import {
  ShieldCheck,
  Users,
  Building,
  CreditCard,
  Bell,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  IndianRupee,
  Send,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    'pending' | 'users' | 'groups' | 'loans' | 'announcements' | 'emails'
  >('pending');

  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Group Suggestion & Approval modal state
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [designateGroupAdmin, setDesignateGroupAdmin] = useState(false);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupArea, setNewGroupArea] = useState('');
  const [newGroupDistrict, setNewGroupDistrict] = useState('');

  // Loan action modal / note
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sanctionNote, setSanctionNote] = useState<Record<string, string>>({});

  // Active chat modal for Super Admin
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annLoading, setAnnLoading] = useState(false);

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Loan status filter
  const [loanFilter, setLoanFilter] = useState<'ALL' | 'PENDING_SUPER_ADMIN' | 'PENDING_GROUP_ADMIN' | 'APPROVED' | 'REJECTED'>('PENDING_SUPER_ADMIN');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [pendingRes, usersRes, groupsRes, loansRes, annRes, emailRes] = await Promise.all([
        api.getPendingUsers(),
        api.getUsers(),
        api.getGroups(),
        api.getLoans(),
        api.getAnnouncements(),
        api.getEmails(),
      ]);
      setPendingUsers(pendingRes);
      setAllUsers(usersRes);
      setGroups(groupsRes);
      setLoans(loansRes);
      setAnnouncements(annRes);
      setEmails(emailRes);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Open Approval Dialog & Auto-suggest groups
  const handleOpenApproveModal = async (u: User) => {
    setApprovingUser(u);
    setIsCreatingNewGroup(false);
    setNewGroupName(`${u.area} Magalir Kuzhu`);
    setNewGroupArea(u.area);
    setNewGroupDistrict(u.district);
    setDesignateGroupAdmin(false);

    try {
      const suggestions = await api.suggestGroups(u.area, u.district);
      const matched = [...suggestions.exact_matches, ...suggestions.district_matches];
      setSuggestedGroups(matched.length > 0 ? matched : groups);
      if (matched.length > 0) {
        setSelectedGroupId(matched[0].id);
      } else if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      } else {
        setSelectedGroupId('');
        setIsCreatingNewGroup(true);
      }
    } catch (err) {
      setSuggestedGroups(groups);
      if (groups.length > 0) setSelectedGroupId(groups[0].id);
    }
  };

  // Submit User Approval
  const handleSubmitApproval = async () => {
    if (!approvingUser) return;

    try {
      let finalGroupId = selectedGroupId;

      // If creating new group
      if (isCreatingNewGroup) {
        if (!newGroupName.trim() || !newGroupArea.trim() || !newGroupDistrict.trim()) {
          showToast('error', 'Please fill all group fields');
          return;
        }
        const createdGroup = await api.createGroup({
          group_name: newGroupName.trim(),
          area: newGroupArea.trim(),
          district: newGroupDistrict.trim(),
          group_admin_id: designateGroupAdmin ? approvingUser.id : undefined,
        });
        finalGroupId = createdGroup.id;
      }

      await api.approveUser(approvingUser.id, {
        group_id: finalGroupId || undefined,
        is_group_admin: designateGroupAdmin,
      });

      showToast('success', `Approved ${approvingUser.name} and allocated to group!`);
      setApprovingUser(null);
      await fetchAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve user');
    }
  };

  // Reject User
  const handleRejectUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reject ${userName}?`)) return;
    try {
      await api.rejectUser(userId);
      showToast('success', `Application for ${userName} rejected`);
      await fetchAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject user');
    }
  };

  // Loan Final Sanction (Super Admin) - Triggers real email notification!
  const handleSuperApproveLoan = async (loan: Loan) => {
    try {
      setActionLoading(loan.id);
      const note = sanctionNote[loan.id] || 'Final loan sanction approved by Super Admin.';
      const res = await api.superApproveLoan(loan.id, note);

      showToast(
        'success',
        `Loan sanctioned! Email notice dispatched to ${loan.user_email} (Subject: "Loan Sanctioned - Magalir Kuzhu Management System")`
      );
      await fetchAllData();
    } catch (err: any) {
      showToast('error', `Failed to sanction loan: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Loan Reject (Super Admin)
  const handleSuperRejectLoan = async (loan: Loan) => {
    try {
      setActionLoading(loan.id);
      const note = sanctionNote[loan.id] || 'Application rejected by Super Admin during central verification.';
      await api.superRejectLoan(loan.id, note);
      showToast('success', `Loan application for ${loan.user_name} rejected.`);
      await fetchAllData();
    } catch (err: any) {
      showToast('error', `Failed to reject loan: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Broadcast announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      setAnnLoading(true);
      await api.createAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
      });
      showToast('success', 'Announcement broadcasted to all users!');
      setAnnTitle('');
      setAnnMessage('');
      await fetchAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to publish announcement');
    } finally {
      setAnnLoading(false);
    }
  };

  // Designate Group Admin for a group
  const handleSetGroupAdmin = async (groupId: string, userId: string) => {
    try {
      await api.setGroupAdmin(groupId, userId);
      showToast('success', 'Group Admin updated successfully');
      await fetchAllData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update Group Admin');
    }
  };

  // Calculate high level metrics
  const pendingSuperAdminLoans = loans.filter((l) => l.status === 'PENDING_SUPER_ADMIN');
  const approvedLoans = loans.filter((l) => l.status === 'APPROVED');
  const totalSanctionedAmount = approvedLoans.reduce((sum, l) => sum + l.amount, 0);

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.area.toLowerCase().includes(q) ||
        u.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered loans
  const filteredLoans = loans.filter((l) => {
    if (loanFilter === 'ALL') return true;
    return l.status === loanFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100'
              : 'bg-rose-900/90 border-rose-500 text-rose-100'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-4 font-bold text-white">
            ✕
          </button>
        </div>
      )}

      {/* High-priority Emergency SOS Alert Banner */}
      <SosAlertBanner onResolved={fetchAllData} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Super Administrator Master Console</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Magalir Kuzhu Central Operations
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Logged in as <span className="font-semibold text-white">{user?.email}</span> (Master Account)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync System Data</span>
            </button>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs font-medium">Pending Registrations</div>
            <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center justify-between">
              <span>{pendingUsers.length}</span>
              <Clock className="w-5 h-5 text-amber-400/50" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Awaiting group allocation</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs font-medium">Loans Needing Sanction</div>
            <div className="text-2xl font-bold text-blue-400 mt-1 flex items-center justify-between">
              <span>{pendingSuperAdminLoans.length}</span>
              <CreditCard className="w-5 h-5 text-blue-400/50" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Tier-2 central clearance</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs font-medium">Active Groups</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center justify-between">
              <span>{groups.length}</span>
              <Building className="w-5 h-5 text-emerald-400/50" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across various districts</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-400 text-xs font-medium">Total Sanctioned Disbursals</div>
            <div className="text-2xl font-bold text-white mt-1 flex items-center justify-between">
              <span>₹{totalSanctionedAmount.toLocaleString('en-IN')}</span>
              <IndianRupee className="w-5 h-5 text-emerald-400/50" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{approvedLoans.length} loans sanctioned</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'pending'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({pendingUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'loans'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>
            3-Tier Loan Approvals ({pendingSuperAdminLoans.length} Ready for Sanction)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Users & Roles ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'groups'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Groups & Chat Rooms ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'announcements'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Broadcast Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'emails'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Sanction Audit Log ({emails.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING REGISTRATIONS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Pending Member Registrations ({pendingUsers.length})
              </h2>
              <p className="text-xs text-slate-400">
                Review applicant credentials, auto-suggest groups by Area & District, and allocate members.
              </p>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All registration applications have been reviewed and allocated!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((applicant) => (
                <div
                  key={applicant.id}
                  className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{applicant.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{applicant.phone}</span>
                        <span className="text-slate-600">·</span>
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{applicant.email}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PENDING
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs space-y-1">
                    <div className="text-slate-300 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      <span className="text-slate-400 mr-1">Registered Area:</span>
                      <span className="font-semibold text-white">{applicant.area}</span>
                    </div>
                    <div className="text-slate-300 flex items-center">
                      <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      <span className="text-slate-400 mr-1">District:</span>
                      <span className="font-semibold text-white">{applicant.district}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-700">
                      Applied on{' '}
                      {new Date(applicant.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => handleOpenApproveModal(applicant)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Review & Auto-Suggest Group</span>
                    </button>
                    <button
                      onClick={() => handleRejectUser(applicant.id, applicant.name)}
                      className="py-2 px-3 bg-slate-800 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/50 text-xs font-medium rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 3-TIER LOAN APPROVALS */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                3-Tier Micro-Loan Sanctions Hub
              </h2>
              <p className="text-xs text-slate-400">
                Loans capped at ₹10,000. Super Admin final sanction automatically triggers real notification email.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setLoanFilter('PENDING_SUPER_ADMIN')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  loanFilter === 'PENDING_SUPER_ADMIN'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Needs Final Sanction ({pendingSuperAdminLoans.length})
              </button>
              <button
                onClick={() => setLoanFilter('PENDING_GROUP_ADMIN')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  loanFilter === 'PENDING_GROUP_ADMIN'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                At Group Admin Tier
              </button>
              <button
                onClick={() => setLoanFilter('APPROVED')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  loanFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sanctioned ({approvedLoans.length})
              </button>
              <button
                onClick={() => setLoanFilter('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  loanFilter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All Loans ({loans.length})
              </button>
            </div>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              No loan applications found matching selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  className={`p-5 rounded-xl bg-slate-900 border shadow-md space-y-4 ${
                    loan.status === 'PENDING_SUPER_ADMIN'
                      ? 'border-blue-500/50 ring-1 ring-blue-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-white flex items-center">
                          <IndianRupee className="w-4 h-4 text-emerald-400" />
                          {loan.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          Mode: {loan.payment_mode}
                        </span>
                        {loan.status === 'PENDING_SUPER_ADMIN' && (
                          <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">
                            Action Needed: Final Sanction
                          </span>
                        )}
                        {loan.status === 'APPROVED' && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            SANCTIONED & DISPATCHED
                          </span>
                        )}
                        {loan.status === 'PENDING_GROUP_ADMIN' && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Awaiting Group Admin Review
                          </span>
                        )}
                        {loan.status === 'REJECTED' && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            REJECTED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 mt-1 font-semibold">
                        Applicant: {loan.user_name} · Group: {loan.group_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Phone: {loan.user_phone} · Email: {loan.user_email}{' '}
                        {loan.upi_email && `· Verified UPI Email: ${loan.upi_email}`}
                      </div>
                      {loan.purpose && (
                        <div className="text-xs text-slate-400 mt-1 italic">
                          Purpose: "{loan.purpose}"
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      Applied:{' '}
                      {new Date(loan.requested_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Super Admin Action Controls */}
                  {loan.status === 'PENDING_SUPER_ADMIN' && (
                    <div className="bg-slate-800/80 p-3.5 rounded-lg border border-blue-500/30 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Super Admin Sanction Remark (Recorded in audit history):
                        </label>
                        <input
                          type="text"
                          value={sanctionNote[loan.id] || ''}
                          onChange={(e) =>
                            setSanctionNote({ ...sanctionNote, [loan.id]: e.target.value })
                          }
                          placeholder="e.g. Micro-loan sanctioned under credit policy. Disbursal initiated."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex items-center space-x-3 pt-1">
                        <button
                          onClick={() => handleSuperApproveLoan(loan)}
                          disabled={actionLoading === loan.id}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow inline-flex items-center space-x-2 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {actionLoading === loan.id
                              ? 'Sanctioning & Sending Email...'
                              : 'Grant Final Sanction (Fires Real Email)'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleSuperRejectLoan(loan)}
                          disabled={actionLoading === loan.id}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Application</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <LoanTimeline loan={loan} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Registered Users Directory</h3>
              <p className="text-xs text-slate-400">
                Manage roles, designated group admins, and member allocations.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search members..."
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e: any) => setUserStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Area & District</th>
                  <th className="py-2.5 px-3">Assigned Group</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-3">
                      <div>{u.phone}</div>
                      <div className="text-slate-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      {u.area}, {u.district}
                    </td>
                    <td className="py-3 px-3">
                      {u.group_name || (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'GROUP_ADMIN'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === 'APPROVED'
                            ? 'text-emerald-400'
                            : u.status === 'PENDING'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.role !== 'SUPER_ADMIN' && u.status === 'APPROVED' && u.group_id && (
                        <button
                          onClick={async () => {
                            const newRole = u.role === 'GROUP_ADMIN' ? 'USER' : 'GROUP_ADMIN';
                            await api.assignUserRole(u.id, newRole);
                            showToast('success', `Role updated for ${u.name}`);
                            await fetchAllData();
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline ml-2"
                        >
                          {u.role === 'GROUP_ADMIN' ? 'Make Member' : 'Designate Group Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GROUPS & CHAT ROOMS */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Magalir Kuzhu Groups & Dedicated Chat Rooms
              </h2>
              <p className="text-xs text-slate-400">
                Each group has a designated Group Admin and an automatic dedicated chatroom.
              </p>
            </div>
            <button
              onClick={() => {
                setIsCreatingNewGroup(true);
                setApprovingUser(null);
                setNewGroupName('');
                setNewGroupArea('');
                setNewGroupDistrict('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{grp.group_name}</h3>
                    <p className="text-xs text-slate-400 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                      {grp.area}, {grp.district}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {grp.member_count || 0} Members
                  </span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Designated Group Admin:</span>
                    <span className="font-semibold text-emerald-300">
                      {grp.group_admin_name || 'Unassigned'}
                    </span>
                  </div>
                  {grp.group_admin_phone && (
                    <div className="text-[11px] text-slate-400 flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-slate-500" />
                      {grp.group_admin_phone}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => setChatGroupId(grp.id)}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg inline-flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Group Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Group Chat Modal for Super Admin */}
          {chatGroupId && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-sm font-bold text-white">
                    Super Admin View: {groups.find((g) => g.id === chatGroupId)?.group_name}
                  </span>
                  <button
                    onClick={() => setChatGroupId(null)}
                    className="text-slate-400 hover:text-white font-bold text-sm"
                  >
                    ✕ Close Chat
                  </button>
                </div>
                <GroupChat
                  groupId={chatGroupId}
                  groupName={groups.find((g) => g.id === chatGroupId)?.group_name}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BROADCAST ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center">
                <Send className="w-4 h-4 text-emerald-400 mr-2" />
                Broadcast Announcement
              </h3>
              <p className="text-xs text-slate-400">
                Send official circulars to all Magalir Kuzhu members (read-only noticeboard).
              </p>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3" autoComplete="off">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Subsidy Scheme for Tailoring Units"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  autoComplete="off"
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Type the full circular or notice details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={annLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {annLoading ? 'Publishing...' : 'Broadcast to All Members'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2">
            <AnnouncementsFeed />
          </div>
        </div>
      )}

      {/* TAB 6: EMAIL DISPATCH AUDIT LOG */}
      {activeTab === 'emails' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center">
                <Mail className="w-4 h-4 text-emerald-400 mr-2" />
                Real Email Dispatch Audit Log
              </h3>
              <p className="text-xs text-slate-400">
                Audited records of all loan sanction emails dispatched via Nodemailer.
              </p>
            </div>

            <button
              onClick={async () => {
                try {
                  const res = await api.sendTestEmail({
                    to: user?.email,
                    userName: user?.name || 'Super Admin',
                    amount: 5000,
                  });
                  showToast('success', 'Test loan sanction email dispatched!');
                  await fetchAllData();
                } catch (e: any) {
                  showToast('error', e.message);
                }
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg inline-flex items-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send Test Sanction Email</span>
            </button>
          </div>

          {emails.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-slate-800 rounded-lg">
              No loan sanction emails dispatched yet. Granting final loan sanction will send an automated email notice.
            </div>
          ) : (
            <div className="space-y-3">
              {emails.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">To: {log.to}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.status === 'SENT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(log.sent_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-slate-300 font-medium">Subject: "{log.subject}"</div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-400 font-mono text-[11px]">
                    {log.body}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{log.info}</span>
                    {log.preview_url && (
                      <a
                        href={log.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline inline-flex items-center space-x-1 font-semibold"
                      >
                        <span>View Live Ethereal Inbox Receipt</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPROVE & AUTO-SUGGEST MODAL */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  <UserCheck className="w-5 h-5 text-emerald-400 mr-2" />
                  Approve Registration & Allocate Group
                </h3>
                <p className="text-xs text-slate-400">
                  Applicant: <span className="text-white font-semibold">{approvingUser.name}</span> · Area: {approvingUser.area}, {approvingUser.district}
                </p>
              </div>
              <button
                onClick={() => setApprovingUser(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode selection: Existing suggested group or create new */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setIsCreatingNewGroup(false)}
                className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
                  !isCreatingNewGroup
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto-Suggested & Existing Groups
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewGroup(true)}
                className={`flex-1 py-1.5 font-medium rounded-md transition-colors ${
                  isCreatingNewGroup
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Create New Group in {approvingUser.area}
              </button>
            </div>

            {!isCreatingNewGroup ? (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Select Matching Group for {approvingUser.area}, {approvingUser.district}:
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {suggestedGroups.map((grp) => (
                    <label
                      key={grp.id}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                        selectedGroupId === grp.id
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{grp.group_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {grp.area}, {grp.district} · {grp.member_count || 0} Members
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="groupSelection"
                        checked={selectedGroupId === grp.id}
                        onChange={() => setSelectedGroupId(grp.id)}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    New Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Mylapore Mahasakthi Kuzhu"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Area</label>
                    <input
                      type="text"
                      value={newGroupArea}
                      onChange={(e) => setNewGroupArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">District</label>
                    <input
                      type="text"
                      value={newGroupDistrict}
                      onChange={(e) => setNewGroupDistrict(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Designate as Group Admin checkbox */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 flex items-center space-x-2">
              <input
                type="checkbox"
                id="designateAdmin"
                checked={designateGroupAdmin}
                onChange={(e) => setDesignateGroupAdmin(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500"
              />
              <label htmlFor="designateAdmin" className="text-xs text-slate-200 cursor-pointer">
                Designate <span className="font-semibold text-white">{approvingUser.name}</span> as the official Group Admin
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitApproval}
                disabled={!isCreatingNewGroup && !selectedGroupId}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow disabled:opacity-50"
              >
                Approve & Allocate Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL (Standalone) */}
      {isCreatingNewGroup && !approvingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center">
                <Building className="w-4 h-4 text-emerald-400 mr-2" />
                Create New Magalir Kuzhu Group
              </h3>
              <button
                onClick={() => setIsCreatingNewGroup(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.createGroup({
                    group_name: newGroupName.trim(),
                    area: newGroupArea.trim(),
                    district: newGroupDistrict.trim(),
                  });
                  showToast('success', `Created group ${newGroupName}`);
                  setIsCreatingNewGroup(false);
                  await fetchAllData();
                } catch (err: any) {
                  showToast('error', err.message);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Madurai Meenakshi Kuzhu"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Area / Locality</label>
                  <input
                    type="text"
                    required
                    value={newGroupArea}
                    onChange={(e) => setNewGroupArea(e.target.value)}
                    placeholder="e.g. Simmakkal"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newGroupDistrict}
                    onChange={(e) => setNewGroupDistrict(e.target.value)}
                    placeholder="e.g. Madurai"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewGroup(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
