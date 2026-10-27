import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { AlertTriangle, HeartPulse, ShieldAlert, PhoneCall, CheckCircle2, IndianRupee } from 'lucide-react';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertCreated?: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  isOpen,
  onClose,
  onAlertCreated,
}) => {
  const { user, group } = useAuth();
  const { t, language } = useLanguage();

  const [crisisType, setCrisisType] = useState<string>('HEALTH');
  const [description, setDescription] = useState<string>('');
  const [grantAmount, setGrantAmount] = useState<string>('3000');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError(language === 'ta' ? 'அவசர நிலை பற்றிய விவரத்தை உள்ளிடவும்.' : 'Please describe the emergency crisis.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.createSosAlert({
        crisis_type: crisisType,
        description: description.trim(),
        amount_requested: grantAmount ? Number(grantAmount) : undefined,
      });

      setSuccess(res.message);
      if (onAlertCreated) onAlertCreated();
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setDescription('');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch SOS alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{language === 'ta' ? 'அவசர SOS & நிவாரண நிதி' : '🚨 Emergency SOS & Micro-Grant'}</span>
              </h3>
              <p className="text-xs text-rose-300">
                {language === 'ta'
                  ? 'உடனடி மருத்துவ / அவசர உதவிக்கான பொது எச்சரிக்கை'
                  : 'Instant Community Crisis Alert to Group & Super Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-600/40 rounded-lg text-xs text-rose-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-600/40 rounded-lg text-xs text-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crisis category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'ta' ? 'நெருக்கடி வகை' : 'Emergency Category'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'HEALTH', labelEn: 'Medical / Hospital', labelTa: 'மருத்துவ அவசரம்' },
                { id: 'ACCIDENT', labelEn: 'Accident Emergency', labelTa: 'விபத்து அவசரம்' },
                { id: 'DOMESTIC', labelEn: 'Family Crisis / Distress', labelTa: 'குடும்ப நெருக்கடி' },
                { id: 'DISASTER', labelEn: 'Natural Loss / Fire', labelTa: 'இயற்கை சீற்றம்' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCrisisType(cat.id)}
                  className={`py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                    crisisType === cat.id
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {language === 'ta' ? cat.labelTa : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {language === 'ta' ? 'அவசர நிலையை விளக்குக' : 'Describe the Urgent Situation'} <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'உடனடி மருத்துவமனை செலவு, மருந்து தேவை, அல்லது அவசர நிதி உதவி குறித்து விளக்குக...'
                  : 'Detail the medical emergency, immediate need for medicines, hospitalization, etc...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Micro grant amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {language === 'ta' ? 'தேவைப்படும் உடனடி நிவாரண நிதி (₹)' : 'Immediate Micro-Grant Needed (₹)'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <input
                type="number"
                min="500"
                max="10000"
                step="500"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              {[1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setGrantAmount(amt.toString())}
                  className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded hover:bg-slate-700"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 space-y-1">
            <div className="font-semibold flex items-center">
              <PhoneCall className="w-3.5 h-3.5 mr-1" />
              {language === 'ta' ? 'உடனடி அறிவிப்பு விநியோகம்:' : 'Immediate Priority Notification:'}
            </div>
            <p className="text-slate-300">
              {language === 'ta'
                ? 'உங்கள் தொலைபேசி எண் மற்றும் பகுதி உடனடியாக உங்கள் குழு நிர்வாகி மற்றும் முதன்மை நிர்வாகிக்கு சிவப்பு எச்சரிக்கையாக அனுப்பப்படும்.'
                : 'Your contact number and location will be flashed instantly on the Group Admin and Super Admin consoles with emergency priority.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-colors disabled:opacity-50"
            >
              {loading
                ? language === 'ta'
                  ? 'அனுப்பப்படுகிறது...'
                  : 'Broadcasting...'
                : language === 'ta'
                ? 'அவசர எச்சரிக்கை அனுப்பு'
                : 'Broadcast SOS Panic Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
