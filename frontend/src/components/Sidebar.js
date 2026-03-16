import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  Plane,
  CheckCircle2,
  BarChart3,
  FileText,
  Settings,
  HeadphonesIcon,
  X,
} from 'lucide-react';

function Sidebar({ isCollapsed, isMobile, closeMobileSidebar }) {
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  color: '#3b82f6' },
    { path: '/expenses',  icon: Receipt,         label: 'Expenses',   color: '#10b981', badge: 5 },
    { path: '/trips',     icon: Plane,           label: 'Trips',      color: '#f59e0b', badge: 2 },
    { path: '/approvals', icon: CheckCircle2,    label: 'Approvals',  color: '#8b5cf6', badge: 3 },
    { path: '/pdf-analytics', icon: BarChart3,   label: 'Analytics',  color: '#ec4899' },
    { path: '/reports',   icon: FileText,        label: 'Reports',    color: '#14b8a6' },
    { path: '/settings',  icon: Settings,        label: 'Settings',   color: '#64748b' },
    { path: '/support',   icon: HeadphonesIcon,  label: 'Support',    color: '#f43f5e' },
  ];

  const handleNavClick = () => {
    if (isMobile) closeMobileSidebar();
  };

  return (
    <>
      {isMobile && !isCollapsed && (
        <motion.div
          className="sidebar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeMobileSidebar}
        />
      )}

      <motion.aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
        animate={
          isMobile
            ? isCollapsed ? { x: '-100%' } : { x: 0 }
            : isCollapsed ? { width: '72px' } : { width: '260px' }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">💼</span>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  className="logo-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  Expense<span>Pro</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {isMobile && (
            <motion.button
              className="header-sidebar-toggle"
              onClick={closeMobileSidebar}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Close menu"
            >
              <X size={18} />
            </motion.button>
          )}
        </div>

        <nav className="nav-menu">
          {menuItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <motion.div
                  className="nav-item-content"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ x: isCollapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon
                    size={20}
                    className="nav-icon"
                    style={{ color: isActive ? item.color : undefined, flexShrink: 0 }}
                  />

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        className="nav-label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {!isCollapsed && item.badge && (
                      <motion.span
                        className="badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {isCollapsed && item.badge && (
                    <span className="nav-badge-dot" />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                className="upgrade-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
              >
                <h4>Pro Plan</h4>
                <p>Advanced features unlocked</p>
                <motion.button
                  className="upgrade-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upgrade
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;