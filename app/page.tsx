// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardStats from '@/components/DashboardStats';
import InvoiceTable from '@/components/InvoiceTable';
import ChatPanel from '@/components/ChatPanel';
import ApprovalCard from '@/components/ApprovalCard';
import ReminderList from '@/components/ReminderList';
import ActionLogView from '@/components/ActionLogView';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { Invoice, ApprovalRequest, Reminder, ActionLog, INITIAL_CHAT_MESSAGES } from '@/data/mockData';
import { getInvoices, getApprovals, submitApprovalDecision, getReminders, getActionLogs } from '@/services/api';
import { Inbox } from 'lucide-react';

export default function DashboardPage() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card currently being processed
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load all dashboard sections
  const loadDashboardData = async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const [fetchedInvoices, fetchedApprovals, fetchedReminders, fetchedLogs] = await Promise.all([
        getInvoices(),
        getApprovals(),
        getReminders(),
        getActionLogs(),
      ]);
      setInvoices(fetchedInvoices);
      setApprovals(fetchedApprovals);
      setReminders(fetchedReminders);
      setActionLogs(fetchedLogs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not synchronize data with backend.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Approve button
  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const result = await submitApprovalDecision(id, 'approve');
      if (result.success) {
        setApprovals((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: 'Approved' } : app))
        );

        const targetApproval = approvals.find((a) => a.id === id);
        if (targetApproval) {
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.id === targetApproval.invoiceId ? { ...inv, status: 'Pending' } : inv
            )
          );

          // Append to Action Log locally
          const newLog: ActionLog = {
            id: `LOG-${Date.now()}`,
            actionName: 'Approval Approved',
            relatedEntity: `${targetApproval.invoiceId} (${targetApproval.clientName})`,
            timestamp: 'Just now',
            status: 'Success',
            description: `Manual approval granted for $${targetApproval.amount.toLocaleString()}. Invoice queued for settlement.`,
          };
          setActionLogs((prev) => [newLog, ...prev]);
        }
      }
    } catch (err: unknown) {
      alert(`Approval failed: ${err instanceof Error ? err.message : 'API failure'}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject button
  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const result = await submitApprovalDecision(id, 'reject');
      if (result.success) {
        setApprovals((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: 'Rejected' } : app))
        );

        const targetApproval = approvals.find((a) => a.id === id);
        if (targetApproval) {
          const newLog: ActionLog = {
            id: `LOG-${Date.now()}`,
            actionName: 'Approval Rejected',
            relatedEntity: `${targetApproval.invoiceId} (${targetApproval.clientName})`,
            timestamp: 'Just now',
            status: 'Error',
            description: `Manual approval rejected for $${targetApproval.amount.toLocaleString()}. Reason flagged for compliance review.`,
          };
          setActionLogs((prev) => [newLog, ...prev]);
        }
      }
    } catch (err: unknown) {
      alert(`Rejection failed: ${err instanceof Error ? err.message : 'API failure'}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Dismiss Reminder
  const handleDismissReminder = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    setReminders((prev) =>
      prev.map((rem) => (rem.id === id ? { ...rem, status: 'Dismissed' } : rem))
    );

    if (target) {
      const newLog: ActionLog = {
        id: `LOG-${Date.now()}`,
        actionName: 'Reminder Dismissed',
        relatedEntity: `${target.invoiceId} (${target.clientName})`,
        timestamp: 'Just now',
        status: 'Info',
        description: `Scheduled reminder notice for ${target.clientName} was manually acknowledged and dismissed.`,
      };
      setActionLogs((prev) => [newLog, ...prev]);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 1. Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Header */}
        <Header />

        {/* 3. Dashboard Body */}
        <main className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Main Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Enterprise Settlement Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time automated transaction risk evaluation and AI invoicing workflows.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected to PayPal Sandbox Rail
              </span>
            </div>
          </div>

          {/* Error Banner with Retry */}
          {errorMessage && (
            <ErrorState
              title="Dashboard Synchronization Issue"
              message={errorMessage}
              onRetry={() => loadDashboardData(true)}
              isRetrying={isRetrying}
            />
          )}

          {/* Metric Cards */}
          <DashboardStats invoices={invoices} />

          {/* AI Workflow Grid: Approvals, Reminders & AI Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Center Column (2 Cols on lg) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Approvals Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">High-Priority Approvals</h2>
                    <p className="text-xs text-slate-500">
                      Flagged by PayPal AI Settlement Model for review
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0070BA]">
                    {approvals.filter((a) => a.status === 'Pending').length} Pending Review
                  </span>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4"
                      >
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-16 bg-slate-100 rounded-xl"></div>
                        <div className="h-8 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : approvals.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No Pending Approvals"
                    description="All transaction batches have been processed and approved. Check back when new high-variance invoices arrive."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvals.map((req) => (
                      <ApprovalCard
                        key={req.id}
                        request={req}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isProcessing={processingId === req.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Reminders Component */}
              <ReminderList
                reminders={reminders}
                isLoading={isLoading}
                onDismiss={handleDismissReminder}
              />

              {/* Invoices Table */}
              <InvoiceTable invoices={invoices} isLoading={isLoading} />

              {/* Action Log View */}
              <ActionLogView logs={actionLogs} isLoading={isLoading} />
            </div>

            {/* Right Column: AI Assistant */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-bold text-slate-800 mb-4">AI Copilot</h2>
              <ChatPanel initialMessages={INITIAL_CHAT_MESSAGES} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}