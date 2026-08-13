import { Search, Bell, RefreshCcw } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

interface TopbarProps {
  title: string;
  subtitle: string;
  onNavigate?: (page: PageId) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Topbar({ title, subtitle, onNavigate, onRefresh, isLoading, searchQuery = '', onSearchChange }: TopbarProps) {
  return (
    <header className="h-16 border-b border-neutral-200 bg-white sticky top-0 z-10 flex items-center justify-between px-8">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-neutral-400 font-medium">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
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
    </header>
  );
}
