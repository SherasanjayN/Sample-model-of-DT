import React from 'react';
import { useLanguage } from '../utils/translations';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  FileCode2,
  Zap,
} from 'lucide-react';

interface AiTechExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiTechExplanationModal: React.FC<AiTechExplanationModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {language === 'ta'
                  ? 'பயன்படுத்தப்பட்ட AI தொழில்நுட்பம் (Architecture & Interview Viva)'
                  : 'AI Technology Used (Architecture & Viva Guide)'}
              </h2>
              <p className="text-xs text-emerald-800 font-semibold">
                {language === 'ta'
                  ? 'மகளிர் குழு மேலாண்மை அமைப்பில் குரல் வழி தரவு உள்ளீடு & கலப்பின சரிபார்ப்பு'
                  : 'Voice-to-Text Data Entry & Hybrid AI Validation Pipeline in SHG Portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pillar 1 */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>1. Dual-Language Acoustic Engine</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'ta' ? 'தமிழ் & ஆங்கில ஒலிப்பு முறை' : 'Web Speech API (ta-IN & en-IN)'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ta'
                ? 'கிராமப்புற மகளிர் குழு உறுப்பினர்கள் தட்டச்சு செய்ய சிரமப்படாமல், தமிழ் அல்லது ஆங்கிலத்தில் நேரடியாக பேசும் வசதி. ta-IN & en-IN மொழியமைப்புகள் மூலம் துல்லியமாக குரல் கண்டறியப்படுகிறது.'
                : 'Provides accessible hands-free input for rural SHG members. Listens to regional Tamil (ta-IN) and Indian English (en-IN) phonetic streams with real-time audio chunking.'}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-sky-800 font-bold text-xs">
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>2. NLP Entity Normalization</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'ta' ? 'எண் சொற்களை தொகையாக மாற்றுதல்' : 'Spoken Number to Integer Mapping'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ta'
                ? '"ஐந்தாயிரம்", "8000 ரூபாய்", "five thousand" போன்ற பேச்சு வார்த்தைகளை 5000 அல்லது 8000 என்ற துல்லியமான எண்களாக உடனுக்குடன் மாற்றுகிறது.'
                : 'Extracts numeric quantities from natural spoken vernacular (e.g., "ஐந்தாயிரம்" → 5000, "8k" → 8000, "four thousand" → 4000), eliminating typing errors.'}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>3. Hybrid Semantic & Rule Guardrails</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'ta' ? 'தவறான சொற்களை தடுத்தல்' : 'Semantic Halting & ₹10K Limit'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ta'
                ? 'கடன் தொகை புலத்தில் "loan", "உதவி", "பணம்" என்று பேசினால், அதை ஏற்காமல் "எண்ணை மட்டும் கூறவும்" என்று தடுத்து நிறுத்துகிறது. மேலும் ₹10,000 அதிகபட்ச வரம்பை உறுதி செய்கிறது.'
                : 'Active semantic filter: If user speaks "loan" into an amount box, the system catches the semantic mismatch and halts with guidance instead of populating corrupt data.'}
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
            <div className="flex items-center space-x-2 text-purple-800 font-bold text-xs">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>4. Human-in-the-Loop Confirmation</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'ta' ? 'குரல் உறுதிப்படுத்தல் கார்டு' : 'Modal Feedback & Verification'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ta'
                ? 'கண்டறியப்பட்ட தொகையை திரையில் காட்டி, பயனர் "உறுதிப்படுத்து" (Confirm) செய்த பின்னரே படிவத்தில் நிரப்புகிறது.'
                : 'Displays explicit visual confirmation ("Detected: ₹5,000. Is this correct? Yes / Retry") before modifying form state, adhering to banking safety principles.'}
            </p>
          </div>
        </div>

        {/* Interview / Project Defense Quick Reference */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <FileCode2 className="w-4 h-4 text-emerald-600" />
            <span>Interview Defense & Key Talking Points</span>
          </div>
          <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong>Why Hybrid AI over Pure LLM for Forms?</strong> Banking and micro-finance require deterministic precision. Using Web Speech API + Lexical Parser + Deterministic Cap Rules guarantees 100% compliance with Tamil Nadu SHG ₹10,000 regulations while eliminating hallucination risk.
            </li>
            <li>
              <strong>Edge/Offline Resilience:</strong> The speech normalization logic runs natively on the client and node runtime without incurring per-character cloud API costs for basic digit recognition.
            </li>
            <li>
              <strong>Bilingual Inclusivity:</strong> Supports both Tamil Nadu rural terminology (மகளிர் குழு, கடன், தவணை) and English administrative terms interchangeably.
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {language === 'ta' ? 'புரிந்தது / மூடு' : 'Close Architecture Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
