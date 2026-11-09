// components/ApprovalCard.tsx
'use client';

import React from 'react';
import { ApprovalRequest } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Check, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface ApprovalCardProps {
  request: ApprovalRequest;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string) => Promise<void> | void;
  isProcessing?: boolean;
}

export default function ApprovalCard({
  request,
  onApprove,
  onReject,
  isProcessing = false,
}: ApprovalCardProps) {
  const isPending = request.status === 'Pending';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-2">
          <div>
            <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
              {request.invoiceId}
            </span>
            <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-snug">
              {request.clientName}
            </h3>
          </div>
          <div className="shrink-0">
            <StatusBadge status={request.status} />
          </div>
        </div>

        {/* Amount & Date */}
        <div className="mt-4 flex items-baseline justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Requested</p>
            <p className="text-xl font-black text-[#003087] mt-0.5">
              ${request.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted On</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{request.submissionDate}</p>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="mt-4 bg-[#F5F9FD] border border-blue-100/80 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0070BA] mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0070BA] shrink-0" />
            <span>AI Risk Assessment</span>
            {request.riskScore === 'Medium' && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                <AlertCircle className="w-3 h-3" /> Medium Risk (+38% Variance)
              </span>
            )}
            {request.riskScore === 'Low' && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                Verified Match
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{request.aiSummary}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2.5">
        {isPending ? (
          <>
            <button
              onClick={() => onApprove(request.id)}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0070BA] hover:bg-[#003087] active:scale-[0.99] disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Approve</span>
                </>
              )}
            </button>

            <button
              onClick={() => onReject(request.id)}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-bold transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <>
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Reject</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="w-full text-center py-1 text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
            Decision logged: <span className="text-slate-800 font-bold">{request.status}</span>
          </div>
        )}
      </div>
    </div>
  );
}