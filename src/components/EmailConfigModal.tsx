import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertTriangle, Key, ShieldCheck, HelpCircle, ExternalLink, RefreshCw, X, Eye, EyeOff, Send } from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../utils/translations';
import { SmtpStatusResponse } from '../types';

interface EmailConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  smtpStatus: SmtpStatusResponse | null;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  smtpStatus,
}) => {
  const { t, language } = useLanguage();

  const [provider, setProvider] = useState<'gmail' | 'custom'>('gmail');
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [user, setUser] = useState('sherasanjayn@gmail.com');
  const [pass, setPass] = useState('');
  const [fromName, setFromName] = useState('Magalir Kuzhu Management System');
  const [fromEmail, setFromEmail] = useState('sherasanjayn@gmail.com');
  const [showPassword, setShowPassword] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testRecipient, setTestRecipient] = useState('sherasanjayn@gmail.com');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (smtpStatus?.config) {
      const cfg = smtpStatus.config;
      setProvider(cfg.provider === 'custom' ? 'custom' : 'gmail');
      setHost(cfg.host || 'smtp.gmail.com');
      setPort(cfg.port || 465);
      setSecure(cfg.secure !== false);
      setUser(cfg.user || 'sherasanjayn@gmail.com');
      setFromName(cfg.from_name || 'Magalir Kuzhu Management System');
      setFromEmail(cfg.from_email || cfg.user || 'sherasanjayn@gmail.com');
      setTestRecipient(cfg.user || 'sherasanjayn@gmail.com');
    }
  }, [smtpStatus]);

  if (!isOpen) return null;

  const handleApplyPreset = (type: 'gmail-ssl' | 'gmail-tls' | 'custom') => {
    if (type === 'gmail-ssl') {
      setProvider('gmail');
      setHost('smtp.gmail.com');
      setPort(465);
      setSecure(true);
    } else if (type === 'gmail-tls') {
      setProvider('gmail');
      setHost('smtp.gmail.com');
      setPort(587);
      setSecure(false);
    } else {
      setProvider('custom');
      setHost('');
      setPort(587);
      setSecure(false);
    }
  };

  const handleSaveAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim()) {
      setStatusMessage({ type: 'error', text: language === 'ta' ? 'அனுப்புநர் மின்னஞ்சல் தேவை.' : 'Sender email is required.' });
      return;
    }
    if (!pass && !smtpStatus?.config?.has_password) {
      setStatusMessage({ type: 'error', text: language === 'ta' ? '16-எழுத்து கூகிள் App Password தேவை.' : 'Google App Password is required.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage({ type: 'info', text: t.verifyingSmtp });

    try {
      const res = await api.saveSmtpConfig({
        provider,
        host,
        port: Number(port),
        secure,
        user: user.trim(),
        pass: pass.trim() || undefined,
        from_name: fromName.trim(),
        from_email: fromEmail.trim() || user.trim(),
        enabled: true,
      });

      if (res.verified) {
        setStatusMessage({
          type: 'success',
          text: language === 'ta'
            ? '✅ SMTP இணைப்பு வெற்றிகரமாக சரிபார்க்கப்பட்டு சேமிக்கப்பட்டது! நேரடி ஜிமெயில் விநியோகம் தயார்.'
            : '✅ SMTP connection verified and saved! Real emails will now deliver to recipient inboxes.',
        });
        onSaved();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.verification_message || (language === 'ta' ? 'இணைப்பு பிழை ஏற்பட்டது.' : 'SMTP connection failed. Check your App Password.'),
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save SMTP configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestOnly = async () => {
    setIsVerifying(true);
    setStatusMessage({ type: 'info', text: t.verifyingSmtp });
    try {
      const res = await api.verifySmtp({
        host,
        port: Number(port),
        secure,
        user: user.trim(),
        pass: pass.trim() || undefined,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: language === 'ta' ? '✅ SMTP இணைப்பு வெற்றிகரமாக இணைக்கப்பட்டது!' : '✅ Connected to SMTP server successfully!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'SMTP Handshake failed. Please verify credentials.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Connection test failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendTestToRecipient = async () => {
    if (!testRecipient) return;
    setIsSendingTest(true);
    setStatusMessage({
      type: 'info',
      text: language === 'ta' ? `${testRecipient}-க்கு மாதிரி மின்னஞ்சல் அனுப்புகிறது...` : `Dispatching test email to ${testRecipient}...`,
    });

    try {
      const res = await api.sendTestEmail({
        to: testRecipient.trim(),
        userName: 'Sanjay N (Super Admin)',
        amount: 5000,
      });

      if (res.delivery_mode === 'REAL_SMTP') {
        setStatusMessage({
          type: 'success',
          text: language === 'ta'
            ? `✅ உண்மை மின்னஞ்சல் ${testRecipient}-க்கு அனுப்பப்பட்டது! உங்கள் ஜிமெயில் இன்பாக்ஸ் அல்லது ஸ்பேம் ஃபோல்டரை பார்க்கவும்.`
            : `✅ Real email delivered to ${testRecipient}! Please check your Gmail inbox (or spam folder).`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: language === 'ta'
            ? `⚠️ மாதிரி அஞ்சல் மெய்நிகர் சாண்ட்பாக்ஸில் மட்டுமே பதிவானது. உண்மையான ஜிமெயிலில் பெற App Password சேமிக்கவும்.`
            : `⚠️ Dispatched to Virtual Sandbox only. Real Gmail delivery requires saving your Google App Password.`,
        });
      }
      onSaved();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send test email' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResetToSandbox = async () => {
    try {
      await api.resetSmtpToSandbox();
      setStatusMessage({
        type: 'info',
        text: language === 'ta' ? 'டெவலப்பர் மெய்நிகர் சோதனை முறைக்கு மாற்றப்பட்டது.' : 'Switched to Developer Virtual Sandbox mode.',
      });
      onSaved();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.smtpSettingsTitle}</h3>
              <p className="text-xs text-slate-500">{t.smtpSettingsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* Current Mode Badge */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t.activeTransportMode}
              </div>
              <div className="text-sm font-bold text-slate-900 flex items-center mt-0.5">
                {smtpStatus?.active_mode === 'REAL_SMTP' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 inline-block animate-pulse"></span>
                    <span className="text-emerald-700">{t.liveSmtpActive}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 inline-block"></span>
                    <span className="text-amber-700">{t.sandboxActive}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {smtpStatus?.active_mode === 'REAL_SMTP' ? t.liveSmtpDesc : t.sandboxDesc}
              </p>
            </div>
            {smtpStatus?.active_mode === 'REAL_SMTP' && (
              <button
                type="button"
                onClick={handleResetToSandbox}
                className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {t.switchToSandbox}
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t.smtpProvider} & Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('gmail-ssl')}
                className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all ${
                  provider === 'gmail' && port === 465
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Gmail SSL (465)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('gmail-tls')}
                className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all ${
                  provider === 'gmail' && port === 587
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Gmail TLS (587)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('custom')}
                className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all ${
                  provider === 'custom'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t.customSmtp}
              </button>
            </div>
          </div>

          {/* Gmail Setup Instructions Accordion */}
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowGuide(!showGuide)}
            >
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t.gmailSetupGuideTitle}</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">
                {showGuide ? (language === 'ta' ? 'மறைக்க' : 'Hide Guide') : (language === 'ta' ? 'வழிகாட்டலைக் காட்ட' : 'Show Guide')}
              </span>
            </div>
            {showGuide && (
              <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-950 space-y-2">
                <p className="leading-relaxed font-normal">
                  Google requires an <strong>App Password</strong> instead of your regular Gmail password when sending automated emails.
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11.5px] text-slate-700">
                  <li>{t.gmailStep1}</li>
                  <li>{t.gmailStep2}</li>
                  <li>{t.gmailStep3}</li>
                  <li>{t.gmailStep4}</li>
                </ol>
                <div className="pt-1">
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline"
                  >
                    <span>{language === 'ta' ? 'கூகிள் ஆப் பாஸ்வேர்ட் பக்கத்திற்கு செல்ல' : 'Open Google App Passwords Page'}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndVerify} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.smtpUsername} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={user}
                  onChange={(e) => {
                    setUser(e.target.value);
                    if (!fromEmail || fromEmail === user) setFromEmail(e.target.value);
                  }}
                  placeholder="sherasanjayn@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.smtpPassword} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder={
                      smtpStatus?.config?.has_password
                        ? '•••••••••••••••• (Saved. Leave blank to keep)'
                        : t.smtpPasswordPlaceholder
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.smtpHost}
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.smtpPort}
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setPort(p);
                    if (p === 465) setSecure(true);
                    if (p === 587) setSecure(false);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Mode
                </label>
                <select
                  value={secure ? 'ssl' : 'tls'}
                  onChange={(e) => setSecure(e.target.value === 'ssl')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-white"
                >
                  <option value="ssl">SSL (Port 465)</option>
                  <option value="tls">STARTTLS (Port 587)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.fromDisplayName}
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  From Email
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestOnly}
                disabled={isVerifying || isSaving}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{isVerifying ? t.verifyingSmtp : (language === 'ta' ? 'இணைப்பை மட்டும் சோதிக்க' : 'Test Connection Handshake')}</span>
              </button>

              <div className="w-full sm:w-auto flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  {t.close}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isVerifying}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isSaving ? t.verifyingSmtp : t.saveAndVerifyBtn}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Test Dispatch to Real Inbox */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center">
              <Send className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
              {language === 'ta' ? 'நேரடி மாதிரி அஞ்சல் சோதனை' : 'Send Real Test Email'}
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              {language === 'ta'
                ? 'உங்கள் sherasanjayn@gmail.com அல்லது ஏதேனும் மின்னஞ்சல் முகவரியை உள்ளிட்டு மாதிரி கடன் ஒப்புதல் அறிவிப்பை உடனடியாக அனுப்பி சோதிக்கவும்.'
                : 'Send an instant test loan sanction notification to your Gmail address to verify real inbox delivery.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="sherasanjayn@gmail.com"
                className="w-full sm:flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium"
              />
              <button
                type="button"
                onClick={handleSendTestToRecipient}
                disabled={isSendingTest || !testRecipient}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 shrink-0"
              >
                <Send className="w-3 h-3 text-emerald-400" />
                <span>
                  {isSendingTest
                    ? (language === 'ta' ? 'அனுப்புகிறது...' : 'Sending...')
                    : (language === 'ta' ? 'சோதனை அஞ்சல் அனுப்புக' : 'Send Test Notice')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
