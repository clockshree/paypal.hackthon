// components/Sidebar.tsx
'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BotMessageSquare, 
  CheckCircle2, 
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'assistant', label: 'AI Assistant', icon: BotMessageSquare },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#003087] via-[#005ea6] to-[#0070BA] flex items-center justify-center shadow-sm shadow-[#003087]/20 text-white font-black text-xl tracking-tighter">
              P<span className="text-[#00CFE8]">P</span>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-[#003087] block leading-none">
                PayPal <span className="text-[#0070BA] text-xs font-bold tracking-normal uppercase bg-blue-50 px-1.5 py-0.5 rounded">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">
                Settlement Hub
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 flex-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Core Workflows
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0070BA]/10 text-[#0070BA] font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#0070BA]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security & Verification Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0070BA]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">PCI-DSS L1 Guard</p>
              <p className="text-[10px] text-slate-500 truncate">Sandbox Node Active</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}