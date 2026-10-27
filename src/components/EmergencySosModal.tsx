import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { AlertTriangle, IndianRupee, CheckCircle2, X } from 'lucide-react';

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

  const crisisOptions = [
    { value: 'HEALTH', label: t.crisisMedical },
    { value: 'LIVELIHOOD', label: t.crisisCropLoss },
    { value: 'FAMILY', label: t.crisisFamilyEmergency },
    { value: 'DISASTER', label: t.crisisDisaster },
    { value: 'OTHER', label: t.crisisOther },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-300 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {t.emergencySosTitle}
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                {t.emergencySosSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.crisisTypeLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {crisisOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCrisisType(opt.value)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                    crisisType === opt.value
                      ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Requested */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.grantAmountRequested}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="500"
                max="10000"
                step="500"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="e.g. 3000"
                className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.crisisDescriptionLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.crisisDescriptionPlaceholder}
              className="block w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? t.submittingSos : t.submitSosAlert}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
