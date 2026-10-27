import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { Users, LogOut, ShieldCheck, UserCheck, User as UserIcon, Building2, Globe } from 'lucide-react';

interface HeaderProps {
  onOpenSos?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSos }) => {
  const { user, group, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: language === 'ta' ? 'முதன்மை நிர்வாகி' : 'Super Admin',
          icon: ShieldCheck,
          className: 'bg-amber-100 text-amber-900 border border-amber-300',
        };
      case 'GROUP_ADMIN':
        return {
          label: language === 'ta' ? 'குழு நிர்வாகி' : 'Group Admin',
          icon: UserCheck,
          className: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        };
      default:
        return {
          label: language === 'ta' ? 'உறுப்பினர்' : 'Member',
          icon: UserIcon,
          className: 'bg-slate-100 text-slate-800 border border-slate-200',
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const IconComponent = badge.icon;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">{t.systemTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  {t.tamilBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.systemSubtitle}</p>
            </div>
          </div>

          {/* Controls: Language toggle, SOS button & User */}
          <div className="flex items-center space-x-3">
            {/* Dual Language Toggle (EN | தமிழ்) */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  language === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  language === 'ta' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Quick SOS button for members */}
            {user && user.status === 'APPROVED' && onOpenSos && (
              <button
                onClick={onOpenSos}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm border border-rose-400 transition-colors animate-pulse"
              >
                <span>🚨 {language === 'ta' ? 'அவசர SOS' : 'Emergency SOS'}</span>
              </button>
            )}

            {/* User profile & actions */}
            {user && (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-3">
                {group && (
                  <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium text-slate-200">{group.group_name}</span>
                  </div>
                )}

                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>

                <div className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-md font-medium ${badge.className}`}>
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </div>

                <button
                  onClick={() => logout()}
                  title={t.signOut}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
