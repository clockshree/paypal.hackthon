// components/EmptyState.tsx
'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0070BA] hover:text-[#0070BA] text-xs font-semibold text-slate-700 transition shadow-2xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}