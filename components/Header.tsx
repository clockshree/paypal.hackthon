// components/Header.tsx
'use client';

import React from 'react';
import { Bell, Search, ChevronDown, Sparkles, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Mobile Hamburger + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          type="button"
          aria-label="Open Navigation Menu"
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden border border-slate-200/80"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search transactions, invoices, or clients..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/20 focus:border-[#0070BA] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        <div className="hidden sm:inline-flex items-center gap-1.5 bg-[#0070BA]/10 border border-[#0070BA]/20 px-3 py-1 rounded-full text-[11px] font-bold text-[#0070BA]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Hackathon Demo Active</span>
        </div>

        <button 
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0070BA] rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            PP
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-slate-800 group-hover:text-[#0070BA] transition leading-tight">
              Finance Ops Team
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">team@hackathon.dev</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition hidden md:block" />
        </div>
      </div>
    </header>
  );
}