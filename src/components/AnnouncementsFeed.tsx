import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Announcement } from '../types';
import { Bell, RefreshCw, Calendar, UserCheck } from 'lucide-react';

export const AnnouncementsFeed: React.FC = () => {
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
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center">
            <Bell className="w-4 h-4 text-emerald-400 mr-2" />
            Official Announcements Noticeboard
          </h3>
          <p className="text-xs text-slate-400">
            Important circulars and scheme notifications broadcast by the Super Admin.
          </p>
        </div>
        <button
          onClick={fetchAnnouncements}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      {announcements.length === 0 && !loading && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium">No announcements published yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Check back later for meeting schedules and micro-loan notices.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">{ann.title}</h4>
              <div className="flex items-center text-[11px] text-slate-400 whitespace-nowrap ml-3">
                <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                {new Date(ann.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
              {ann.message}
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center text-slate-400">
                <UserCheck className="w-3 h-3 mr-1 text-emerald-400" />
                Broadcast by {ann.author_name}
              </span>
              <span className="text-slate-600 italic">Read-only notification</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
