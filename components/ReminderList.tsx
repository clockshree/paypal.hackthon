// components/ReminderList.tsx
'use client';

import React from 'react';
import { Reminder } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Bell, Clock, Calendar, Check, Send, Inbox } from 'lucide-react';

interface ReminderListProps {
  reminders: Reminder[];
  isLoading?: boolean;
  onDismiss: (id: string) => void;
}

export default function ReminderList({
  reminders,
  isLoading = false,
  onDismiss,
}: ReminderListProps) {
  const activeReminders = reminders.filter((r) => r.status !== 'Dismissed');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0070BA]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Automated Reminders</h3>
              <p className="text-xs text-slate-500">Scheduled PayPal settlement notices</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#0070BA] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {activeReminders.length} Active
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : activeReminders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No Pending Reminders"
            description="All payment notifications are up to date. You will see scheduled automated payment notices here."
          />
        ) : (
          <div className="space-y-3">
            {activeReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all bg-slate-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">{rem.clientName}</span>
                    <span className="font-mono text-[10px] text-slate-400">({rem.invoiceId})</span>
                    <StatusBadge status={rem.status} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rem.message}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#0070BA]" /> {rem.scheduledTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Due: {rem.dueDate}
                    </span>
                    <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {rem.channel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onDismiss(rem.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}