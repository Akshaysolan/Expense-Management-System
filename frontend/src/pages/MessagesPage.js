// frontend/src/pages/MessagesPage.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Search, Trash2, Star,
  ChevronLeft, RefreshCw, Plus, Inbox
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors   = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const color    = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className="msg-avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

function MessagesPage() {
  const { authAxios, user } = useAuth();

  const [threads, setThreads]               = useState([]);
  const [selected, setSelected]             = useState(null);
  const [messages, setMessages]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [msgLoading, setMsgLoading]         = useState(false);
  const [search, setSearch]                 = useState('');
  const [folder, setFolder]                 = useState('inbox');
  const [composing, setComposing]           = useState(false);
  const [draft, setDraft]                   = useState({ to: '', subject: '', body: '' });
  const [sending, setSending]               = useState(false);
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const [reply, setReply]                   = useState('');
  const [replySending, setReplySending]     = useState(false);

  const messagesEndRef = useRef(null);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get(`/messages/?folder=${folder}`);
      setThreads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchThreads(); }, [folder]);

  const openThread = async (thread) => {
    setSelected(thread);
    setIsMobileDetail(true);
    setMsgLoading(true);
    try {
      const res = await authAxios.get(`/messages/threads/${thread.id}/`);
      setMessages(res.data.messages || []);
      setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, is_read: true } : t));
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.to || !draft.subject || !draft.body) return;
    setSending(true);
    try {
      await authAxios.post('/messages/', draft);
      setComposing(false);
      setDraft({ to: '', subject: '', body: '' });
      fetchThreads();
    } catch {
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplySending(true);
    try {
      const res = await authAxios.post(`/messages/threads/${selected.id}/reply/`, { body: reply });
      setMessages(prev => [...prev, res.data]);
      setReply('');
    } catch {
      alert('Failed to send reply.');
    } finally {
      setReplySending(false);
    }
  };

  const deleteThread = async (id) => {
    try {
      await authAxios.delete(`/messages/threads/${id}/`);
      setThreads(prev => prev.filter(t => t.id !== id));
      if (selected?.id === id) { setSelected(null); setIsMobileDetail(false); }
    } catch {}
  };

  const toggleStar = async (id) => {
    try {
      await authAxios.patch(`/messages/threads/${id}/star/`);
      setThreads(prev => prev.map(t => t.id === id ? { ...t, is_starred: !t.is_starred } : t));
    } catch {}
  };

  const filtered = threads.filter(t =>
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.sender_name?.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = threads.filter(t => !t.is_read).length;

  const FOLDERS = [
    { key: 'inbox',   icon: Inbox, label: 'Inbox',   count: unreadCount },
    { key: 'sent',    icon: Send,  label: 'Sent' },
    { key: 'starred', icon: Star,  label: 'Starred' },
  ];

  return (
    <>
      <div className="msg-page">
        {/* Sidebar */}
        <div className="msg-sidebar">
          <div className="msg-sidebar__top">
            <div className="msg-sidebar__title">Messages</div>
            <button className="msg-compose-btn" onClick={() => setComposing(true)}>
              <Plus size={15} /> Compose
            </button>
          </div>
          <div className="msg-folder-list">
            {FOLDERS.map(f => (
              <button key={f.key} className={`msg-folder-btn ${folder === f.key ? 'active' : ''}`} onClick={() => setFolder(f.key)}>
                <f.icon size={16} />{f.label}
                {f.count > 0 && <span className="msg-folder-badge">{f.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Thread List */}
        <div className={`msg-list-panel ${isMobileDetail ? 'mobile-hidden' : ''}`}>
          <div className="msg-list-search">
            <Search size={14} className="srch-icon" />
            <input placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="msg-thread-list">
            {loading ? (
              <div className="msg-center-placeholder"><RefreshCw size={20} className="spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="msg-center-placeholder msg-empty-text">No messages found</div>
            ) : (
              filtered.map(thread => (
                <div
                  key={thread.id}
                  className={`msg-thread-item ${!thread.is_read ? 'unread' : ''} ${selected?.id === thread.id ? 'active' : ''}`}
                  onClick={() => openThread(thread)}
                >
                  <Avatar name={thread.sender_name || 'Unknown'} size={34} />
                  <div className="msg-thread-content">
                    <div className="msg-thread-top">
                      <span className="msg-thread-sender">{thread.sender_name || 'Unknown'}</span>
                      <span className="msg-thread-time">{timeAgo(thread.last_message_at || thread.created_at)}</span>
                    </div>
                    <div className="msg-thread-subject">{thread.subject}</div>
                    <div className="msg-thread-preview">{thread.preview}</div>
                  </div>
                  {!thread.is_read && <span className="msg-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="msg-detail-panel">
          {!selected ? (
            <div className="msg-detail-empty">
              <Mail size={40} className="msg-empty-icon" />
              <span>Select a conversation</span>
            </div>
          ) : (
            <>
              <div className="msg-detail-header">
                <button className="msg-icon-btn msg-back-btn" onClick={() => { setSelected(null); setIsMobileDetail(false); }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="msg-detail-subject">{selected.subject}</div>
                <div className="msg-detail-actions">
                  <button className={`msg-icon-btn star ${selected.is_starred ? 'starred' : ''}`} onClick={() => toggleStar(selected.id)} title={selected.is_starred ? 'Unstar' : 'Star'}>
                    {selected.is_starred ? <Star size={15} fill="currentColor" /> : <Star size={15} />}
                  </button>
                  <button className="msg-icon-btn" onClick={() => deleteThread(selected.id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="msg-messages-area">
                {msgLoading ? (
                  <div className="msg-center-placeholder"><RefreshCw size={20} className="spin" /></div>
                ) : (
                  messages.map((msg, i) => {
                    const mine = msg.sender_id === user?.id || msg.is_mine;
                    return (
                      <motion.div
                        key={msg.id || i}
                        className={`msg-bubble-wrap ${mine ? 'mine' : ''}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        {!mine && <Avatar name={msg.sender_name || selected.sender_name} size={28} />}
                        <div className={`msg-bubble ${mine ? 'mine' : ''}`}>
                          {msg.body}
                          <div className="msg-bubble-time">{timeAgo(msg.created_at)}</div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="msg-reply-bar">
                <textarea
                  className="msg-reply-input"
                  placeholder="Type your reply…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  rows={1}
                />
                <button className="msg-send-btn" onClick={sendReply} disabled={!reply.trim() || replySending}>
                  {replySending ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {composing && (
          <motion.div className="compose-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setComposing(false)}>
            <motion.div className="compose-modal" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="compose-header">
                <h3>New Message</h3>
                <button className="compose-close" onClick={() => setComposing(false)}>×</button>
              </div>
              <div className="compose-field">
                <input placeholder="To (email or name)" value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))} />
              </div>
              <div className="compose-field">
                <input placeholder="Subject" value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} />
              </div>
              <div className="compose-field">
                <textarea placeholder="Write your message…" value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} />
              </div>
              <div className="compose-actions">
                <button className="compose-cancel-btn" onClick={() => setComposing(false)}>Cancel</button>
                <button className="msg-send-btn" onClick={sendMessage} disabled={!draft.to || !draft.subject || !draft.body || sending}>
                  {sending ? <RefreshCw size={14} className="spin" /> : <Send size={14} />} Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MessagesPage;