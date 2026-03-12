// frontend/src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Mail, 
  Calendar, 
  Settings, 
  User,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  BarChart2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function Header({ isCollapsed, toggleSidebar, isMobile, toggleMobileSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Refs for click-outside detection ──
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // ── Close dropdowns when clicking outside ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  console.log('👤 Full user object:', JSON.stringify(user, null, 2));
  console.log('👤 User role value:', user?.role);
  console.log('👤 User role type:', typeof user?.role);

  const notifications = [
    { id: 1, title: 'New expense approval', time: '5 min ago', read: false, icon: '💰' },
    { id: 2, title: 'Trip to London approved', time: '1 hour ago', read: false, icon: '✈️' },
    { id: 3, title: 'Monthly report ready', time: '3 hours ago', read: true, icon: '📊' },
    { id: 4, title: 'Receipt uploaded', time: '1 day ago', read: true, icon: '📎' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatRole = (role) => {
    if (!role) return 'Employee';
    const roleStr = String(role).trim();
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
  };

  const getUserFullName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    else if (user?.first_name) return user.first_name;
    else if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserDisplayName = () => {
    if (user?.first_name) return user.first_name;
    else if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    else if (user?.first_name) return user.first_name.charAt(0);
    else if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  if (!user) return null;

  return (
    <motion.header 
      className="header-container"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="header-left-section">
        {isMobile ? (
          <motion.button
            className="header-sidebar-toggle"
            onClick={toggleMobileSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </motion.button>
        ) : (
          <motion.button
            className="header-sidebar-toggle"
            onClick={toggleSidebar}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </motion.button>
        )}

        <motion.div 
          className="header-greeting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="header-greeting-emoji">✨</span>
          <div className="header-greeting-text">
            <span className="header-greeting-name">ExpensePro</span>
          </div>
        </motion.div>
      </div>

      <div className="header-center-section">
        <motion.div 
          className={`header-search-container ${searchFocused ? 'header-search-focused' : ''}`}
          animate={searchFocused ? { scale: 1.02 } : { scale: 1 }}
        >
          <Search className="header-search-icon" size={20} />
          <input 
            type="text" 
            className="header-search-input"
            placeholder="Search expenses, trips, reports..." 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <motion.div 
            className="header-search-shortcut"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
          >
            ⌘K
          </motion.div>
        </motion.div>
      </div>

      <div className="header-right-section">
        <motion.div 
          className="header-date-display"
          whileHover={{ scale: 1.05 }}
        >
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </motion.div>

        <motion.button 
          className="header-theme-toggle"
          onClick={toggleTheme}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        {/* ── Notifications with ref ── */}
        <div className="header-notifications-wrapper" ref={notificationsRef}>
          <motion.button 
            className="header-notifications-button"
            onClick={() => setShowNotifications(!showNotifications)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span 
                className="header-notifications-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                className="header-notifications-dropdown"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="header-dropdown-header">
                  <h3>Notifications</h3>
                  <span className="header-unread-count">{unreadCount} unread</span>
                </div>
                <div className="header-notifications-list">
                  {notifications.map((notif, index) => (
                    <motion.div 
                      key={notif.id}
                      className={`header-notification-item ${!notif.read ? 'header-notification-unread' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="header-notification-icon">{notif.icon}</div>
                      <div className="header-notification-content">
                        <p className="header-notification-title">{notif.title}</p>
                        <span className="header-notification-time">{notif.time}</span>
                      </div>
                      {!notif.read && <span className="header-notification-dot"></span>}
                    </motion.div>
                  ))}
                </div>
                <div className="header-dropdown-footer">
                  <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── User Menu with ref ── */}
        <div className="header-user-wrapper" ref={userMenuRef}>
          <motion.button 
            className="header-user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="header-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={getUserFullName()} />
              ) : (
                <div className="header-avatar-placeholder">
                  {getUserInitials()}
                </div>
              )}
              <span className="header-online-indicator"></span>
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{getUserDisplayName()}</span>
              <span className="header-user-role">
                {user?.role === 'manager' ? 'Manager' : 
                 user?.role === 'employee' ? 'Employee' : 
                 user?.role === 'admin' ? 'Admin' : 
                 formatRole(user?.role)}
              </span>
            </div>
            <ChevronDown size={16} className={`header-dropdown-arrow ${showUserMenu ? 'header-arrow-rotated' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                className="header-user-dropdown"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="header-dropdown-user-info">
                  <div className="header-dropdown-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={getUserFullName()} />
                    ) : (
                      <div className="header-avatar-placeholder header-avatar-large">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <div className="header-dropdown-user-details">
                    <h4>{getUserFullName()}</h4>
                    <p>{user?.email || ''}</p>
                    <p className="header-dropdown-user-role">
                      <span className="role-badge">
                        {user?.role === 'manager' ? 'Manager' : 
                         user?.role === 'employee' ? 'Employee' : 
                         user?.role === 'admin' ? 'Admin' : 
                         formatRole(user?.role)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="header-dropdown-menu-items">
                  <Link to={`/profile/${user?.id}`} className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to={`/analytics/${user?.id}`} className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <BarChart2 size={16} />
                    <span>Analytics</span>
                  </Link>
                  <Link to="/settings" className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <Link to="/messages" className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <Mail size={16} />
                    <span>Messages</span>
                    <span className="header-menu-badge">3</span>
                  </Link>
                  <Link to="/notifications" className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <Bell size={16} />
                    <span>Notifications</span>
                    <span className="header-menu-badge">3</span>
                  </Link>
                  <div className="header-menu-divider"></div>
                  <button className="header-menu-item header-menu-logout" onClick={logout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

export default Header;