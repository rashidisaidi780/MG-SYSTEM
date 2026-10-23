import { Search, Bell, RefreshCcw, Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { PageId } from '@/components/Sidebar';

interface TopbarProps {
  title: string;
  subtitle: string;
  onNavigate?: (page: PageId) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMenu: () => void;
  sidebarOpen: boolean;
  unreadNotificationCount: number;
}

export default function Topbar({ title, subtitle, onNavigate, onRefresh, isLoading, searchQuery = '', onSearchChange, isDarkMode, onToggleDarkMode, onOpenMenu, sidebarOpen, unreadNotificationCount }: TopbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMenu} className="rounded-lg p-2 hover:bg-neutral-100" aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
          {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">{title}</h1>
          <p className="truncate text-xs font-medium text-neutral-400">{subtitle}</p>
        </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 w-72">
          <Search size={16} className="text-neutral-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search anything..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-neutral-400"
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileSearchOpen((current) => !current)}
          className="rounded-lg p-2 hover:bg-neutral-100 md:hidden"
          aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
          title={mobileSearchOpen ? 'Close search' : 'Search'}
        >
          {mobileSearchOpen ? <X size={19} /> : <Search size={19} />}
        </button>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} className="text-neutral-600" />}
        </button>
        <button
          type="button"
          onClick={() => (onRefresh ? onRefresh() : window.location.reload())}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors disabled:cursor-wait disabled:opacity-60"
          aria-label="Refresh page"
          title={isLoading ? 'Waiting for page data to load' : 'Refresh page data'}
        >
          <RefreshCcw
            size={18}
            className={`text-neutral-600 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('notifications')}
          className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label={unreadNotificationCount > 0 ? `Open notifications, ${unreadNotificationCount} unread` : 'Open notifications'}
          title={unreadNotificationCount > 0 ? `${unreadNotificationCount} unread notifications` : 'Notifications'}
        >
          <Bell size={18} className="text-neutral-600" />
          {unreadNotificationCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white">
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
            </span>
          ) : null}
        </button>
        </div>
      </div>
      {mobileSearchOpen ? (
        <div className="border-t border-neutral-100 px-4 pb-3 pt-2 md:hidden">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <Search size={16} className="shrink-0 text-neutral-400" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
