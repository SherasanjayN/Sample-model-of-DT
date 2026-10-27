import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../utils/translations';
import { api } from '../api';
import { Message } from '../types';
import { Send, MessageSquare, ShieldCheck, UserCheck, User as UserIcon, RefreshCw } from 'lucide-react';

interface GroupChatProps {
  groupId: string;
  groupName?: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false) => {
    if (!groupId) return;
    try {
      if (!silent) setLoading(true);
      const data = await api.getMessages(groupId);
      setMessages(data.messages || []);
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load messages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(false);

    // Near real-time polling every 2.5 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      setSending(true);
      const newMsg = await api.sendMessage(groupId, textToSend);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      setInputText(textToSend); // restore on fail
    } finally {
      setSending(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold border border-amber-300">
            <ShieldCheck className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
            {t.roleSuperAdmin}
          </span>
        );
      case 'GROUP_ADMIN':
        return (
          <span className="inline-flex items-center text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold border border-emerald-300">
            <UserCheck className="w-2.5 h-2.5 mr-0.5 text-emerald-700" />
            {t.roleGroupAdmin}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold border border-slate-200">
            {t.roleMember}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Chat header */}
      <div className="px-4 py-3 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {groupName ? `${groupName} ${t.chatRoomTitle}` : t.groupChat}
            </h3>
            <p className="text-[11px] text-emerald-800 font-medium">
              {t.groupChatSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMessages(false)}
          disabled={loading}
          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
          title={t.refresh}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {error && (
          <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">{t.noMessagesYet}</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              {t.startTheConversation}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-1.5 mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-700">
                  {isMe ? (language === 'ta' ? 'நான் (You)' : 'You') : msg.sender_name}
                </span>
                {getRoleBadge(msg.sender_role)}
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.typeMessagePlaceholder}
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          title={t.send}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
