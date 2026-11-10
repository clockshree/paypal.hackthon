
'use client';

import React, { useState } from 'react';
import { ChatMessage, ActionLog } from '@/data/mockData';
import { Bot, Send, User, CheckCircle, XCircle } from 'lucide-react';

interface ChatPanelProps {
  initialMessages: ChatMessage[];
  onActionCompleted: (log: ActionLog) => void;
}

interface ChatApiResponse {
  status: 'ready' | 'needs_info' | 'invalid';
  reply: string;
  draft?: {
    clientName: string;
    clientEmail: string;
    description: string;
    amount: number;
    dueInDays: number;
  };
  missing?: string[];
  errors?: string[];
  actionId?: string;
}

export default function ChatPanel({ initialMessages, onActionCompleted }: ChatPanelProps) {
  const [pendingDraft, setPendingDraft] = useState<ChatApiResponse['draft']>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Stores the invoice action awaiting approval
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const suggestions = [
    'Summarize pending invoices',
    'Which invoices need approval?',
    'Show overdue payments',
  ];

  const addAiMessage = (text: string) => {
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;

    if (!text.trim() || loading || decisionLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);
    setPendingActionId(null);
    setPendingDraft(undefined);

    try {
      const response = await fetch('/api/paypilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data: ChatApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.reply || 'Something went wrong with the AI request.');
      }

      let reply = data.reply || 'The AI has processed your request.';

      if (data.draft) {
        reply += `

Invoice Draft:

Client: ${data.draft.clientName}
Email: ${data.draft.clientEmail}
Description: ${data.draft.description}
Amount: $${data.draft.amount}
Due in: ${data.draft.dueInDays} days`;
      }

      if (data.missing?.length) {
        reply += `

Missing information: ${data.missing.join(', ')}`;
      }

      if (data.errors?.length) {
        reply += `

Please check: ${data.errors.join(', ')}`;
      }

      addAiMessage(reply);

      if (data.status === 'ready' && data.actionId) {
       setPendingActionId(data.actionId);
       setPendingDraft(data.draft);
       }
 
    } catch (error) {
      addAiMessage(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Unable to connect to the AI backend. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Approve or reject the pending invoice
  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!pendingActionId || decisionLoading) return;

    setDecisionLoading(true);

    try {
      const response = await fetch(
        `/api/paypilot/actions/${pendingActionId}/${decision}`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Unable to process decision.');
      }

      const resultMessage =
        result.execution?.message ||
        (decision === 'approve'
          ? 'Invoice approved successfully.'
          : 'Invoice rejected successfully.');

      addAiMessage(
  decision === 'approve'
    ? `Approval successful!\n\n${resultMessage}`
    : `Invoice rejected.\n\n${resultMessage}`
);

// Send the completed action to the dashboard audit log
const newLog: ActionLog = {
  id: `LOG-${Date.now()}`,
  actionName: decision === 'approve'
    ? 'AI Invoice Approved'
    : 'AI Invoice Rejected',
  relatedEntity: pendingDraft
    ? `${pendingDraft.clientName} ($${pendingDraft.amount.toLocaleString()})`
    : 'AI-generated invoice',
  timestamp: new Date().toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
  status: decision === 'approve' ? 'Success' : 'Warning',
  description: decision === 'approve'
    ? `Invoice approved through the Gemini AI Assistant. ${resultMessage}`
    : 'Invoice rejected through the Gemini AI Assistant.',
};

onActionCompleted(newLog);

setPendingActionId(null);
setPendingDraft(undefined);

    } catch (error) {
      addAiMessage(
        error instanceof Error
          ? `Decision failed: ${error.message}`
          : 'Unable to process your decision. Please try again.'
      );
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[580px]">

      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0070BA]/10 text-[#0070BA] flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              PayPal AI Assistant
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium">
              ● Online | Gemini AI
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'bg-[#0070BA] text-white'
              }`}
            >
              {msg.sender === 'user'
                ? <User className="w-4 h-4" />
                : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-[#0070BA] text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
              }`}
            >
              <p>{msg.text}</p>
              <span
                className={`text-[9px] block text-right mt-1 ${
                  msg.sender === 'user'
                    ? 'text-blue-100'
                    : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Bot className="w-5 h-5 text-[#0070BA]" />
            Gemini is thinking...
          </div>
        )}
      </div>

      {/* Approval and Rejection Buttons */}
      {pendingActionId && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Review this invoice before proceeding:
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => handleDecision('approve')}
              disabled={decisionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {decisionLoading ? 'Processing...' : 'Approve'}
            </button>

            <button
              onClick={() => handleDecision('reject')}
              disabled={decisionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/50">
        {suggestions.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading || decisionLoading}
            className="text-[11px] font-medium bg-white border border-slate-200 hover:border-[#0070BA] hover:text-[#0070BA] text-slate-600 px-2.5 py-1 rounded-full transition shadow-2xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask AI about invoices or payment workflows..."
          disabled={loading || decisionLoading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/20 focus:border-[#0070BA]"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || decisionLoading || !inputValue.trim()}
          aria-label="Send Message"
          className="p-2 rounded-xl bg-[#0070BA] hover:bg-[#003087] text-white transition shadow-sm disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}