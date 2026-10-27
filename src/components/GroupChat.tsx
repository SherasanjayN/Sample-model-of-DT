import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Message } from '../types';
import { Send, MessageSquare, ShieldCheck, UserCheck, User as UserIcon, RefreshCw } from 'lucide-react';

interface GroupChatProps {
  groupId: string;
  groupName?: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <ShieldCheck className="w-3 h-3 text-amber-400" />;
      case 'GROUP_ADMIN':
        return <UserCheck className="w-3 h-3 text-emerald-400" />;
      default:
        return <UserIcon className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Chat header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {groupName ? `${groupName} Chat Room` : 'Group Dedicated Chat'}
            </h4>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live group discussion · Scoped to members</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchMessages(false)}
          title="Refresh messages"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-10 h-10 mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No messages in this group yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Start the conversation regarding meetings, savings, or loan requests.
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
                <span className="text-[11px] font-medium text-slate-400">
                  {isMe ? 'You' : msg.sender_name}
                </span>
                <span className="flex items-center space-x-0.5 text-[10px] text-slate-500">
                  {getRoleIcon(msg.sender_role)}
                  <span>{msg.sender_role.replace(/_/g, ' ')}</span>
                </span>
                <span className="text-slate-600 text-[10px]">·</span>
                <span className="text-[10px] text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow'
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/80 shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message to your Magalir Kuzhu group..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-40 transition-colors shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
