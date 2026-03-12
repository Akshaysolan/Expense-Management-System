// frontend/src/components/PendingTasks.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  Plane,
  Receipt,
  CalendarClock,
  Wallet,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ─── task metadata (icon, color-key, label) ───────────────────────────────
const TASK_META = {
  'Printing Approvals':  { icon: Printer,      color: 'amber',  label: 'Awaiting your approval' },
  'Pending Approvals':   { icon: CheckCircle2, color: 'amber',  label: 'Require action' },
  'New Trips Registered':{ icon: Plane,        color: 'sky',    label: 'Newly submitted' },
  'Pending Trips':       { icon: Plane,        color: 'sky',    label: 'Pending review' },
  'Unreported Expenses': { icon: Receipt,      color: 'rose',   label: 'Need reporting' },
  'Pending Expenses':    { icon: Receipt,      color: 'rose',   label: 'Pending review' },
  'Upcoming Expenses':   { icon: CalendarClock,color: 'violet', label: 'Scheduled ahead' },
  'Unreported Advances': { icon: Wallet,       color: 'emerald',label: 'Outstanding balance' },
};

const DEFAULT_META = { icon: AlertCircle, color: 'slate', label: 'Pending action' };

// ─── colour tokens ────────────────────────────────────────────────────────
const COLOR_TOKENS = {
  amber:   { bg: 'var(--task-amber-bg)',   fg: 'var(--task-amber-fg)',   bar: 'var(--task-amber-bar)'   },
  sky:     { bg: 'var(--task-sky-bg)',     fg: 'var(--task-sky-fg)',     bar: 'var(--task-sky-bar)'     },
  rose:    { bg: 'var(--task-rose-bg)',    fg: 'var(--task-rose-fg)',    bar: 'var(--task-rose-bar)'    },
  violet:  { bg: 'var(--task-violet-bg)', fg: 'var(--task-violet-fg)', bar: 'var(--task-violet-bar)' },
  emerald: { bg: 'var(--task-emerald-bg)',fg: 'var(--task-emerald-fg)',bar: 'var(--task-emerald-bar)' },
  slate:   { bg: 'var(--task-slate-bg)',  fg: 'var(--task-slate-fg)',  bar: 'var(--task-slate-bar)'  },
};

// ─── helpers ──────────────────────────────────────────────────────────────
function formatValue(task) {
  if (task.value !== undefined && task.value !== null) {
    const n = typeof task.value === 'string' ? parseFloat(task.value) : task.value;
    return isNaN(n) ? '€0.00' : `€${n.toFixed(2)}`;
  }
  return task.count ?? 0;
}

function isUrgent(task) {
  const count = task.count ?? 0;
  return count > 3;
}

// ─── sub-component: single task row ──────────────────────────────────────
function TaskRow({ task, index, maxCount, onClick, isExpanded }) {
  const name   = task.task_name || 'Task';
  const meta   = TASK_META[name] ?? DEFAULT_META;
  const tokens = COLOR_TOKENS[meta.color];
  const Icon   = meta.icon;
  const val    = formatValue(task);
  const count  = task.count ?? 0;
  const pct    = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  const urgent = isUrgent(task);

  return (
    <motion.div
      className={`pt-row ${isExpanded ? 'pt-row--expanded' : ''}`}
      style={{ '--row-bg': tokens.bg, '--row-fg': tokens.fg, '--row-bar': tokens.bar }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 24 }}
      onClick={() => onClick(index)}
      layout
    >
      {/* left accent stripe */}
      <span className="pt-row__stripe" />

      {/* icon bubble */}
      <span className="pt-row__icon-wrap">
        <Icon size={16} strokeWidth={2.2} />
      </span>

      {/* text */}
      <div className="pt-row__body">
        <div className="pt-row__top">
          <span className="pt-row__name">{name}</span>
          {urgent && (
            <motion.span
              className="pt-row__badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.06 + 0.2, type: 'spring' }}
            >
              <Clock size={9} /> urgent
            </motion.span>
          )}
          <span className="pt-row__value">{val}</span>
        </div>

        {/* progress bar */}
        <div className="pt-row__bar-track">
          <motion.div
            className="pt-row__bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: index * 0.06 + 0.15, duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* expanded detail */}
        <AnimatePresence>
          {isExpanded && (
            <motion.p
              className="pt-row__detail"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.22 }}
            >
              <span>{meta.label}</span>
              {count > 0 && <span className="pt-row__pct">{pct}% of total load</span>}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* chevron */}
      <motion.span
        className="pt-row__chevron"
        animate={{ rotate: isExpanded ? 90 : 0 }}
        transition={{ duration: 0.18 }}
      >
        <ChevronRight size={14} />
      </motion.span>
    </motion.div>
  );
}

