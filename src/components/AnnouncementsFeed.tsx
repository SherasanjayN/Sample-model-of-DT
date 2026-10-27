import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Announcement } from '../types';
import { useLanguage } from '../utils/translations';
import { Bell, RefreshCw, Calendar, UserCheck } from 'lucide-react';

export const AnnouncementsFeed: React.FC = () => {
  const { t, language } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Bell className="w-4 h-4 text-emerald-600 mr-2" />
            {t.officialNoticeboard}
          </h2>
          <p className="text-xs text-slate-500">
            {t.noticeboardSubtitle}
          </p>
        </div>
        <button
          onClick={fetchAnnouncements}
          disabled={loading}
          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
          title={t.refresh}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {announcements.length === 0 && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 shadow-xs">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">{t.noAnnouncementsYet}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {t.checkBackLater}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{ann.title}</h3>
              <div className="flex items-center text-[11px] text-slate-500 whitespace-nowrap ml-3 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                {new Date(ann.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>

            <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
              {ann.message}
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center text-emerald-800 font-semibold">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {t.broadcastBy} {ann.author_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
