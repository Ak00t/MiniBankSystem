import React, { useState, useEffect } from 'react';
import { Menu, User, LogOut, Clock } from 'lucide-react';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Left section: Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right section: System status, Time, Profile, Logout */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Backend Status indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API 8080 Connected</span>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Quick action buttons */}
        <Link
          to="/customers/new"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
        >
          + New Customer
        </Link>
        <Link
          to="/accounts/new"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          + Open Account
        </Link>

        {/* User Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0B192C] text-white flex items-center justify-center text-xs font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {user?.fullName || user?.username || 'Bank Officer'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Core Teller</div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
