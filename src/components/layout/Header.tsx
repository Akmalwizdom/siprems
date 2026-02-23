import { Settings, LogOut, Menu, Bell, Search, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../../features/notifications';
import { Button } from '../ui/button';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'A'
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/20 bg-white/40 px-4 backdrop-blur-md lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileSidebar}
          className="hover:bg-bronze-50 rounded-xl lg:hidden"
        >
          <Menu className="text-bronze-600 h-6 w-6" />
        </Button>

        <div className="group focus-within:ring-bronze-400/20 hidden w-80 items-center rounded-2xl border border-white/40 bg-slate-100/50 px-4 py-2 transition-all focus-within:ring-2 sm:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari fitur atau data..."
            className="ml-3 w-full border-none bg-transparent text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Simplified Notification Center integration */}
        <div className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white bg-white/60 shadow-sm transition-all hover:shadow-md">
          <NotificationCenter />
        </div>

        <div className="mx-2 hidden h-8 w-px bg-slate-200 md:block"></div>

        <div className="relative" ref={dropdownRef}>
          <div
            className="group flex cursor-pointer items-center gap-3 rounded-2xl p-1 pr-2 transition-all hover:bg-white/60"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="hidden text-right md:block">
              <p className="text-xs leading-none font-black text-slate-900">
                {user?.displayName || 'Administrator'}
              </p>
              <p className="text-bronze-600 mt-1 text-[10px] font-bold tracking-tighter uppercase">
                Owner & CEO
              </p>
            </div>

            <div className="bronze-gradient shadow-bronze-200/50 relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl font-bold text-white shadow-lg transition-transform group-hover:scale-105">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{getInitials(user?.displayName || 'Admin')}</span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {isOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-3 w-64 rounded-3xl border border-slate-100 bg-white py-3 shadow-2xl duration-200">
              <div className="mb-2 border-b border-slate-50 px-5 py-3">
                <p className="text-sm font-black text-slate-900">{user?.displayName || 'Admin'}</p>
                <p className="truncate text-xs text-slate-400">{user?.email}</p>
              </div>

              <Link
                to="/settings"
                className="hover:bg-bronze-50 hover:text-bronze-700 flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span>Pengaturan Akun</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar Sesi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
