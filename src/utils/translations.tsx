import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

export const translations = {
  en: {
    systemTitle: 'Magalir Kuzhu Management System',
    systemSubtitle: 'Self-Help Group (SHG) & Micro-Finance Portal',
    tamilBadge: 'மகளிர் குழு',
    signIn: 'Sign In',
    register: 'New Member Registration',
    signOut: 'Sign Out',
    myLoans: 'My Loans & Status',
    applyLoan: 'Apply for Micro-Loan',
    loanCalculator: 'Loan EMI Calculator',
    groupChat: 'Group Chat',
    noticeboard: 'Noticeboard',
    kuzhuDirectory: 'Kuzhu Directory',
    emergencySos: '🚨 Emergency SOS & Crisis Grant',
    meetingMinutes: '📅 Meeting Minutes & Attendance (MoM)',
    downloadPdf: 'Download PDF Report',
    superAdminPanel: 'Super Admin Master Console',
    groupAdminPanel: 'Group Admin Control Panel',
    memberDashboard: 'Member Portal',
    pendingApprovals: 'Pending Approvals',
    allUsers: 'All Users & Roles',
    activeGroups: 'Active Groups & Chat',
    threeTierLoans: '3-Tier Loan Approvals',
    broadcastAnnouncements: 'Broadcast Announcements',
    emailAuditLog: 'Email Sanction Audit Log',
    loanAmount: 'Loan Amount',
    disbursalMode: 'Disbursal Mode',
    tenureMonths: 'Tenure (Months)',
    monthlyEmi: 'Estimated Monthly EMI',
    totalPayable: 'Total Payable',
    totalInterest: 'Total Interest',
    applyWithPlan: 'Apply with this Plan',
    calculateRepayment: 'Calculate Estimated Repayment',
    sosAlertDescription: 'Sudden crisis? Request immediate community grant assistance.',
    sosActiveNotice: '🚨 ACTIVE EMERGENCY SOS ALERTS',
    resolveAlert: 'Mark Resolved & Provide Aid',
    recordMeeting: 'Record Weekly Meeting Minutes (MoM)',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    totalSavings: 'Total Savings Collected (₹)',
    resolutionsNotes: 'Meeting Resolutions & Notes',
    generatePdf: 'Export Official MoM PDF',
  },
  ta: {
    systemTitle: 'மகளிர் குழு மேலாண்மை அமைப்பு',
    systemSubtitle: 'சுய உதவிக் குழு மற்றும் நுண்கடன் மேலாண்மை தளம்',
    tamilBadge: 'மகளிர் குழு',
    signIn: 'உள்நுழைக',
    register: 'புதிய உறுப்பினர் பதிவு',
    signOut: 'வெளியேறு',
    myLoans: 'எனது கடன்கள் மற்றும் நிலை',
    applyLoan: 'நுண்கடன் கோரிக்கை விடுக்க',
    loanCalculator: 'கடன் தவணை (EMI) கணக்கீட்டாளர்',
    groupChat: 'குழு அரட்டை',
    noticeboard: 'அறிவிப்பு பலகை',
    kuzhuDirectory: 'உறுப்பினர்கள் பட்டியல்',
    emergencySos: '🚨 அவசர உதவி & உடனடி நிவாரண நிதி',
    meetingMinutes: '📅 கூட்ட குறிப்புகள் & வருகைப்பதிவு (MoM)',
    downloadPdf: 'PDF அறிக்கையை பதிவிறக்குக',
    superAdminPanel: 'முதன்மை நிர்வாகி தளம் (Super Admin)',
    groupAdminPanel: 'குழு நிர்வாகி தளம் (Group Admin)',
    memberDashboard: 'உறுப்பினர் தளம் (Member)',
    pendingApprovals: 'நிலுவையிலுள்ள பதிவுகள்',
    allUsers: 'அனைத்து பயனர்கள் & பொறுப்புகள்',
    activeGroups: 'செயலில் உள்ள குழுக்கள்',
    threeTierLoans: '3-அடுக்கு கடன் ஒப்புதல் மையம்',
    broadcastAnnouncements: 'அனைவருக்கும் அறிவித்தல்',
    emailAuditLog: 'மின்னஞ்சல் தணிக்கை அறிக்கை',
    loanAmount: 'கடன் தொகை',
    disbursalMode: 'வழங்கும் முறை',
    tenureMonths: 'தவணைக்காலம் (மாதங்கள்)',
    monthlyEmi: 'மாதாந்திர தவணைத் தொகை (EMI)',
    totalPayable: 'மொத்தம் செலுத்த வேண்டியது',
    totalInterest: 'மொத்த வட்டி',
    applyWithPlan: 'இந்த திட்டத்துடன் விண்ணப்பிக்க',
    calculateRepayment: 'மாத தவணையை கணக்கிடுக',
    sosAlertDescription: 'அவசர மருத்துவ அல்லது குடும்ப நெருக்கடி? உடனடி சமூக உதவி பெறுக.',
    sosActiveNotice: '🚨 அவசர உதவி கோரிக்கைகள் (SOS ALERTS)',
    resolveAlert: 'தீர்வு காண்க & நிதியுதவி வழங்குக',
    recordMeeting: 'வாராந்திர கூட்ட குறிப்புகளை பதிவு செய்க',
    present: 'வருகை',
    absent: 'இல்லை',
    late: 'தாமதம்',
    totalSavings: 'சேகரிக்கப்பட்ட மொத்த சேமிப்பு (₹)',
    resolutionsNotes: 'கூட்ட தீர்மானங்கள் மற்றும் குறிப்புகள்',
    generatePdf: 'அதிகாரப்பூர்வ MoM PDF பதிவிறக்கு',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('mk_language') as Language) || 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('mk_language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