// ─── main component ───────────────────────────────────────────────────────
function PendingTasks({ tasks, onViewAll }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const defaultTasks = [
    { task_name: 'Printing Approvals',   count: 5 },
    { task_name: 'New Trips Registered', count: 1 },
    { task_name: 'Unreported Expenses',  count: 4 },
    { task_name: 'Upcoming Expenses',    count: 0 },
    { task_name: 'Unreported Advances',  count: 0, value: 0.00 },
  ];

  const displayTasks = tasks && tasks.length > 0 ? tasks : defaultTasks;
  const totalCount   = displayTasks.reduce((s, t) => s + (t.count ?? 0), 0);
  const maxCount     = Math.max(...displayTasks.map(t => t.count ?? 0), 1);
  const urgentCount  = displayTasks.filter(isUrgent).length;

  function toggle(idx) {
    setExpandedIdx(prev => (prev === idx ? null : idx));
  }

  return (
    <motion.div
      className="pt-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      {/* ── header ── */}
      <div className="pt-header">
        <div className="pt-header__left">
          <span className="pt-header__icon-ring">
            <TrendingUp size={15} strokeWidth={2.5} />
          </span>
          <div>
            <h3 className="pt-header__title">Pending Tasks</h3>
            <p className="pt-header__sub">
              {totalCount} item{totalCount !== 1 ? 's' : ''} need attention
            </p>
          </div>
        </div>

        <div className="pt-header__right">
          {urgentCount > 0 && (
            <motion.span
              className="pt-header__urgent"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              {urgentCount} urgent
            </motion.span>
          )}
          {onViewAll && (
            <button className="pt-header__link" onClick={onViewAll}>
              View all
            </button>
          )}
        </div>
      </div>

      {/* ── summary pills ── */}
      <div className="pt-summary">
        {displayTasks.filter(t => (t.count ?? 0) > 0).slice(0, 3).map((t, i) => {
          const m = TASK_META[t.task_name] ?? DEFAULT_META;
          const tok = COLOR_TOKENS[m.color];
          return (
            <motion.span
              key={i}
              className="pt-pill"
              style={{ '--pill-bg': tok.bg, '--pill-fg': tok.fg }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 + 0.1 }}
            >
              {t.count} {t.task_name.split(' ')[0]}
            </motion.span>
          );
        })}
      </div>

      {/* ── divider ── */}
      <div className="pt-divider" />

      {/* ── task rows ── */}
      <div className="pt-list">
        {displayTasks.map((task, idx) => (
          <TaskRow
            key={task.id ?? idx}
            task={task}
            index={idx}
            maxCount={maxCount}
            onClick={toggle}
            isExpanded={expandedIdx === idx}
          />
        ))}
      </div>

      {/* ── footer ── */}
      <div className="pt-footer">
        <span className="pt-footer__label">
          <CheckCircle2 size={12} /> Auto-refreshes every 5 min
        </span>
        <button className="pt-footer__action" onClick={onViewAll}>
          Resolve all →
        </button>
      </div>
    </motion.div>
  );
}

export default PendingTasks;