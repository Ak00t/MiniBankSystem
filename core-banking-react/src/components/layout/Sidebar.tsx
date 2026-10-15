import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Landmark,
  CreditCard,
  Building2,
  ArrowDownCircle,
  ShieldAlert,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navSection = (title: string, items: Array<{ to: string; label: string; icon: any; badge?: string }>) => (
    <div className="mb-6">
      <div className="px-4 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B192C] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between h-18 px-5 border-b border-slate-800/70 bg-[#071324]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-950">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wider text-white">MINIBANK CBS</div>
              <div className="text-[10px] font-medium text-blue-300 tracking-wide">GROUP 2 STAFF PORTAL</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 custom-scroll">
          {navSection('Core Overview', [
            { to: '/dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
          ])}

          {navSection('Customer Management', [
            { to: '/customers', label: 'All Customers', icon: Users },
            { to: '/customers/new', label: 'Register Customer', icon: UserPlus, badge: 'New' },
          ])}

          {navSection('Account Services', [
            { to: '/accounts', label: 'Account Directory', icon: CreditCard },
            { to: '/accounts/new', label: 'Open Retail Account', icon: CreditCard },
            { to: '/accounts/corporate/new', label: 'Corporate Joint Account', icon: Building2 },
            { to: '/accounts/deposit', label: 'Counter Cash Deposit', icon: ArrowDownCircle },
            { to: '/accounts/status', label: 'Account Status Update', icon: ShieldAlert },
          ])}
        </div>

        {/* Staff User Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#071324]/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                {(user?.username || 'ST').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {user?.fullName || user?.username || 'Bank Officer'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Staff Online
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/50 pt-2">
            Spring Boot Backend: <span className="text-blue-400 font-mono">localhost:8080</span>
          </div>
        </div>
      </aside>
    </>
  );
};
