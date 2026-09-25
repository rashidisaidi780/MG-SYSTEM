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
}

export default function Topbar({ title, subtitle, onNavigate, onRefresh, isLoading, searchQuery = '', onSearchChange, isDarkMode, onToggleDarkMode, onOpenMenu }: TopbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMenu} className="rounded-lg p-2 hover:bg-neutral-100 md:hidden" aria-label="Open navigation">
          <Menu size={21} />
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
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Refresh page"
        >
          <RefreshCcw
            size={18}
            className={`text-neutral-600 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
        <button
          onClick={() => onNavigate?.('notifications')}
          className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Open notifications"
        >
          <Bell size={18} className="text-neutral-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black" />
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
