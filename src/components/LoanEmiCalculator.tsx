import React, { useState } from 'react';
import { useLanguage } from '../utils/translations';
import { Calculator, IndianRupee, Calendar, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface LoanEmiCalculatorProps {
  onSelectPlan?: (amount: number, tenure: number) => void;
}

export const LoanEmiCalculator: React.FC<LoanEmiCalculatorProps> = ({ onSelectPlan }) => {
  const { t, language } = useLanguage();

  const [principal, setPrincipal] = useState<number>(5000);
  const [tenureMonths, setTenureMonths] = useState<number>(6);
  const [interestRate, setInterestRate] = useState<number>(12); // 12% p.a. standard SHG micro-rate (1% / mo)
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>{t.loanCalculator}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                {language === 'ta' ? 'அதிகபட்சம் ₹10,000' : 'Capped at ₹10,000'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? 'விண்ணப்பிக்கும் முன் உங்கள் மாதாந்திர தவணையை கணக்கிட்டு திட்டமிடுங்கள்.'
                : 'Estimate your monthly installments and micro-interest obligations before submitting.'}
            </p>
          </div>
        </div>

        {onSelectPlan && (
          <button
            type="button"
            onClick={() => onSelectPlan(principal, tenureMonths)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow inline-flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
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
              <label className="text-xs font-medium text-slate-300">
                {t.loanAmount} (₹500 - ₹10,000)
              </label>
              <span className="text-base font-bold text-emerald-400 flex items-center">
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
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>₹1,000</span>
              <span>₹5,000</span>
              <span>₹10,000 (Max)</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-300">
                {t.tenureMonths}
              </label>
              <span className="text-sm font-bold text-white flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {tenureMonths} {language === 'ta' ? 'மாதங்கள்' : 'Months'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[3, 6, 9, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTenureMonths(m)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    tenureMonths === m
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate Note */}
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Cooperative SHG Rate:</span> 12% p.a. (1% simple monthly reducing balance) in compliance with Tamil Nadu Self-Help Group micro-finance guidelines.
            </div>
          </div>
        </div>

        {/* Output Cards */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {t.monthlyEmi}
            </div>
            <div className="text-3xl font-extrabold text-white mt-1 flex items-center">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
              <span>{roundedEmi.toLocaleString('en-IN')}</span>
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {language === 'ta' ? 'மாதம்' : 'month'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/80 text-xs">
            <div>
              <div className="text-slate-400">{t.totalInterest}</div>
              <div className="text-base font-bold text-amber-400 flex items-center mt-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                {totalInterest.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{t.totalPayable}</div>
              <div className="text-base font-bold text-emerald-400 flex items-center mt-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                {totalPayment.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Repayment visual ratio */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Principal: ₹{principal.toLocaleString('en-IN')}</span>
              <span>Interest: ₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 bg-amber-500 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(principal / totalPayment) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              {showSchedule
                ? language === 'ta'
                  ? 'தவணைப் பட்டியலை மறை'
                  : 'Hide Repayment Schedule'
                : language === 'ta'
                ? 'மாதாந்திர தவணை அட்டவணை காண்க'
                : 'View Repayment Schedule'}
            </button>
            <span className="text-slate-400 text-[11px]">
              {tenureMonths} installments
            </span>
          </div>
        </div>
      </div>

      {/* Month by month Schedule Table */}
      {showSchedule && (
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 mb-2">
            Month-by-Month Amortization Schedule:
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-2 px-3">Month</th>
                  <th className="py-2 px-3">EMI</th>
                  <th className="py-2 px-3">Principal</th>
                  <th className="py-2 px-3">Interest</th>
                  <th className="py-2 px-3">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-800/50">
                    <td className="py-2 px-3 font-semibold text-white">Month {row.month}</td>
                    <td className="py-2 px-3">₹{row.emi.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-emerald-400">₹{row.principal.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-amber-400">₹{row.interest.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3">₹{row.balance.toLocaleString('en-IN')}</td>
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
