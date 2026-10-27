import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { Loan, User, Group } from '../types';
import { LoanTimeline } from './LoanTimeline';
import { GroupChat } from './GroupChat';
import { AnnouncementsFeed } from './AnnouncementsFeed';
import { LoanEmiCalculator } from './LoanEmiCalculator';
import { EmergencySosModal } from './EmergencySosModal';
import {
  CreditCard,
  IndianRupee,
  MessageSquare,
  Bell,
  Users,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  History,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
  Calculator,
  AlertTriangle,
} from 'lucide-react';

export const MemberDashboard: React.FC = () => {
  const { user, group, refreshUser } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'loans' | 'calculator' | 'chat' | 'announcements' | 'members'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Apply form state
  const [amount, setAmount] = useState<string>('5000');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH'>('UPI');
  const [upiEmail, setUpiEmail] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSelectEmiPlan = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
    setShowApplyModal(true);
    setFormError(null);
  };

  const fetchLoans = async () => {
    try {
      setLoadingLoans(true);
      const data = await api.getLoans();
      setLoans(data);
    } catch (err: any) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchGroupDetails = async () => {
    if (group?.id) {
      try {
        const data = await api.getGroup(group.id);
        setGroupMembers(data.members || []);
      } catch (err) {
        console.error('Error fetching group details:', err);
      }
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchGroupDetails();
  }, [group?.id]);

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid loan amount.');
      return;
    }

    if (numAmount > 10000) {
      setFormError('Maximum loan amount is capped at ₹10,000.');
      return;
    }

    if (paymentMode === 'UPI') {
      if (!upiEmail.trim()) {
        setFormError('UPI requires entering your registered email ID.');
        return;
      }
      if (upiEmail.trim().toLowerCase() !== user?.email.toLowerCase()) {
        setFormError(`UPI verification failed: Entered email does not match your registered email.`);
        return;
      }
    }

    try {
      setSubmittingLoan(true);
      const res = await api.submitLoanRequest({
        amount: numAmount,
        payment_mode: paymentMode,
        upi_email: paymentMode === 'UPI' ? upiEmail.trim() : undefined,
        purpose: purpose.trim(),
      });

      setFormSuccess(res.message || 'Loan request submitted successfully!');
      setPurpose('');
      setUpiEmail('');
      await fetchLoans();
      setTimeout(() => {
        setShowApplyModal(false);
        setFormSuccess(null);
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit loan application.');
    } finally {
      setSubmittingLoan(false);
    }
  };

  const upiMatches = upiEmail.trim().toLowerCase() === user?.email.toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Group Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold tracking-wide uppercase">
              <Building className="w-4 h-4" />
              <span>Assigned Self-Help Group</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {group?.group_name || 'My Magalir Kuzhu'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {group?.area}, {group?.district}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {groupMembers.length} Active Members
              </span>
              {group?.group_admin_name && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center text-emerald-300 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Group Admin: {group.group_admin_name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSosModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm border border-rose-400 transition-colors animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t.emergencySos}</span>
            </button>

            <button
              onClick={() => {
                setShowApplyModal(true);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.applyLoan}</span>
            </button>
          </div>
        </div>
      </div>

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
          <span>{t.myLoans} ({loans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'calculator'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>{t.loanCalculator}</span>
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

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'members'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.kuzhuDirectory}</span>
        </button>
      </div>

      {/* TAB 1: LOANS */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Micro-Loan History & Tracking</h2>
              <p className="text-xs text-slate-400">
                Track your applications through the 3-tier approval workflow (capped at ₹10,000).
              </p>
            </div>
            <button
              onClick={fetchLoans}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          {loans.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
              <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Loan Applications Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                You can apply for quick micro-credit up to ₹10,000 for small business expenses or emergency needs.
              </p>
              <button
                onClick={() => setShowApplyModal(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit First Loan Request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-white flex items-center">
                          <IndianRupee className="w-4 h-4 text-emerald-400" />
                          {loan.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {loan.payment_mode}
                        </span>
                        {loan.status === 'APPROVED' && (
                          <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            SANCTIONED
                          </span>
                        )}
                        {loan.status === 'REJECTED' && (
                          <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            REJECTED
                          </span>
                        )}
                        {loan.status === 'PENDING_GROUP_ADMIN' && (
                          <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            AWAITING GROUP ADMIN
                          </span>
                        )}
                        {loan.status === 'PENDING_SUPER_ADMIN' && (
                          <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            AWAITING SUPER ADMIN
                          </span>
                        )}
                      </div>
                      {loan.purpose && (
                        <p className="text-xs text-slate-400 mt-1">Purpose: {loan.purpose}</p>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-500">
                      Applied on{' '}
                      {new Date(loan.requested_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* 3-Step Interactive Timeline */}
                  <LoanTimeline loan={loan} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: LOAN EMI CALCULATOR */}
      {activeTab === 'calculator' && (
        <LoanEmiCalculator onSelectPlan={handleSelectEmiPlan} />
      )}

      {/* TAB 2: CHAT */}
      {activeTab === 'chat' && group?.id && (
        <GroupChat groupId={group.id} groupName={group.group_name} />
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && <AnnouncementsFeed />}

      {/* TAB 4: MEMBERS DIRECTORY */}
      {activeTab === 'members' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">Members of {group?.group_name}</h3>
            <p className="text-xs text-slate-400">
              Cooperative self-help group members residing in {group?.area}, {group?.district}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {groupMembers.map((m) => (
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
                    {m.role === 'GROUP_ADMIN' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 mt-1">
                    <Phone className="w-3 h-3 mr-1 text-slate-500" />
                    <span>{m.phone}</span>
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

      {/* LOAN APPLICATION MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  <IndianRupee className="w-5 h-5 text-emerald-400 mr-1.5" />
                  Apply for Micro-Loan
                </h3>
                <p className="text-xs text-slate-400">
                  Magalir Kuzhu emergency credit (Capped at ₹10,000)
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleApplyLoan} className="space-y-4" autoComplete="off">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Loan Amount (₹) - Maximum ₹10,000
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                  </div>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="500"
                    required
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[2000, 5000, 8000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Disbursal Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      paymentMode === 'UPI'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>UPI Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                      paymentMode === 'CASH'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Cash at Group Meeting</span>
                  </button>
                </div>
              </div>

              {/* UPI Email Verification */}
              {paymentMode === 'UPI' && (
                <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Verify Registered Email ID for UPI Disbursal <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      value={upiEmail}
                      onChange={(e) => setUpiEmail(e.target.value)}
                      placeholder="Enter your registered email ID"
                      className={`block w-full pl-9 pr-3 py-2 bg-slate-900 border rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        upiEmail
                          ? upiMatches
                            ? 'border-emerald-500'
                            : 'border-rose-500'
                          : 'border-slate-700'
                      }`}
                    />
                  </div>

                  {upiEmail && (
                    <div className="text-[11px] flex items-center space-x-1">
                      {upiMatches ? (
                        <span className="text-emerald-400 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Email verified matches registered account
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center">
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                          Does not match registered email address ({user?.email})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Purpose of Loan (Optional)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Small business inventory, livestock feed, tailoring tools"
                  className="block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 3-Step Notice */}
              <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300">Approval Workflow:</span>
                <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-400">
                  <li>Your Group Admin reviews and approves the request.</li>
                  <li>Super Admin gives final central sanction.</li>
                  <li>An official sanction email is dispatched to your registered email ID.</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLoan || (paymentMode === 'UPI' && !upiMatches)}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-40"
                >
                  {submittingLoan ? 'Submitting...' : 'Submit Loan Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY SOS PANIC MODAL */}
      <EmergencySosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
      />
    </div>
  );
};
