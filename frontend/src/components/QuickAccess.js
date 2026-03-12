// frontend/src/components/QuickAccess.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Receipt, FileText, Plane, Zap, ArrowRight } from 'lucide-react';

// ─── Action definitions ────────────────────────────────────────────────────
const ACTIONS = [
  {
    id:          'new-expense',
    label:       'New Expense',
    description: 'Log a business expense',
    icon:        Plus,
    color:       'indigo',
    shortcut:    'N',
    route:       '/expenses/new',
    ariaLabel:   'Create a new expense. Keyboard shortcut Alt N.',
  },
  {
    id:          'add-receipt',
    label:       'Add Receipt',
    description: 'Upload receipt or PDF',
    icon:        Receipt,
    color:       'emerald',
    shortcut:    'R',
    route:       '/receipts/upload',
    ariaLabel:   'Upload a receipt or PDF. Keyboard shortcut Alt R.',
  },
  {
    id:          'create-report',
    label:       'Create Report',
    description: 'Generate expense report',
    icon:        FileText,
    color:       'amber',
    shortcut:    'P',
    route:       '/reports/new',
    ariaLabel:   'Generate an expense report. Keyboard shortcut Alt P.',
  },
  {
    id:          'create-trip',
    label:       'Create Trip',
    description: 'Plan a business trip',
    icon:        Plane,
    color:       'rose',
    shortcut:    'T',
    route:       '/trips/new',
    ariaLabel:   'Plan a new business trip. Keyboard shortcut Alt T.',
  },
];

const COLOR_TOKENS = {
  indigo:  { bg: 'var(--qa-indigo-bg)',  fg: 'var(--qa-indigo-fg)',  glow: 'var(--qa-indigo-glow)'  },
  emerald: { bg: 'var(--qa-emerald-bg)', fg: 'var(--qa-emerald-fg)', glow: 'var(--qa-emerald-glow)' },
  amber:   { bg: 'var(--qa-amber-bg)',   fg: 'var(--qa-amber-fg)',   glow: 'var(--qa-amber-glow)'   },
  rose:    { bg: 'var(--qa-rose-bg)',    fg: 'var(--qa-rose-fg)',    glow: 'var(--qa-rose-glow)'    },
};

// ─── Single action tile ────────────────────────────────────────────────────
function ActionButton({ action, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const Icon   = action.icon;
  const tokens = COLOR_TOKENS[action.color];

  return (
    <motion.button
      className="qa-btn"
      style={{ '--btn-bg': tokens.bg, '--btn-fg': tokens.fg, '--btn-glow': tokens.glow }}
      onClick={() => onClick(action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={action.ariaLabel}
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -3, scale: 1.025 }}
      whileTap={{ scale: 0.96 }}
    >
      {/* animated shine sweep */}
      <AnimatePresence>
        {hovered && (
          <motion.span
            className="qa-btn__shine"
            initial={{ x: '-110%', opacity: 0.6 }}
            animate={{ x: '110%',  opacity: 0   }}
            exit={{}}
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* icon bubble */}
      <motion.span
        className="qa-btn__icon"
        animate={hovered
          ? { rotate: action.id === 'create-trip' ? -18 : 0, scale: 1.18 }
          : { rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        aria-hidden="true"
      >
        <Icon size={19} strokeWidth={2.4} />
      </motion.span>

      {/* label + description */}
      <span className="qa-btn__body">
        <span className="qa-btn__label">{action.label}</span>
        <span className="qa-btn__desc">{action.description}</span>
      </span>

      {/* shortcut + arrow */}
      <span className="qa-btn__meta" aria-hidden="true">
        <motion.span
          className="qa-btn__arrow"
          animate={hovered ? { x: 4, opacity: 1 } : { x: 0, opacity: 0.35 }}
          transition={{ duration: 0.16 }}
        >
          <ArrowRight size={13} />
        </motion.span>
        <span className="qa-btn__shortcut">⌥{action.shortcut}</span>
      </span>
    </motion.button>
  );
}

// ─── Main QuickAccess card ─────────────────────────────────────────────────
function QuickAccess({ onNewExpense, onAddReceipt, onCreateReport, onCreateTrip }) {
  const navigate = useNavigate();
  const [toast, setToast]   = useState(null);

  const handlerMap = {
    'new-expense':   onNewExpense,
    'add-receipt':   onAddReceipt,
    'create-report': onCreateReport,
    'create-trip':   onCreateTrip,
  };

  function handleAction(action) {
    const fn = handlerMap[action.id];
    fn ? fn() : navigate(action.route);
    setToast(action.label);
    setTimeout(() => setToast(null), 1800);
  }

  // ── Global Alt + letter keyboard shortcuts ──
  useEffect(() => {
    function onKeyDown(e) {
      if (!e.altKey) return;
      const action = ACTIONS.find(a => a.shortcut.toLowerCase() === e.key.toLowerCase());
      if (action) { e.preventDefault(); handleAction(action); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <motion.section
        className="qa-card"
        aria-label="Quick access actions"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        {/* header */}
        <div className="qa-header">
          <span className="qa-header__icon-ring" aria-hidden="true">
            <Zap size={13} strokeWidth={2.8} />
          </span>
          <h3 className="qa-header__title">Quick Access</h3>
          <span className="qa-header__hint">
            <kbd aria-hidden="true">⌥</kbd>
            <span className="qa-sr-only">Alt key</span>
            &nbsp;shortcuts enabled
          </span>
        </div>

        <div className="qa-divider" aria-hidden="true" />

        {/* grid */}
        <div className="qa-grid" role="list" aria-label="Quick action buttons">
          {ACTIONS.map((action, idx) => (
            <div key={action.id} role="listitem">
              <ActionButton action={action} index={idx} onClick={handleAction} />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Live region for screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="qa-sr-only">
        {toast ? `${toast} opened` : ''}
      </div>

      {/* Visual toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="qa-toast"
            aria-hidden="true"
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.2 }}
          >
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default QuickAccess;