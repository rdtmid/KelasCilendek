import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { CurriculumGenerator } from './CurriculumGenerator';
import { MaterialGenerator } from './MaterialGenerator';
import { ClassManagement } from './ClassManagement';
import { UserManagement } from './UserManagement';
import { InteractiveClass } from './InteractiveClass';
import { Login } from './Login';
import { User, UserRole, ClassSession } from '../types';
import { Menu } from 'lucide-react';
import { MOCK_CLASSES } from '../constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Live Session State
  const [activeSession, setActiveSession] = useState<{cls: ClassSession, topic: string} | null>(null);

  // Check LocalStorage on Mount
  useEffect(() => {
    const storedUser = localStorage.getItem('edu_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('edu_user');
      }
    }
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('edu_user', JSON.stringify(user));
    setActiveTab('dashboard'); // Reset tab on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edu_user');
    setActiveSession(null);
  };

  const handleStartSession = (cls: ClassSession, topic: string) => {
    setActiveSession({ cls, topic });
    setActiveTab('live-session');
  };

  const handleEndSession = () => {
    if (window.confirm("Apakah Anda yakin ingin mengakhiri sesi kelas ini?")) {
      setActiveSession(null);
      setActiveTab('classes');
    }
  };

  // Render Logic based on Role and Active Tab
  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          classes={MOCK_CLASSES} 
          currentUser={currentUser} 
          onNavigate={setActiveTab} 
        />;
      case 'curriculum':
        return (currentUser.role === UserRole.ADMIN) 
          ? <CurriculumGenerator onNavigate={setActiveTab} /> 
          : <div className="p-8 text-center text-slate-500">Akses Ditolak. Hubungi Operator untuk manajemen kurikulum.</div>;
      case 'materials':
        return <MaterialGenerator currentUser={currentUser} />;
      case 'classes':
        return (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER)
          ? <ClassManagement currentUser={currentUser} onStartSession={handleStartSession} />
          : <div className="p-8 text-center text-slate-500">Akses Ditolak</div>;
      case 'live-session':
        if (!activeSession) return <div className="p-8 text-center">Tidak ada sesi aktif. Silakan mulai dari menu Manajemen Kelas.</div>;
        return <InteractiveClass 
          sessionData={activeSession} 
          currentUser={currentUser} 
          onEndSession={handleEndSession}
        />;
      case 'users':
        return (currentUser.role === UserRole.ADMIN)
          ? <UserManagement />
          : <div className="p-8 text-center text-slate-500">Akses Ditolak</div>;
      default:
        return <Dashboard classes={MOCK_CLASSES} currentUser={currentUser} onNavigate={setActiveTab} />;
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Checking authentication...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
        onLogout={handleLogout}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white p-4 z-30 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg flex items-center gap-2">
           <span className="bg-blue-500 w-6 h-6 rounded flex items-center justify-center text-xs">D</span>
           DidacticBoard
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          aria-label="Buka Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 overflow-x-hidden min-w-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;