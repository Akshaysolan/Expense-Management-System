// frontend/src/pages/NotificationsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, CheckCheck, Trash2, Filter,
  DollarSign, Plane, ClipboardCheck, FileText,
  AlertCircle, Info, TrendingUp, User,
  ChevronDown, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


// ─── Icon map ─────────────────────────────────────────────────
const TYPE_META = {
  expense_approved:  { icon: DollarSign,     color: '#10b981', bg: '#d1fae5', label: 'Expense'  },
  expense_rejected:  { icon: DollarSign,     color: '#ef4444', bg: '#fee2e2', label: 'Expense'  },
  expense_submitted: { icon: DollarSign,     color: '#3b82f6', bg: '#dbeafe', label: 'Expense'  },
  trip_approved:     { icon: Plane,          color: '#f59e0b', bg: '#fef3c7', label: 'Trip'     },
  trip_rejected:     { icon: Plane,          color: '#ef4444', bg: '#fee2e2', label: 'Trip'     },
  trip_submitted:    { icon: Plane,          color: '#8b5cf6', bg: '#ede9fe', label: 'Trip'     },
  approval_needed:   { icon: ClipboardCheck, color: '#8b5cf6', bg: '#ede9fe', label: 'Approval' },
  report_ready:      { icon: FileText,       color: '#14b8a6', bg: '#ccfbf1', label: 'Report'   },
  system_alert:      { icon: AlertCircle,    color: '#ef4444', bg: '#fee2e2', label: 'Alert'    },
  info:              { icon: Info,           color: '#3b82f6', bg: '#dbeafe', label: 'Info'     },
  budget_warning:    { icon: TrendingUp,     color: '#f59e0b', bg: '#fef3c7', label: 'Budget'   },
  profile_update:    { icon: User,           color: '#64748b', bg: '#f1f5f9', label: 'Profile'  },
};

