import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { PendingScreen } from './components/PendingScreen';
import { MemberDashboard } from './components/MemberDashboard';
import { GroupAdminPanel } from './components/GroupAdminPanel';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { LanguageProvider } from './utils/translations';
import { Users, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-950/50">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex items-center space-x-2 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Loading Magalir Kuzhu Portal...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated but registration is PENDING or REJECTED
  if (user.status === 'PENDING' || user.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <PendingScreen />
      </div>
    );
  }

  // Approved User Routing based on Role
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Header />
      <main className="flex-1">
        {user.role === 'SUPER_ADMIN' && <SuperAdminDashboard />}
        {user.role === 'GROUP_ADMIN' && <GroupAdminPanel />}
        {user.role === 'USER' && <MemberDashboard />}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Magalir Kuzhu Management System · தமிழ்நாடு மகளிர் சுய உதவி குழு இணையம்
          </div>
          <div className="text-slate-600">
            Official 3-tier micro-loan sanction & SHG group coordination
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
