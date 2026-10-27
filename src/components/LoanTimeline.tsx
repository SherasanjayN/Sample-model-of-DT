import React from 'react';
import { Loan, LoanStatus } from '../types';
import { Check, Clock, XCircle, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

interface LoanTimelineProps {
  loan: Loan;
}

export const LoanTimeline: React.FC<LoanTimelineProps> = ({ loan }) => {
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' | 'rejected' => {
    if (loan.status === 'REJECTED') {
      // Find at what stage it was rejected
      const lastEntry = loan.status_history[loan.status_history.length - 1];
      if (lastEntry?.updated_by_role === 'GROUP_ADMIN' && stepIndex === 2) return 'rejected';
      if (lastEntry?.updated_by_role === 'SUPER_ADMIN' && stepIndex === 3) return 'rejected';
      if (stepIndex === 1) return 'completed';
      return 'upcoming';
    }

    if (stepIndex === 1) {
      return 'completed'; // Step 1 is always submitted
    }
    if (stepIndex === 2) {
      if (loan.status === 'PENDING_GROUP_ADMIN') return 'current';
      if (loan.status === 'PENDING_SUPER_ADMIN' || loan.status === 'APPROVED') return 'completed';
      return 'upcoming';
    }
    if (stepIndex === 3) {
      if (loan.status === 'PENDING_SUPER_ADMIN') return 'current';
      if (loan.status === 'APPROVED') return 'completed';
      return 'upcoming';
    }
    return 'upcoming';
  };

  const steps = [
    {
      index: 1,
      title: 'Member Application',
      subtitle: `₹${loan.amount.toLocaleString('en-IN')} via ${loan.payment_mode}${
        loan.payment_mode === 'UPI' ? ' (Email: ' + (loan.upi_email || loan.user_email) + ')' : ''
      }`,
      state: getStepStatus(1),
    },
    {
      index: 2,
      title: 'Group Admin Review',
      subtitle: 'First-tier group verification',
      state: getStepStatus(2),
    },
    {
      index: 3,
      title: 'Super Admin Final Sanction',
      subtitle: 'Central clearance & email dispatch',
      state: getStepStatus(3),
    },
  ];

  return (
    <div className="py-2">
      {/* 3-Step Visual Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            return (
              <React.Fragment key={step.index}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      step.state === 'completed'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-950/20'
                        : step.state === 'current'
                        ? 'bg-amber-500 border-amber-400 text-white animate-pulse'
                        : step.state === 'rejected'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {step.state === 'completed' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : step.state === 'rejected' ? (
                      <XCircle className="w-4 h-4" />
                    ) : step.state === 'current' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      step.index
                    )}
                  </div>
                  <div className="text-center mt-2 px-1">
                    <div
                      className={`text-xs font-semibold ${
                        step.state === 'completed'
                          ? 'text-emerald-400'
                          : step.state === 'current'
                          ? 'text-amber-400'
                          : step.state === 'rejected'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                      {step.subtitle}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div
                    className={`h-0.5 flex-1 mb-8 transition-colors ${
                      step.state === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Disbursal & Sanction Status Notice */}
      {loan.status === 'APPROVED' && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-2">
          <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-emerald-200">
              Sanction Email Dispatched to {loan.user_email}:
            </span>{' '}
            "Dear {loan.user_name}, Your loan request of ₹{loan.amount.toLocaleString('en-IN')} has been sanctioned successfully!"
          </div>
        </div>
      )}

      {/* Audit History Log */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-300 mb-2">Workflow Audit History:</div>
        <div className="space-y-2">
          {loan.status_history.map((entry, i) => (
            <div
              key={i}
              className="text-xs bg-slate-900/60 p-2.5 rounded-md border border-slate-800 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-semibold ${
                      entry.status === 'APPROVED'
                        ? 'text-emerald-400'
                        : entry.status === 'REJECTED'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {entry.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-medium">By {entry.updated_by_name}</span>
                  <span className="text-slate-500 text-[11px]">({entry.updated_by_role})</span>
                </div>
                {entry.note && <div className="text-slate-400 mt-1">{entry.note}</div>}
              </div>
              <div className="text-[11px] text-slate-500 whitespace-nowrap ml-3">
                {new Date(entry.updated_at).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
