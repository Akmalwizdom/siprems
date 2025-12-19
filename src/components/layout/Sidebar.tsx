import { NavLink } from 'react-router';
import { LayoutDashboard, ShoppingCart, Package, Brain, Settings, Calendar, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { useRole, UserRole } from '../../context/AuthContext';

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
  allowedRoles?: UserRole[]; // If not specified, all roles can access
  badge?: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transaction', icon: ShoppingCart, label: 'Transaksi' },
  { path: '/products', icon: Package, label: 'Produk' },
  { path: '/calendar', icon: Calendar, label: 'Kalender' },
  { path: '/prediction', icon: Brain, label: 'Prediksi Cerdas', allowedRoles: ['admin'] },
  { path: '/users', icon: Users, label: 'Kelola Pengguna', allowedRoles: ['admin'], badge: 'Admin' },
  { path: '/settings', icon: Settings, label: 'Pengaturan' },
];

export function Sidebar({ isCollapsed, isMobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const { role } = useRole();
  return (
    <>
      <style>{`
        /* Critical CSS for Sidebar Layout & Styles */
        
        /* Layout Structure */
        .sidebar-root {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 256px; /* w-64 */
          background-color: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: transform 0.3s ease-in-out, width 0.3s ease-in-out;
          transform: translateX(-100%);
        }

        .sidebar-root.mobile-open {
          transform: translateX(0);
        }

        /* Navigation Styles - Strict Override */
        .nav-item-active {
           background-color: #4f46e5 !important; /* bg-indigo-600 */
           color: white !important;
        }

        .nav-item-active:hover {
           background-color: #4338ca !important; /* bg-indigo-700 */
        }
        
        .nav-item-inactive {
           color: #475569 !important; /* text-slate-600 */
           background-color: transparent;
        }

        .nav-item-inactive:hover {
           background-color: #f1f5f9 !important; /* bg-slate-100 */
           color: #1e293b !important; /* text-slate-800 */
        }

        /* Desktop Styles (LG Breakpoint) */
        @media (min-width: 1024px) {
          .sidebar-root {
            position: static !important;
            transform: none !important;
            height: 100% !important;
            z-index: auto !important;
            width: 256px;
          }

          .sidebar-root.collapsed {
            width: 80px !important; /* w-20 */
          }

          /* Hide close button on desktop */
          .mobile-close-button {
            display: none !important;
          }

          /* Visibility helpers */
          .lg-hide-when-collapsed {
            opacity: 1;
            width: auto;
            transition: opacity 0.2s;
          }
          
          .sidebar-root.collapsed .lg-hide-when-collapsed {
            display: none;
            opacity: 0;
            width: 0;
          }

          /* Alignment helpers */
          .sidebar-root.collapsed .lg-center-when-collapsed {
            justify-content: center;
            width: 100%;
          }
          
          .sidebar-root.collapsed .lg-no-margin-when-collapsed {
            margin: 0;
          }
        }
      `}</style>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar-root flex-shrink-0 ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between h-16 flex-shrink-0">
          <div className="flex items-center gap-3 lg-center-when-collapsed">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="overflow-hidden lg-hide-when-collapsed">
              <h1 className="text-slate-900 font-semibold text-sm whitespace-nowrap">SIPREMS</h1>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">Smart POS System</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onCloseMobile}
            className="mobile-close-button p-2 text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', overflowY: 'auto' }}>
          {navItems
            .filter(item => !item.allowedRoles || item.allowedRoles.includes(role))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap lg-center-when-collapsed ${
                      isActive
                        ? 'nav-item-active'
                        : 'nav-item-inactive'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  {() => (
                    <>
                      <Icon className={`w-5 h-5 flex-shrink-0`} />
                      <span className="lg-hide-when-collapsed flex items-center gap-2">
                        {item.label}
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden lg:flex p-3 border-t border-gray-200">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Upgrade Card */}
        <div className="p-4 border-t border-gray-200 lg-hide-when-collapsed">
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="text-white mb-3">
              <h3 className="font-semibold text-sm">Upgrade Pro</h3>
              <p className="text-xs text-slate-400 mt-1">
                Akses semua fitur
              </p>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs h-9">
              Upgrade
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}