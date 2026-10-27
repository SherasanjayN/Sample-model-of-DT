import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { Users, Lock, Mail, Phone, MapPin, Building, ShieldCheck, UserCheck, User as UserIcon, AlertCircle, CheckCircle2, Globe, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regArea, setRegArea] = useState('');
  const [regDistrict, setRegDistrict] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateRegistration = () => {
    const errors: Record<string, string> = {};

    if (!regName.trim() || regName.trim().length < 3) {
      errors.name = language === 'ta' ? 'பெயர் குறைந்தது 3 எழுத்துக்கள் இருக்க வேண்டும்.' : 'Name must be at least 3 letters.';
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      errors.phone = language === 'ta' ? 'தொலைபேசி எண் சரியாக 10 இலக்கங்கள் இருக்க வேண்டும்.' : 'Phone number must be exactly 10 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      errors.email = language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.';
    }

    if (!regArea.trim()) {
      errors.area = language === 'ta' ? 'குழு ஒதுக்கீட்டிற்கு பகுதி அவசியம்.' : 'Area is required for local group allocation.';
    }

    if (!regDistrict.trim()) {
      errors.district = language === 'ta' ? 'மாவட்டம் கட்டாயமானது.' : 'District is mandatory.';
    }

    // Password ≥ 6 characters alphanumeric
    if (regPassword.length < 6 || !/[a-zA-Z]/.test(regPassword) || !/\d/.test(regPassword)) {
      errors.password = language === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களுடன் எண்களையும் கொண்டிருக்க வேண்டும்.' : 'Password must be at least 6 characters with both letters and numbers.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError(language === 'ta' ? 'உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல் இரண்டையும் உள்ளிடவும்.' : 'Please enter both your email address and password.');
      return;
    }

    try {
      setLoginLoading(true);
      await login(loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setLoginError(err.message || (language === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!validateRegistration()) {
      return;
    }

    try {
      setRegLoading(true);
      const res = await register({
        name: regName.trim(),
        phone: regPhone.replace(/\D/g, ''),
        email: regEmail.trim(),
        area: regArea.trim(),
        district: regDistrict.trim(),
        password: regPassword,
      });

      setRegSuccess(res.message || t.registrationReceived);
      // Clear fields
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegArea('');
      setRegDistrict('');
      setRegPassword('');
      setFieldErrors({});
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
      if (err.details) {
        setFieldErrors(err.details);
      }
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Bar with Language Selector */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
        <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
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
          className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
            language === 'ta'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          தமிழ்
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
            <Users className="w-8 h-8" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-900">
          {t.systemTitle}
        </h1>
        <p className="mt-1 text-center text-xs sm:text-sm text-emerald-800 font-medium">
          {t.systemSubtitle}
        </p>

        {/* Tab switch */}
        <div className="mt-6 flex bg-slate-200/80 p-1 rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.portalSignIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
              setRegSuccess(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.newMemberRegistration}
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-emerald-100">
          {activeTab === 'login' ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.signInHeading}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.signInDescription}
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.registeredEmail}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t.registeredEmailPlaceholder}
                    className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {loginLoading ? t.authenticating : t.signIn}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {t.notRegisteredPrompt}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    {t.registerHere}
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.regHeading}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.regDescription}
                </p>
              </div>

              {regSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-800">{t.registrationReceived}</div>
                    <p className="text-emerald-700 mt-1">{regSuccess}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="mt-2 text-xs font-bold text-emerald-800 hover:underline inline-block"
                    >
                      {t.proceedToSignIn}
                    </button>
                  </div>
                </div>
              )}

              {regError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.fullName} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className={`block w-full px-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.name ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.phone} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      autoComplete="off"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className={`block w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.phone ? 'border-rose-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.emailAddress} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className={`block w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.email ? 'border-rose-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Area & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.areaLocality} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={regArea}
                      onChange={(e) => setRegArea(e.target.value)}
                      placeholder={t.areaPlaceholder}
                      className={`block w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.area ? 'border-rose-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.area && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.district} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value)}
                      placeholder={t.districtPlaceholder}
                      className={`block w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.district ? 'border-rose-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.district && (
                    <p className="text-xs text-rose-600 mt-1">{fieldErrors.district}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.regPasswordLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="off"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t.regPasswordPlaceholder}
                    className={`block w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.password ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {regLoading ? t.submittingReg : t.submitApplication}
                </button>
              </div>

              <div className="text-center pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {t.alreadyRegisteredPrompt}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    {t.signIn}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Quick Demo Credentials Card (Directly addresses the user's explicit request!) */}
        <div className="mt-6 bg-white p-5 rounded-2xl border border-emerald-200 shadow-md">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{t.demoCredentialsTitle}</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            {t.demoCredentialsSubtitle}
          </p>

          <div className="space-y-2.5">
            {/* Super Admin */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>{t.roleSuperAdmin} (Master)</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] mt-0.5">
                  Email: <span className="font-semibold text-slate-900">sherasanjayn@gmail.com</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  Password: <span className="font-semibold text-slate-900">Shera@0404</span>
                </div>
                <div className="text-[10px] text-amber-800 mt-0.5">
                  {t.superAdminRoleDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill('sherasanjayn@gmail.com', 'Shera@0404')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors text-[11px] whitespace-nowrap ml-2"
              >
                {t.clickToFill}
              </button>
            </div>

            {/* Group Admin */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>{t.roleGroupAdmin} (Kavitha - Chennai)</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] mt-0.5">
                  Email: <span className="font-semibold text-slate-900">kavitha.shg@gmail.com</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  Password: <span className="font-semibold text-slate-900">Member@123</span>
                </div>
                <div className="text-[10px] text-emerald-800 mt-0.5">
                  {t.groupAdminRoleDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill('kavitha.shg@gmail.com', 'Member@123')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors text-[11px] whitespace-nowrap ml-2"
              >
                {t.clickToFill}
              </button>
            </div>

            {/* Member */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  <span>{t.roleMember} (Lakshmi Priya)</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px] mt-0.5">
                  Email: <span className="font-semibold text-slate-900">lakshmi.priya@gmail.com</span>
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  Password: <span className="font-semibold text-slate-900">Member@123</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {t.memberRoleDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill('lakshmi.priya@gmail.com', 'Member@123')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition-colors text-[11px] whitespace-nowrap ml-2"
              >
                {t.clickToFill}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