function getMeta(type) {
  return TYPE_META[type] || TYPE_META['info'];
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Single Notification Card ──────────────────────────────────
function NotifCard({ notif, onMarkRead, onDelete }) {
  const meta = getMeta(notif.notification_type);
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className={`notif-card ${!notif.is_read ? 'notif-card--unread' : ''}`}
    >
      {/* Unread dot */}
      {!notif.is_read && <span className="notif-dot" />}

      {/* Icon */}
      <div
        className="notif-icon"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon size={18} />
      </div>

      {/* Body */}
      <div className="notif-body">
        <div className="notif-header-row">
          <span
            className="notif-type-tag"
            style={{ color: meta.color, background: meta.bg }}
          >
            {meta.label}
          </span>
          <span className="notif-time">{timeAgo(notif.created_at)}</span>
        </div>
        <p className="notif-title">{notif.title}</p>
        <p className="notif-message">{notif.message}</p>
        {notif.action_url && (
          <a href={notif.action_url} className="notif-action-link">
            {notif.action_label || 'View details'} →
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="notif-actions">
        {!notif.is_read && (
          <motion.button
            className="notif-btn notif-btn--read"
            onClick={() => onMarkRead(notif.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Mark as read"
          >
            <Check size={14} />
          </motion.button>
        )}
        <motion.button
          className="notif-btn notif-btn--delete"
          onClick={() => onDelete(notif.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Delete"
        >
          <Trash2 size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────
function NotificationsPage() {
  const { authAxios } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [filter, setFilter]               = useState('all');
  const [typeFilter, setTypeFilter]       = useState('all');
  const [showTypeMenu, setShowTypeMenu]   = useState(false);

  const typeMenuRef = useRef(null);

  // ── Close type dropdown on outside click ──────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target)) {
        setShowTypeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get('/notifications/');
      setNotifications(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  // ── Actions ────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await authAxios.patch(`/notifications/${id}/read/`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await authAxios.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await authAxios.delete(`/notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    try {
      await authAxios.delete('/notifications/clear-all/');
      setNotifications([]);
    } catch {}
  };

  // ── Derived ────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const allTypes    = ['all', ...new Set(notifications.map(n => n.notification_type))];

  const visible = notifications.filter(n => {
    const matchesRead =
      filter === 'all'    ? true :
      filter === 'unread' ? !n.is_read :
                             n.is_read;
    const matchesType = typeFilter === 'all' || n.notification_type === typeFilter;
    return matchesRead && matchesType;
  });

  // Group by date label
  const groups = visible.reduce((acc, n) => {
    const d         = new Date(n.created_at);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let label;
    if (d.toDateString() === today.toDateString())         label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  const STATS = [
    { label: 'Total',    val: notifications.length,                                                     bg: '#eff6ff', color: '#3b82f6' },
    { label: 'Unread',   val: unreadCount,                                                               bg: '#fef3c7', color: '#f59e0b' },
    { label: 'Expenses', val: notifications.filter(n => n.notification_type?.startsWith('expense')).length, bg: '#d1fae5', color: '#10b981' },
    { label: 'Trips',    val: notifications.filter(n => n.notification_type?.startsWith('trip')).length,    bg: '#ede9fe', color: '#8b5cf6' },
  ];

  const READ_FILTERS = [
    { key: 'all',    label: 'All'    },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read',   label: 'Read'   },
  ];

  return (
    <div className="notif-page">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="notif-page__header">
        <div className="notif-page__title-group">
          <div className="notif-page__icon">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="notif-page__title">Notifications</h1>
            <p className="notif-page__sub">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>

        <div className="notif-header-actions">
          <button className="notif-hdr-btn" onClick={fetchNotifications}>
            <RefreshCw size={14} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button className="notif-hdr-btn notif-hdr-btn--primary" onClick={markAllRead}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="notif-hdr-btn notif-hdr-btn--danger" onClick={clearAll}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────── */}
      <div className="notif-stats">
        {STATS.map(s => (
          <div key={s.label} className="notif-stat">
            <div className="notif-stat__icon" style={{ background: s.bg }}>
              <Bell size={16} color={s.color} />
            </div>
            <div>
              <div className="notif-stat__val" style={{ color: s.color }}>{s.val}</div>
              <div className="notif-stat__lbl">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="notif-filters">
        <div className="notif-filter-group">
          {READ_FILTERS.map(f => (
            <button
              key={f.key}
              className={`notif-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.count > 0 && <span className="badge">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* Type dropdown */}
        <div className="notif-type-wrap" ref={typeMenuRef}>
          <button
            className="notif-type-btn"
            onClick={() => setShowTypeMenu(v => !v)}
          >
            <Filter size={13} />
            {typeFilter === 'all' ? 'All Types' : typeFilter.replace(/_/g, ' ')}
            <ChevronDown
              size={13}
              className={`notif-chevron ${showTypeMenu ? 'notif-chevron--open' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showTypeMenu && (
              <motion.div
                className="notif-type-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {allTypes.map(t => (
                  <div
                    key={t}
                    className={`notif-type-opt ${typeFilter === t ? 'active' : ''}`}
                    onClick={() => { setTypeFilter(t); setShowTypeMenu(false); }}
                  >
                    <span className="notif-type-opt__label">
                      {t === 'all' ? 'All Types' : t.replace(/_/g, ' ')}
                    </span>
                    <span className="notif-type-opt__count">
                      {t === 'all'
                        ? notifications.length
                        : notifications.filter(n => n.notification_type === t).length}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="notif-visible-count">
          {visible.length} notification{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      {loading ? (
        <div className="notif-loading">
          <RefreshCw size={28} className="spin" />
          <span>Loading notifications…</span>
        </div>
      ) : error ? (
        <div className="notif-empty">
          <div className="notif-empty__icon"><AlertCircle size={28} /></div>
          <h3>Failed to load</h3>
          <p>{error}</p>
          <button className="notif-hdr-btn notif-retry-btn" onClick={fetchNotifications}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty__icon"><Bell size={28} /></div>
          <h3>{filter === 'unread' ? 'No unread notifications' : 'No notifications'}</h3>
          <p>
            {filter === 'unread'
              ? "You've read everything. Great job staying on top of things!"
              : 'Notifications about expenses, trips, and approvals will appear here.'}
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {Object.entries(groups).map(([label, items]) => (
            <div key={label}>
              <div className="notif-group-label">{label}</div>
              <AnimatePresence>
                {items.map(n => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onMarkRead={markRead}
                    onDelete={deleteNotif}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

export default NotificationsPage;