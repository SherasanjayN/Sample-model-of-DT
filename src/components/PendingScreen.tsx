import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, RefreshCw, LogOut, CheckCircle2, MapPin, Building, Phone, Mail, User, ShieldAlert } from 'lucide-react';

export const PendingScreen: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage(null);
      await refreshUser();
      setMessage('Status updated from central database.');
    } catch (err: any) {
      setMessage('Failed to refresh status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const isRejected = user?.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-slate-800 to-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-700 text-center">
          <div className="flex justify-center mb-4">
            {isRejected ? (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white">
            {isRejected ? 'Application Not Approved' : 'Registration Pending Approval'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRejected
              ? 'Your registration could not be verified by the Super Admin.'
              : 'Your membership application is currently under review by the Super Admin.'}
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-left space-y-2.5 text-xs">
            <div className="flex items-center text-slate-300">
              <User className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <span className="text-slate-400 w-24">Applicant:</span>
              <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <span className="text-slate-400 w-24">Phone:</span>
              <span>{user?.phone}</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Mail className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <span className="text-slate-400 w-24">Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <span className="text-slate-400 w-24">Area:</span>
              <span>{user?.area}</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Building className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <span className="text-slate-400 w-24">District:</span>
              <span>{user?.district}</span>
            </div>
          </div>

          {!isRejected && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-left mb-6 space-y-1">
              <div className="font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Next Step in Workflow:
              </div>
              <p className="text-slate-300">
                The Super Admin will verify your area and assign you to an active Magalir Kuzhu group in {user?.district || 'your district'}. You will receive full access immediately once sanctioned.
              </p>
            </div>
          )}

          {message && (
            <p className="text-xs text-emerald-400 mb-4 bg-slate-900/50 py-1.5 px-3 rounded">
              {message}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {!isRejected && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking...' : 'Check Status'}
              </button>
            )}

            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 flex items-center justify-center py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
