import React from 'react';
import { LayoutDashboard, BookOpen, Users, CalendarDays, FileText, GraduationCap, X, LogOut } from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, isMobileOpen, closeMobileMenu, onLogout }) => {
  
  // Define all possible menu items
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
    // Only Admin can create/manage Curriculum
    { id: 'curriculum', label: 'Kurikulum', icon: CalendarDays, roles: [UserRole.ADMIN] },
    { id: 'materials', label: 'Materi & AI', icon: BookOpen, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
    { id: 'classes', label: 'Manajemen Kelas', icon: GraduationCap, roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { id: 'users', label: 'User Manajemen', icon: Users, roles: [UserRole.ADMIN] },
  ];

  // Filter items based on current user role
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out shadow-xl
        md:static md:translate-x-0 md:shadow-none md:flex md:flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center">D</span>
            DidacticBoard
          </h1>
          <button onClick={closeMobileMenu} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex items-center gap-3 border-b border-slate-700 bg-slate-800/50">
          <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover" />
          <div className="overflow-hidden">
            <p className="font-medium text-sm text-slate-100 truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  closeMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
          
          <div className="bg-slate-800 rounded-lg p-4 text-xs text-slate-400">
            <p>Versi 1.1.0</p>
            <p>© 2025 EduAI Corp</p>
          </div>
        </div>
      </aside>
    </>
  );
};