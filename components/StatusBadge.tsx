// components/StatusBadge.tsx
'use client';

import React from 'react';
import { InvoiceStatus, ApprovalStatus, ReminderStatus, ActionStatus } from '@/data/mockData';
import { Loader2 } from 'lucide-react';

type AnyStatus = InvoiceStatus | ApprovalStatus | ReminderStatus | ActionStatus;

interface StatusBadgeProps {
  status: AnyStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Paid':
    case 'Approved':
    case 'Success':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          {status}
        </span>
      );

    case 'Pending':
    case 'Awaiting Approval':
    case 'Upcoming':
    case 'Warning':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          {status === 'Awaiting Approval' ? 'Awaiting Approval' : status}
        </span>
      );

    case 'Processing':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0070BA] border border-blue-200">
          <Loader2 className="w-3 h-3 animate-spin mr-1.5 text-[#0070BA]" />
          Processing
        </span>
      );

    case 'Sent':
    case 'Info':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0070BA] border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0070BA] mr-1.5" />
          {status}
        </span>
      );

    case 'Rejected':
    case 'Failed':
    case 'Overdue':
    case 'Error':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          {status}
        </span>
      );

    case 'Dismissed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Dismissed
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}