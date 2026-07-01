/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Complaint, UserRole } from '../types';
import { Send, Sparkles, MessageSquare, Bot, ArrowRight, CornerDownLeft } from 'lucide-react';

interface AIChatbotProps {
  complaints: Complaint[];
  userRole: UserRole;
  userWard: string;
}

export default function AIChatbot({ complaints, userRole, userWard }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `Hello! I am the Civic Intelligence AI Assistant. I can analyze active complaints, suggest ward-level budget allocations, summarize department speeds, or answer questions about municipal priority scores. Try clicking a quick template suggestion below or type your own question!`,
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Quick suggestions list
  const suggestions = [
    "Suggest budget splits for Ward 1",
    "How does the AI calculate severity and priority?",
    "Why are road complaints prioritized?",
    "Which departments are currently slow?",
  ];

  // Auto scroll down on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            role: userRole,
            ward: userWard,
            current_complaints: complaints,
          },
        }),
      });

      const data = await response.json();
      
      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: data.text || "I apologize, I'm experiencing technical difficulties linking with the LLM service. Please try again.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (e) {
      console.error("Chat failure:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'model',
          text: "I encountered an error connecting to the backend. Please check your network connection and try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="ai-chat-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[520px]">
      {/* Header */}
      <div id="chat-header" className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
            <Bot className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center gap-1">
              <span>Civic Copilot AI</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">Active</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Dual Mode: Heuristic + Gemini 3.5 Flash</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <MessageSquare className="w-4 h-4" />
          <span className="font-semibold text-[10px] font-mono">ROLE: {userRole}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div id="chat-messages-viewport" ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/20">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? 'U' : <Bot className="w-4 h-4" />}
              </div>

              {/* Text Bubble */}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 border border-slate-150 rounded-tl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isSending && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-150 rounded-tl-none shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-slate-400 font-medium ml-1">AI Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions Shelf */}
      <div id="quick-suggestions-shelf" className="p-2.5 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto select-none no-scrollbar">
        {suggestions.map((s, idx) => (
          <button
            key={`sug-${idx}`}
            onClick={() => handleSendMessage(s)}
            className="shrink-0 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 py-1 px-2.5 rounded-full transition shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>{s}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        id="chatbot-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 border-t border-slate-100 bg-white rounded-b-2xl flex items-center gap-2"
      >
        <input
          id="chat-user-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question about your local ward complaints..."
          className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
        />
        <button
          id="chat-send-msg-btn"
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
