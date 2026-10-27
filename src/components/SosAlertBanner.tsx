import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { SosAlert } from '../types';
import { useLanguage } from '../utils/translations';
import { AlertTriangle, Phone, CheckCircle, Clock } from 'lucide-react';

interface SosAlertBannerProps {
  onResolved?: () => void;
}

export const SosAlertBanner: React.FC<SosAlertBannerProps> = ({ onResolved }) => {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const data = await api.getSosAlerts();
      setAlerts(data.filter((a) => a.status === 'ACTIVE'));
    } catch (e) {
      // quiet
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: string) => {
    try {
      setResolvingId(id);
      await api.resolveSosAlert(id, 'Assistance coordinated & emergency funds disbursed.');
      await fetchAlerts();
      if (onResolved) onResolved();
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="p-4 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-2 border-rose-500 shadow-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm uppercase tracking-wide text-rose-200">
                  {language === 'ta' ? '🚨 அவசர SOS உதவி தேவை:' : '🚨 ACTIVE EMERGENCY SOS:'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/40 text-rose-100 font-bold">
                  {a.crisis_type}
                </span>
                {a.amount_requested && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/40 text-amber-100 font-bold">
                    Requested Grant: ₹{a.amount_requested.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-white mt-1">
                {a.user_name} ({a.group_name}) ·{' '}
                <a
                  href={`tel:${a.user_phone}`}
                  className="underline text-rose-200 hover:text-white inline-flex items-center ml-1"
                >
                  <Phone className="w-3 h-3 mr-0.5" />
                  {a.user_phone}
                </a>
              </div>
              <p className="text-xs text-rose-200 mt-1 italic">"{a.description}"</p>
            </div>
          </div>

          <button
            onClick={() => handleResolve(a.id)}
            disabled={resolvingId === a.id}
            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-900 text-xs font-bold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors self-end sm:self-center disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>
              {resolvingId === a.id
                ? 'Resolving...'
                : language === 'ta'
                ? 'தீர்வு காண்க & நிதியுதவி'
                : 'Mark Resolved & Provide Aid'}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
};
