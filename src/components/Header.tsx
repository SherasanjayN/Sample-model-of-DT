import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { AiTechExplanationModal } from './AiTechExplanationModal';
import {
  Users,
  LogOut,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  Building2,
  Globe,
  Sparkles,
  KeyRound,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface HeaderProps {
  onOpenSos?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSos }) => {
  const { user, group, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: t.roleSuperAdmin,
          icon: ShieldCheck,
          className: 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold',
        };
      case 'GROUP_ADMIN':
        return {
          label: t.roleGroupAdmin,
          icon: UserCheck,
          className: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold',
        };
      default:
        return {
          label: t.roleMember,
          icon: UserIcon,
          className: 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold',
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const IconComponent = badge.icon;

  return (
    <>
      <header className="bg-white text-slate-900 border-b border-emerald-100 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                    {t.systemTitle}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    {t.tamilBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  {t.systemSubtitle}
                </p>
              </div>
            </div>

            {/* Controls: AI Tech, Demo Logins, Language toggle, SOS button & User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* AI Technology Guide Trigger */}
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'ta' ? 'AI தொழில்நுட்ப விளக்கம்' : 'AI Architecture'}</span>
              </button>

              {/* Demo Credentials Quick Trigger */}
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
                title="View Seeded Login Accounts"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{language === 'ta' ? 'மாதிரி கணக்குகள்' : 'Demo Logins'}</span>
              </button>

              {/* Dual Language Toggle (EN | தமிழ்) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  aria-label="Switch to English"
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  aria-label="Switch to Tamil"
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    language === 'ta'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              {/* Quick SOS button for members */}
              {user && user.status === 'APPROVED' && onOpenSos && (
                <button
                  onClick={onOpenSos}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs border border-rose-600 transition-colors"
                >
                  <span>🚨 {language === 'ta' ? 'அவசர SOS' : 'Emergency SOS'}</span>
                </button>
              )}

              {/* User profile & actions */}
              {user && (
                <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-200 pl-2 sm:pl-3">
                  {group && (
                    <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-emerald-900">{group.group_name}</span>
                    </div>
                  )}

                  <div className="text-right hidden md:block">
                    <div className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>

                  <div className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg ${badge.className}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </div>

                  <button
                    onClick={() => logout()}
                    title={t.signOut}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* AI Technology Explanation Modal */}
      <AiTechExplanationModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
      />

      {/* Demo Credentials Quick Reference Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-emerald-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'ta' ? 'அங்கீகரிக்கப்பட்ட மாதிரி கணக்குகள்' : 'Pre-Seeded Login Credentials'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Super Admin */}
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 text-amber-600" />
                    SUPER ADMIN (Master Central Controller)
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-300">
                    Master Account
                  </span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-amber-200">
                    <span>Email: <strong>sherasanjayn@gmail.com</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy('sa_email', 'sherasanjayn@gmail.com')}
                      className="text-amber-700 hover:text-amber-800"
                    >
                      {copiedKey === 'sa_email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-amber-200">
                    <span>Password: <strong>Shera@0404</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy('sa_pass', 'Shera@0404')}
                      className="text-amber-700 hover:text-amber-800"
                    >
                      {copiedKey === 'sa_pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Admin */}
              <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center">
                    <UserCheck className="w-4 h-4 mr-1 text-emerald-600" />
                    GROUP ADMIN (Mylapore Kuzhu Leader)
                  </span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-emerald-200">
                    <span>Email: <strong>kavitha.ga@gmail.com</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy('ga_email', 'kavitha.ga@gmail.com')}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {copiedKey === 'ga_email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-emerald-200">
                    <span>Password: <strong>Group@123</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy('ga_pass', 'Group@123')}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {copiedKey === 'ga_pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Member */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1 text-slate-600" />
                    SHG MEMBER (Lakshmi Priya)
                  </span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <span>Email: <strong>lakshmi.priya@gmail.com</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy('mem_email', 'lakshmi.priya@gmail.com')}
                      className="text-slate-700 hover:text-slate-900"
                    >
                      {copiedKey === 'mem_email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <span>Password: <strong>Member@123</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy('mem_pass', 'Member@123')}
                      className="text-slate-700 hover:text-slate-900"
                    >
                      {copiedKey === 'mem_pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {language === 'ta' ? 'மூடு' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
