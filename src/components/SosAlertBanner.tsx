import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { SosAlert } from '../types';
import { useLanguage } from '../utils/translations';
import { AlertTriangle, Phone, CheckCircle } from 'lucide-react';

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
      await api.resolveSosAlert(id, t.sosAlertResolved);
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
    <div className="space-y-3 mb-6">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 shadow-sm text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm uppercase tracking-wide text-rose-800">
                  {t.activeSosNotice}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-bold border border-rose-300">
                  {a.crisis_type}
                </span>
                {a.amount_requested && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Grant: ₹{a.amount_requested.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                {a.user_name} ({a.group_name}) ·{' '}
                <a
                  href={`tel:${a.user_phone}`}
                  className="underline text-rose-700 hover:text-rose-900 inline-flex items-center ml-1 font-semibold"
                >
                  <Phone className="w-3 h-3 mr-0.5" />
                  {a.user_phone}
                </a>
              </div>
              <p className="text-xs text-rose-800 mt-1 font-medium italic">"{a.description}"</p>
            </div>
          </div>

          <button
            onClick={() => handleResolve(a.id)}
            disabled={resolvingId === a.id}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 transition-colors self-end sm:self-center disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{resolvingId === a.id ? t.loading : t.resolveAlert}</span>
          </button>
        </div>
      ))}
    </div>
  );
};
