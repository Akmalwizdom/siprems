import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Brain,
  Settings,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { useRole, UserRole } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  allowedRoles?: UserRole[];
  badge?: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transaction', icon: ShoppingCart, label: 'Transaksi' },
  { path: '/products', icon: Package, label: 'Produk' },
  { path: '/calendar', icon: Calendar, label: 'Kalender' },
  { path: '/prediction', icon: Brain, label: 'Prediksi Cerdas', allowedRoles: ['admin'] },
  { path: '/users', icon: Users, label: 'Kelola Pengguna', allowedRoles: ['admin'] },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
];

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const { role } = useRole();
  const [storeLogo, setStoreLogo] = useState<string>('');

  useEffect(() => {
    const fetchStoreLogo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/store`);
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data?.logo_url) {
            setStoreLogo(result.data.logo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching store logo:', error);
      }
    };
    fetchStoreLogo();
  }, []);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} glass-card shadow-bronze-100/20 m-4 flex flex-col overflow-hidden rounded-3xl border-white/40 bg-white/40 shadow-xl backdrop-blur-md`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/20 p-4">
          <div
            className={`flex items-center gap-3 ${isCollapsed ? 'lg:w-full lg:justify-center' : ''}`}
          >
            {storeLogo ? (
              <img
                src={storeLogo}
                alt="Logo"
                className="h-10 w-10 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="bronze-gradient shadow-bronze-200/50 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
            {!isCollapsed && (
              <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                Siprems
              </h1>
            )}
          </div>
          <button
            onClick={onCloseMobile}
            className="hover:text-bronze-600 p-2 text-slate-500 transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-2 overflow-y-auto px-3 py-6">
          {navItems
            .filter((item) => !item.allowedRoles || item.allowedRoles.includes(role))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 ${
                    isActive
                      ? 'bronze-gradient shadow-bronze-200/30 scale-[1.02] text-white shadow-lg'
                      : 'hover:text-bronze-600 text-slate-500 hover:bg-white/60'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                )}
                {item.badge && !isCollapsed && (
                  <span className="bg-bronze-100 text-bronze-700 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>

        <div className="mt-auto border-t border-white/20 p-4">
          <button
            onClick={onToggleCollapse}
            className="hover:text-bronze-600 flex h-10 w-full items-center justify-center rounded-xl p-2 text-slate-400 transition-all hover:bg-white/60"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
