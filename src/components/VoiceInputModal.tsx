import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../utils/translations';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

export interface VoiceValidationResult {
  isValid: boolean;
  parsedValue?: string | number;
  displayText?: string;
  errorMessage?: string;
  rawTranscript: string;
}

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: 'amount' | 'phone' | 'purpose' | 'name' | 'area';
  fieldLabel: string;
  onApplyValue: (value: string | number) => void;
  onOpenAiTech?: () => void;
}

// Tamil number word mappings to integers
const TAMIL_NUMBERS: Record<string, number> = {
  'ஆயிரம்': 1000,
  'ஒன்றாயிரம்': 1000,
  'இரண்டாயிரம்': 2000,
  'ரெண்டாயிரம்': 2000,
  'மூன்றாயிரம்': 3000,
  'நான்காயிரம்': 4000,
  'ஐந்தாயிரம்': 5000,
  'அஞ்சாயிரம்': 5000,
  'ஆறாயிரம்': 6000,
  'ஏழாயிரம்': 7000,
  'எட்டாயிரம்': 8000,
  'ஒன்பதாயிரம்': 9000,
  'பத்தாயிரம்': 10000,
  'நூறு': 100,
  'ஐநூறு': 500,
};

const ENGLISH_NUMBERS: Record<string, number> = {
  'one thousand': 1000,
  'two thousand': 2000,
  'three thousand': 3000,
  'four thousand': 4000,
  'five thousand': 5000,
  'six thousand': 6000,
  'seven thousand': 7000,
  'eight thousand': 8000,
  'nine thousand': 9000,
  'ten thousand': 10000,
  'five hundred': 500,
};

