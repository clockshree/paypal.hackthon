// components/DashboardStats.tsx
'use client';

import React from 'react';
import { Invoice } from '@/data/mockData';
import { FileText, Clock, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  invoices: Invoice[];
}

export default function DashboardStats({ invoices }: DashboardStatsProps) {
  const totalInvoices = invoices.length;
  const pendingApprovals = invoices.filter(
    (inv) => inv.status === 'Awaiting Approval' || inv.status === 'Pending' || inv.status === 'Processing'
  ).length;
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid').length;
  const totalAmount = invoices.reduce((acc, inv) => acc + inv.amount, 0);

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      subtext: 'Across all active ledgers',
      icon: FileText,
      iconBg: 'bg-blue-50 text-[#0070BA] border-blue-100',
    },
    {
      title: 'Pending Review',
      value: pendingApprovals.toString(),
      subtext: 'Awaiting human decision',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      title: 'Settled & Paid',
      value: paidInvoices.toString(),
      subtext: 'Reconciled via PayPal Rail',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Total Volume',
      value: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtext: 'Gross transaction value',
      icon: DollarSign,
      iconBg: 'bg-indigo-50 text-[#003087] border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl border ${stat.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                {stat.value}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-[#0070BA] shrink-0" />
                <span className="truncate">{stat.subtext}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}