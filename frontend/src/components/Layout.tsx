import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, LayoutDashboard, Users, Calendar, 
  LogOut, User as UserIcon, Menu, X, Sun, Moon 
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const activeStyle = "flex items-center gap-3 px-4 py-3 bg-medical-50 text-medical-700 dark:bg-medical-950/30 dark:text-medical-400 rounded-xl font-medium transition-all duration-200";
  const inactiveStyle = "flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition-all duration-200";

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card shadow-sm z-30">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-medical-600 flex items-center justify-center text-white">
            <Stethoscope size={18} />
          </div>
          <span className="font-bold text-lg">DocTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 border-r border-border bg-card p-5 z-40 transform transition-transform duration-300 md:translate-x-0 md:static md:flex md:flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
          <div className="h-10 w-10 rounded-xl bg-medical-600 flex items-center justify-center text-white shadow-md shadow-medical-500/20">
            <Stethoscope size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">DocTrack</h1>
            <span className="text-xs text-muted-foreground">Clinic Manager</span>
          </div>
        </div>

        {/* Doctor Info Card */}
        <div className="p-4 rounded-xl bg-secondary/60 border border-border/30 flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-medical-100 dark:bg-medical-900/40 text-medical-700 dark:text-medical-300 flex items-center justify-center font-bold text-sm">
            <UserIcon size={18} />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-semibold text-sm leading-tight truncate">
              Dr. {user?.first_name || user?.username} {user?.last_name || ''}
            </h2>
            <span className="text-xs text-muted-foreground truncate block">{user?.email || 'General Practitioner'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            onClick={() => setIsSidebarOpen(false)}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/patients" 
            className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Users size={18} />
            <span>Patients</span>
          </NavLink>

          <NavLink 
            to="/appointments" 
            className={({ isActive }) => isActive ? activeStyle : inactiveStyle}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Calendar size={18} />
            <span>Appointments</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer / Controls */}
        <div className="pt-4 border-t border-border mt-auto space-y-2">
          <button 
            onClick={toggleTheme}
            className="hidden md:flex w-full items-center gap-3 px-4 py-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl transition-all duration-200 text-sm font-medium"
          >
            {isDark ? (
              <>
                <Sun size={18} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[100vh] mt-0">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