// Hybrid speech-to-field validator
export function validateVoiceInput(
  fieldName: 'amount' | 'phone' | 'purpose' | 'name' | 'area',
  rawTranscript: string,
  lang: 'en' | 'ta'
): VoiceValidationResult {
  const clean = rawTranscript.trim().toLowerCase();

  if (fieldName === 'amount') {
    // 1. Semantic Check: If user says "loan", "kadan", "help", "money" without any number, actively halt!
    const semanticNonNumericWords = ['loan', 'kadan', 'கடன்', 'money', 'help', 'cash', 'please', 'application'];
    const hasOnlySemanticWords = semanticNonNumericWords.some((w) => clean.includes(w)) && !/\d+/.test(clean);

    // Check Tamil words
    let matchedTamilAmount: number | null = null;
    for (const [tWord, val] of Object.entries(TAMIL_NUMBERS)) {
      if (rawTranscript.includes(tWord)) {
        matchedTamilAmount = val;
        break;
      }
    }

    // Check English words
    let matchedEnglishAmount: number | null = null;
    for (const [eWord, val] of Object.entries(ENGLISH_NUMBERS)) {
      if (clean.includes(eWord)) {
        matchedEnglishAmount = val;
        break;
      }
    }

    // Direct number regex (e.g. 5000, 8000, 5k)
    let directNum: number | null = null;
    const directMatch = clean.match(/(\d+)\s*(k|thousand)?/);
    if (directMatch) {
      let num = parseInt(directMatch[1], 10);
      if (directMatch[2] === 'k' || directMatch[2] === 'thousand') {
        num = num * 1000;
      }
      directNum = num;
    }

    const detectedAmount = matchedTamilAmount || matchedEnglishAmount || directNum;

    if (detectedAmount !== null) {
      // Rule Engine: Check statutory cap
      if (detectedAmount > 10000) {
        return {
          isValid: false,
          rawTranscript,
          errorMessage:
            lang === 'ta'
              ? `கண்டறியப்பட்ட தொகை ₹${detectedAmount.toLocaleString('en-IN')}, ஆனால் மகளிர் குழு விதிமுறைப்படி அதிகபட்ச வரம்பு ₹10,000 ஆகும்.`
              : `Detected ₹${detectedAmount.toLocaleString('en-IN')}, but maximum allowable loan is capped strictly at ₹10,000 per Magalir Kuzhu rules.`,
        };
      }

      if (detectedAmount < 500) {
        return {
          isValid: false,
          rawTranscript,
          errorMessage:
            lang === 'ta'
              ? 'குறைந்தபட்ச கடன் தொகை ₹500 ஆகும்.'
              : 'Minimum allowable micro-credit loan is ₹500.',
        };
      }

      return {
        isValid: true,
        rawTranscript,
        parsedValue: detectedAmount,
        displayText: `₹${detectedAmount.toLocaleString('en-IN')}`,
      };
    }

    if (hasOnlySemanticWords || clean.length > 0) {
      return {
        isValid: false,
        rawTranscript,
        errorMessage:
          lang === 'ta'
            ? `தவறான உள்ளீடு: நீங்கள் கூறியது "${rawTranscript}". கடன் தொகைக்கு எண்ணை மட்டும் கூறவும் (எ.கா: "5000" அல்லது "ஐந்தாயிரம்").`
            : `Invalid Input: You spoke "${rawTranscript}". An amount field requires a number. Please say an amount like "5000" or "five thousand". The word "${clean}" is not a number.`,
      };
    }

    return {
      isValid: false,
      rawTranscript,
      errorMessage: lang === 'ta' ? 'தொகையை தெளிவாக பேசவும்.' : 'Please clearly speak a numerical loan amount.',
    };
  }

  if (fieldName === 'phone') {
    // Extract digits
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 10) {
      return {
        isValid: true,
        rawTranscript,
        parsedValue: digits,
        displayText: digits,
      };
    }
    return {
      isValid: false,
      rawTranscript,
      errorMessage:
        lang === 'ta'
          ? `கண்டறியப்பட்ட எண்கள்: ${digits.length}. அலைபேசி எண் சரியாக 10 இலக்கங்களாக இருக்க வேண்டும்.`
          : `Detected ${digits.length} digits. Mobile phone number must be exactly 10 digits.`,
    };
  }

  // Text fields (purpose, name, area)
  if (clean.length >= 3) {
    return {
      isValid: true,
      rawTranscript,
      parsedValue: rawTranscript.trim(),
      displayText: rawTranscript.trim(),
    };
  }

  return {
    isValid: false,
    rawTranscript,
    errorMessage:
      lang === 'ta'
        ? 'தயவுசெய்து குறைந்தது 3 எழுத்துக்களை தெளிவாக பேசவும்.'
        : 'Please speak clearly with at least 3 characters.',
  };
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  fieldName,
  fieldLabel,
  onApplyValue,
  onOpenAiTech,
}) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [validationResult, setValidationResult] = useState<VoiceValidationResult | null>(null);
  const [speechLanguage, setSpeechLanguage] = useState<'en-IN' | 'ta-IN'>(language === 'ta' ? 'ta-IN' : 'en-IN');
  const [browserSupport, setBrowserSupport] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSpeechLanguage(language === 'ta' ? 'ta-IN' : 'en-IN');
  }, [language]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setBrowserSupport(false);
      }
    }
  }, []);

  const handleStartListening = () => {
    setValidationResult(null);
    setTranscript('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupport(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Run validation whenever transcript finishes or manual test phrase clicked
  const processTranscript = (text: string) => {
    setTranscript(text);
    const lang = speechLanguage === 'ta-IN' ? 'ta' : 'en';
    const result = validateVoiceInput(fieldName, text, lang);
    setValidationResult(result);
  };

  useEffect(() => {
    if (!isListening && transcript.trim()) {
      processTranscript(transcript);
    }
  }, [isListening]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'ta' ? 'குரல் உள்ளீடு & AI சரிபார்ப்பு' : 'AI Voice-to-Text Entry'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'ta' ? `புலம்: ${fieldLabel}` : `Target Field: ${fieldLabel}`}
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

        {/* Language selector */}
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700 flex items-center">
            <Volume2 className="w-4 h-4 mr-1.5 text-emerald-600" />
            {language === 'ta' ? 'பேசும் மொழி:' : 'Speech Language:'}
          </span>
          <div className="flex space-x-1.5">
            <button
              type="button"
              onClick={() => setSpeechLanguage('en-IN')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                speechLanguage === 'en-IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              English (India)
            </button>
            <button
              type="button"
              onClick={() => setSpeechLanguage('ta-IN')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                speechLanguage === 'ta-IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              தமிழ் (India)
            </button>
          </div>
        </div>

        {/* Microphone Pulse & Status */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="relative">
            {isListening && (
              <span className="absolute -inset-3 rounded-full bg-emerald-400/30 animate-ping" />
            )}
            <button
              type="button"
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                isListening
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">
              {isListening
                ? language === 'ta'
                  ? 'கேட்கிறது... இப்போது பேசவும்'
                  : 'Listening... Speak now'
                : language === 'ta'
                ? 'பேச மைக்ரோஃபோனை அழுத்தவும்'
                : 'Click microphone to speak'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {fieldName === 'amount'
                ? language === 'ta'
                  ? 'எ.கா: "ஐந்தாயிரம்" அல்லது "5000 ரூபாய்"'
                  : 'e.g. "five thousand" or "5000"'
                : fieldName === 'phone'
                ? 'e.g. "9876543210"'
                : 'Speak clearly into your microphone'}
            </p>
          </div>
        </div>

        {/* Live Audio Transcript */}
        {transcript && (
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {language === 'ta' ? 'பதிவான பேச்சு (Transcript):' : 'Captured Speech Transcript:'}
            </span>
            <p className="text-sm font-semibold text-slate-900 italic">"{transcript}"</p>
          </div>
        )}

        {/* Validation Result Box */}
        {validationResult && (
          <div>
            {validationResult.isValid ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-bold">
                    {language === 'ta' ? 'குரல் சரிபார்ப்பு வெற்றிகரமானது!' : 'Voice Input Validated Successfully!'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                  <span className="text-xs text-slate-500 block">
                    {language === 'ta' ? 'கண்டறியப்பட்ட மதிப்பு:' : 'Detected Field Value:'}
                  </span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    {validationResult.displayText}
                  </span>
                </div>
                <p className="text-xs text-slate-600 text-center">
                  {language === 'ta'
                    ? 'இந்த மதிப்பு சரியாக உள்ளதா? கீழே உள்ள "உறுதிப்படுத்து" பொத்தானை அழுத்தவும்.'
                    : 'Is this value correct? Click "Confirm & Apply" to fill the form.'}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span className="text-sm font-bold">
                    {language === 'ta' ? 'சரிபார்ப்பு தோல்வி (Halted):' : 'Validation Halted:'}
                  </span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed font-medium">
                  {validationResult.errorMessage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Simulation Chips (Useful for audio test / evaluation) */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            {language === 'ta' ? 'சோதனை குரல் மாதிரிகள் (Test Chips):' : 'Quick Voice Test Chips:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {fieldName === 'amount' && (
              <>
                <button
                  type="button"
                  onClick={() => processTranscript('five thousand')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-xs rounded-lg border border-slate-200 transition-all font-medium"
                >
                  "five thousand" (₹5,000)
                </button>
                <button
                  type="button"
                  onClick={() => processTranscript('ஐந்தாயிரம்')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-xs rounded-lg border border-slate-200 transition-all font-medium"
                >
                  "ஐந்தாயிரம்" (Tamil ₹5,000)
                </button>
                <button
                  type="button"
                  onClick={() => processTranscript('8000 rupees')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-xs rounded-lg border border-slate-200 transition-all font-medium"
                >
                  "8000 rupees"
                </button>
                <button
                  type="button"
                  onClick={() => processTranscript('loan')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs rounded-lg border border-rose-200 transition-all font-bold"
                  title="Tests invalid semantic word rejection"
                >
                  "loan" (Test Semantic Rejection)
                </button>
                <button
                  type="button"
                  onClick={() => processTranscript('15000')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs rounded-lg border border-rose-200 transition-all font-bold"
                  title="Tests ₹10K cap rejection"
                >
                  "15000" (Test ₹10K Cap)
                </button>
              </>
            )}
            {fieldName === 'phone' && (
              <button
                type="button"
                onClick={() => processTranscript('9840223344')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 text-xs rounded-lg border border-slate-200 transition-all font-medium"
              >
                "9840223344"
              </button>
            )}
            {fieldName === 'purpose' && (
              <button
                type="button"
                onClick={() => processTranscript('Organic vegetable stall and seeds purchase')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 text-xs rounded-lg border border-slate-200 transition-all font-medium"
              >
                "Organic vegetable stall"
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          {onOpenAiTech && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAiTech();
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
            >
              <Info className="w-4 h-4 mr-1 text-emerald-600" />
              <span>{language === 'ta' ? 'AI தொழில்நுட்பம் எப்படி செயல்படுகிறது?' : 'AI Architecture Explanation'}</span>
            </button>
          )}

          <div className="flex space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {language === 'ta' ? 'ரத்து' : 'Cancel'}
            </button>

            {validationResult?.isValid && (
              <button
                type="button"
                onClick={() => {
                  if (validationResult.parsedValue !== undefined) {
                    onApplyValue(validationResult.parsedValue);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                {language === 'ta' ? 'உறுதிப்படுத்து & நிரப்பு' : 'Confirm & Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
