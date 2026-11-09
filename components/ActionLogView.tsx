// components/ActionLogView.tsx
'use client';

import React from 'react';
import { ActionLog, ActionStatus } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { History, CheckCircle2, AlertTriangle, XCircle, Info, Inbox } from 'lucide-react';

interface ActionLogViewProps {
  logs: ActionLog[];
  isLoading?: boolean;
}

export default function ActionLogView({ logs, isLoading = false }: ActionLogViewProps) {
  const getActionIcon = (status: ActionStatus) => {
    switch (status) {
      case 'Success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'Error':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'Info':
      default:
        return <Info className="w-4 h-4 text-[#0070BA]" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Action & Audit Log</h3>
            <p className="text-xs text-slate-500">History of automated and manual system operations</p>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-400">Real-Time Trace</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Activity Logs Available"
          description="System events, approvals, reminders, and payment updates will be recorded here as they occur."
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                {getActionIcon(log.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{log.actionName}</span>
                    <span className="text-xs font-medium text-slate-500">· {log.relatedEntity}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{log.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.description}</p>
              </div>

              <div className="shrink-0 self-center">
                <StatusBadge status={log.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}