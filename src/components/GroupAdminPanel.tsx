import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { Loan, User } from '../types';
import { LoanTimeline } from './LoanTimeline';
import { GroupChat } from './GroupChat';
import { AnnouncementsFeed } from './AnnouncementsFeed';
import { MeetingMinutesManager } from './MeetingMinutesManager';
import { SosAlertBanner } from './SosAlertBanner';
import {
  ShieldCheck,
  CreditCard,
  IndianRupee,
  Users,
  MessageSquare,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const GroupAdminPanel: React.FC = () => {
  const { user, group } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'loans' | 'members' | 'mom' | 'chat' | 'announcements'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loansData, groupData] = await Promise.all([
        api.getLoans(),
        group?.id ? api.getGroup(group.id) : Promise.resolve(null),
      ]);
      setLoans(loansData);
      if (groupData) {
        setMembers(groupData.members || []);
      }
    } catch (err: any) {
      console.error('Error fetching Group Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group?.id]);

  const handleApprove = async (loanId: string) => {
    try {
      setActionLoading(loanId);
      setActionMessage(null);
      const note = reviewNote[loanId] || 'Verified and approved by Group Admin';
      const res = await api.groupApproveLoan(loanId, note);
      setActionMessage(res.message);
      await fetchData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      setActionLoading(loanId);
      setActionMessage(null);
      const note = reviewNote[loanId] || 'Rejected by Group Admin';
      const res = await api.groupRejectLoan(loanId, note);
      setActionMessage(res.message);
      await fetchData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter loans
  const pendingReview = loans.filter((l) => l.status === 'PENDING_GROUP_ADMIN');
  const otherLoans = loans.filter((l) => l.status !== 'PENDING_GROUP_ADMIN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* High-priority Emergency SOS Alert Banner */}
      <SosAlertBanner onResolved={fetchData} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.groupAdminPanel}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {group?.group_name || 'Group Admin Dashboard'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {group?.area}, {group?.district}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {members.length} Members in Group
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400 font-medium">
                {pendingReview.length} Pending Loan Applications
              </span>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
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
            {t.myLoans} ({pendingReview.length} Pending)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'members'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.kuzhuDirectory} ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mom')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'mom'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{t.meetingMinutes}</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'chat'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t.groupChat}</span>
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
          <span>{t.noticeboard}</span>
        </button>
      </div>

      {/* TAB 1: LOANS */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {/* Pending Applications Requiring Group Admin Approval */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center">
                <Clock className="w-4 h-4 text-amber-400 mr-2" />
                Applications Awaiting Your Group Review ({pendingReview.length})
              </h2>
            </div>

            {pendingReview.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                No new loan requests pending your group review.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReview.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-5 rounded-xl bg-slate-900 border border-amber-500/30 shadow-md space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-white flex items-center">
                            <IndianRupee className="w-4 h-4 text-emerald-400" />
                            {loan.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                            Step 1: Needs Your Approval
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            Mode: {loan.payment_mode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1 font-medium">
                          Applicant: {loan.user_name} ({loan.user_phone})
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Email: {loan.user_email}{' '}
                          {loan.upi_email && `· UPI Email Verified: ${loan.upi_email}`}
                        </div>
                        {loan.purpose && (
                          <div className="text-xs text-slate-400 mt-1 italic">
                            Purpose: "{loan.purpose}"
                          </div>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-500">
                        Submitted:{' '}
                        {new Date(loan.requested_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Review Note Input */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Group Admin Recommendation / Meeting Remarks:
                      </label>
                      <input
                        type="text"
                        value={reviewNote[loan.id] || ''}
                        onChange={(e) =>
                          setReviewNote({ ...reviewNote, [loan.id]: e.target.value })
                        }
                        placeholder="e.g. Regular monthly saver, recommended for emergency micro-loan."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleApprove(loan.id)}
                        disabled={actionLoading === loan.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>
                          {actionLoading === loan.id
                            ? 'Processing...'
                            : 'Approve & Forward to Super Admin'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleReject(loan.id)}
                        disabled={actionLoading === loan.id}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Request</span>
                      </button>
                    </div>

                    <LoanTimeline loan={loan} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group History / Already Forwarded or Approved */}
          {otherLoans.length > 0 && (
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">
                Group Loan History & Forwarded Applications ({otherLoans.length})
              </h3>
              <div className="space-y-3">
                {otherLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">
                          ₹{loan.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          by {loan.user_name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            loan.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : loan.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {loan.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(loan.requested_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <LoanTimeline loan={loan} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              Members of {group?.group_name}
            </h3>
            <p className="text-xs text-slate-400">
              Only members allocated to your group by the Super Admin appear here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-start space-x-3"
              >
                <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">{m.name}</span>
                    {m.id === user?.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                        You (Admin)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 mt-1">
                    <Phone className="w-3 h-3 mr-1 text-slate-500" />
                    <span>{m.phone}</span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 mt-0.5">
                    <Mail className="w-3 h-3 mr-1 text-slate-500" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                    <span>{m.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MEETING MINUTES (MoM) & ATTENDANCE */}
      {activeTab === 'mom' && (
        <MeetingMinutesManager
          groupId={group?.id || ''}
          groupName={group?.group_name || ''}
          members={members}
        />
      )}

      {/* TAB 3: CHAT */}
      {activeTab === 'chat' && group?.id && (
        <GroupChat groupId={group.id} groupName={group.group_name} />
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && <AnnouncementsFeed />}
    </div>
  );
};
