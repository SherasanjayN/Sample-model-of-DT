import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Lock, Mail, Phone, MapPin, Building, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
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
      errors.name = 'Name must be at least 3 letters.';
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!regArea.trim()) {
      errors.area = 'Area is required for local group allocation.';
    }

    if (!regDistrict.trim()) {
      errors.district = 'District is mandatory.';
    }

    // Password ≥ 6 characters alphanumeric
    if (regPassword.length < 6 || !/[a-zA-Z]/.test(regPassword) || !/\d/.test(regPassword)) {
      errors.password = 'Password must be at least 6 characters with both letters and numbers.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter both your email address and password.');
      return;
    }

    try {
      setLoginLoading(true);
      await login(loginEmail.trim(), loginPassword);
      // Navigation is reactive based on user state in App.tsx
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
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

      setRegSuccess(
        res.message ||
          'Registration submitted successfully! Your application has been queued for Super Admin review and group allocation.'
      );
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-radial from-slate-800 to-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
            <Users className="w-9 h-9" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Magalir Kuzhu Management System
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          மகளிர் சுய உதவி குழு கடன் மற்றும் உறுப்பினர்கள் மேலாண்மை
        </p>

        {/* Tab switch */}
        <div className="mt-6 flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Portal Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
              setRegSuccess(null);
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Member Registration
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800/90 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-700 backdrop-blur-sm">
          {activeTab === 'login' ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5" autoComplete="off">
              <div>
                <h3 className="text-lg font-semibold text-white">Sign In to Your Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Access your group portal, loan applications, and announcements.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Email Address
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
                    placeholder="Enter your registered email"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
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
                    placeholder="Enter your account password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {loginLoading ? 'Authenticating...' : 'Sign In'}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  New member wishing to join an SHG group?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-emerald-400 hover:underline font-medium"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
              <div>
                <h3 className="text-lg font-semibold text-white">New Member Registration</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submit your details for Super Admin review and local group allocation.
                </p>
              </div>

              {regSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-sm flex items-start space-x-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-300">Registration Received</div>
                    <p className="text-xs text-emerald-200 mt-1">{regSuccess}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      Proceed to Portal Sign In &rarr;
                    </button>
                  </div>
                </div>
              )}

              {regError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name (minimum 3 letters) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Anitha Soundararajan"
                    className={`block w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.name ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-rose-400 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Phone & Email in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone (exactly 10 digits) <span className="text-rose-400">*</span>
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
                      placeholder="9876543210"
                      className={`block w-full pl-9 pr-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.phone ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
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
                      placeholder="member@gmail.com"
                      className={`block w-full pl-9 pr-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.email ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Area & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Area / Locality <span className="text-rose-400">*</span>
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
                      placeholder="e.g. Mylapore, Tambaram"
                      className={`block w-full pl-9 pr-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.area ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                  </div>
                  {fieldErrors.area && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    District <span className="text-rose-400">*</span>
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
                      placeholder="e.g. Chennai, Madurai"
                      className={`block w-full pl-9 pr-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.district ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />
                  </div>
                  {fieldErrors.district && (
                    <p className="text-xs text-rose-400 mt-1">{fieldErrors.district}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password (≥ 6 characters, alphanumeric) <span className="text-rose-400">*</span>
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
                    placeholder="Create a secure alphanumeric password"
                    className={`block w-full pl-9 pr-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.password ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-400 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {regLoading ? 'Submitting Registration...' : 'Submit Application for Approval'}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-emerald-400 hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
