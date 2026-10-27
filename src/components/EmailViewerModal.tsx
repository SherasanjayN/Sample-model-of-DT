import React from 'react';
import { Mail, X, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { EmailLog } from '../types';
import { useLanguage } from '../utils/translations';

interface EmailViewerModalProps {
  email: EmailLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({ email, isOpen, onClose }) => {
  const { t, language } = useLanguage();

  if (!isOpen || !email) return null;

  const isRealSmtp = email.delivery_mode === 'REAL_SMTP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isRealSmtp
                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                : 'bg-amber-100 border-amber-200 text-amber-700'
            }`}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.viewEmailModalTitle}</h3>
              <p className="text-xs text-slate-500">{t.viewEmailModalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Meta Bar */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Status Indicator */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isRealSmtp
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center space-x-2.5">
              {isRealSmtp ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold">
                  {isRealSmtp ? t.realInboxDelivered : t.sandboxCaptured}
                </div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  {email.info}
                </div>
              </div>
            </div>

            {email.preview_url && (
              <a
                href={email.preview_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 hover:bg-amber-50 transition-colors shrink-0"
              >
                <span>{t.viewLivePreview}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Email Headers Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="grid grid-cols-6 gap-2">
              <span className="font-bold text-slate-500 col-span-1">{t.recipientTo}:</span>
              <span className="font-semibold text-slate-900 col-span-5 font-mono">{email.to}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              <span className="font-bold text-slate-500 col-span-1">{t.emailSubject}:</span>
              <span className="font-bold text-emerald-900 col-span-5">{email.subject}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              <span className="font-bold text-slate-500 col-span-1">{t.dispatchTime}:</span>
              <span className="text-slate-700 col-span-5">
                {new Date(email.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </span>
            </div>
          </div>

          {/* Rendered HTML or Plaintext Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>{language === 'ta' ? 'அசல் செய்தி காட்சி' : 'Original Rendered Message'}</span>
              <span className="text-slate-400 font-normal lowercase">HTML / Rich Format</span>
            </div>
            {email.html ? (
              <div
                className="p-5 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: email.html }}
              />
            ) : (
              <div className="p-5 font-mono text-xs text-slate-850 whitespace-pre-wrap bg-slate-50 leading-relaxed">
                {email.body}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
