'use client';

import React, { useState } from 'react';
import { ChatMessage } from '@/data/mockData';
import { Bot, Send, User, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  initialMessages: ChatMessage[];
}

export default function ChatPanel({ initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    'Summarize pending invoices',
    'Which invoices need approval?',
    'Show overdue payments',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // Generate responsive mock reply based on text content
    setTimeout(() => {
      let reply = "I have processed your query against our PayPal automated settlement ledger. Everything is in sync.";
      const lower = text.toLowerCase();

      if (lower.includes('approval')) {
        reply = "You have 2 pending approvals requiring manual review: INV-2026-004 ($5,600) and INV-2026-006 ($11,200).";
      } else if (lower.includes('overdue')) {
        reply = "Overdue alert: 2 invoices are past due (INV-2026-003 for $22,400 and INV-2026-007 for $7,850). Automated payment reminders have been queued.";
      } else if (lower.includes('summarize') || lower.includes('pending')) {
        reply = "Summary: There are 7 total invoices. $48,650 is settled/paid, $13,920.50 is active pending, and $30,250 is overdue.";
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
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
            <h3 className="text-sm font-bold text-slate-800">PayPal AI Assistant</h3>
            <p className="text-[11px] text-emerald-600 font-medium">● Online | Instant Insights</p>
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
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#0070BA] text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
              }`}
            >
              <p>{msg.text}</p>
              <span
                className={`text-[9px] block text-right mt-1 ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/50">
        {suggestions.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] font-medium bg-white border border-slate-200 hover:border-[#0070BA] hover:text-[#0070BA] text-slate-600 px-2.5 py-1 rounded-full transition shadow-2xs"
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
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/20 focus:border-[#0070BA]"
        />
        <button
          onClick={() => handleSendMessage()}
          aria-label="Send Message"
          className="p-2 rounded-xl bg-[#0070BA] hover:bg-[#003087] text-white transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}