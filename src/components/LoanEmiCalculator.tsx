import React, { useState } from 'react';
import { useLanguage } from '../utils/translations';
import { Calculator, IndianRupee, Calendar, TrendingUp, ArrowRight } from 'lucide-react';

interface LoanEmiCalculatorProps {
  onSelectPlan?: (amount: number, tenure: number) => void;
}

export const LoanEmiCalculator: React.FC<LoanEmiCalculatorProps> = ({ onSelectPlan }) => {
  const { t, language } = useLanguage();

  const [principal, setPrincipal] = useState<number>(5000);
  const [tenureMonths, setTenureMonths] = useState<number>(6);
  const interestRate = 12; // 12% p.a. standard SHG micro-rate (1% / mo)
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // EMI Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / (12 * 100);
  const numMonths = tenureMonths;

  let emi = 0;
  if (monthlyRate === 0) {
    emi = principal / numMonths;
  } else {
    emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numMonths)) /
      (Math.pow(1 + monthlyRate, numMonths) - 1);
  }

  const roundedEmi = Math.round(emi);
  const totalPayment = roundedEmi * numMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  // Generate breakdown schedule
  const schedule = [];
  let balance = principal;
  for (let m = 1; m <= numMonths; m++) {
    const interestPart = Math.round(balance * monthlyRate);
    const principalPart = roundedEmi - interestPart;
    balance = Math.max(0, balance - principalPart);
    schedule.push({
      month: m,
      emi: roundedEmi,
      principal: principalPart,
      interest: interestPart,
      balance,
    });
  }

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>{t.calculatorTitle}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                {t.calculatorCappedBadge}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {t.calculatorSubtitle}
            </p>
          </div>
        </div>

        {onSelectPlan && (
          <button
            type="button"
            onClick={() => onSelectPlan(principal, tenureMonths)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <span>{t.applyWithPlan}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Sliders */}
        <div className="space-y-5">
          {/* Principal */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                {t.principalAmount} (₹1,000 - ₹10,000)
              </label>
              <span className="text-base font-extrabold text-emerald-700 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {principal.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>₹1,000</span>
              <span>₹5,000</span>
              <span className="font-semibold text-emerald-800">₹10,000 (Max)</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                {t.tenureMonths}
              </label>
              <span className="text-sm font-bold text-slate-800 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {tenureMonths} {language === 'ta' ? 'மாதங்கள்' : 'Months'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 9, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTenureMonths(m)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    tenureMonths === m
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate Note */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900">{language === 'ta' ? 'சுய உதவி குழு வட்டி விகிதம்:' : 'Cooperative SHG Rate:'}</span> {t.coopInterestNote}
            </div>
          </div>
        </div>

        {/* Output Cards */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-emerald-800 uppercase tracking-wider font-bold">
              {t.monthlyEmi}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 flex items-center">
              <IndianRupee className="w-7 h-7 text-emerald-600" />
              <span>{roundedEmi.toLocaleString('en-IN')}</span>
              <span className="text-xs font-semibold text-slate-500 ml-1.5">
                / {language === 'ta' ? 'மாதம்' : 'month'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-200/80 text-xs">
            <div>
              <div className="text-slate-600 font-semibold">{t.totalInterest}</div>
              <div className="text-base font-extrabold text-amber-700 flex items-center mt-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                {totalInterest.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">{t.totalPayable}</div>
              <div className="text-base font-extrabold text-emerald-700 flex items-center mt-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                {totalPayment.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Repayment visual ratio */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 font-semibold mb-1">
              <span>{t.principal}: ₹{principal.toLocaleString('en-IN')}</span>
              <span>{t.interest}: ₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2.5 bg-amber-200 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full transition-all"
                style={{ width: `${(principal / totalPayment) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-emerald-700 hover:text-emerald-800 underline font-bold"
            >
              {showSchedule ? t.hideRepaymentSchedule : t.viewRepaymentSchedule}
            </button>
            <span className="text-slate-500 text-[11px] font-medium">
              {tenureMonths} {t.installmentsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Month by month Schedule Table */}
      {showSchedule && (
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-2">
            {language === 'ta' ? 'மாதாந்திர தவணை பகிர்வு அட்டவணை:' : 'Month-by-Month Amortization Schedule:'}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50 text-emerald-950 font-bold text-[11px] uppercase border-b border-emerald-100">
                <tr>
                  <th className="py-2.5 px-3">{t.month}</th>
                  <th className="py-2.5 px-3">{t.monthlyEmi}</th>
                  <th className="py-2.5 px-3">{t.principal}</th>
                  <th className="py-2.5 px-3">{t.interest}</th>
                  <th className="py-2.5 px-3">{t.remainingBalance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.month} {row.month}</td>
                    <td className="py-2.5 px-3 font-semibold">₹{row.emi.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">₹{row.principal.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-amber-700 font-semibold">₹{row.interest.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-medium">₹{row.balance.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
