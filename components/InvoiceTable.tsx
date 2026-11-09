// components/InvoiceTable.tsx
'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Search, Eye, Filter, Inbox } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onViewInvoice?: (invoice: Invoice) => void;
}

export default function InvoiceTable({
  invoices,
  isLoading = false,
  onViewInvoice,
}: InvoiceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const statuses: ('All' | InvoiceStatus)[] = [
    'All',
    'Paid',
    'Pending',
    'Processing',
    'Overdue',
    'Awaiting Approval',
    'Failed',
  ];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header, Search & Filter Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Settlement Line Items
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full ledger view with search and reconciliation status filters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, client, email..."
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/20 focus:border-[#0070BA] transition"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by invoice status"
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-6">Invoice ID</th>
              <th className="py-3 px-6">Client / Counterparty</th>
              <th className="py-3 px-6">Gross Amount</th>
              <th className="py-3 px-6">Due Date</th>
              <th className="py-3 px-6">Settlement Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-36 mb-1.5"></div><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="py-4 px-6"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="py-4 px-6"><div className="h-5 bg-slate-200 rounded-full w-20"></div></td>
                  <td className="py-4 px-6 text-right"><div className="h-7 bg-slate-200 rounded w-14 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No invoices match your filter</p>
                    <p className="text-[11px] text-slate-400">Clear search terms or select "All" from the dropdown.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800 font-mono">
                    {inv.id}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{inv.clientName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{inv.clientEmail}</p>
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">
                    ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-medium">{inv.dueDate}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        if (onViewInvoice) onViewInvoice(inv);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-[#0070BA] hover:text-[#0070BA] text-[11px] font-bold text-slate-600 transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Statement Preview</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedInvoice.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close invoice details"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-bold transition"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Client / Org:</span>
                <span className="font-bold text-slate-800">{selectedInvoice.clientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Billing Email:</span>
                <span className="font-medium text-slate-700">{selectedInvoice.clientEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Issued Date:</span>
                <span className="font-medium text-slate-700">{selectedInvoice.issueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-medium text-slate-700">{selectedInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-black text-[#003087] text-sm">
                  ${selectedInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Current Status:</span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}