
import React, { useState } from 'react';
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

} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';


function Header({ toggleMobileSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifications = [
    { id: 1, title: 'New expense approval', time: '5 min ago', read: false, icon: '💰' },
    { id: 2, title: 'Trip to London approved', time: '1 hour ago', read: false, icon: '✈️' },
    { id: 3, title: 'Monthly report ready', time: '3 hours ago', read: true, icon: '📊' },
    { id: 4, title: 'Receipt uploaded', time: '1 day ago', read: true, icon: '📎' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.header 
      className="header-container"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="header-left-section">
        

        <motion.div 
          className="header-greeting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="header-greeting-emoji">✨</span>
          <div className="header-greeting-text">
            <span className="header-greeting-welcome">Welcome back,</span>
            <span className="header-greeting-name">{user?.name || 'Janice Chandler'}</span>
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

        <div className="header-notifications-wrapper">
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
                  <Link to="/notifications">View all notifications</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="header-user-wrapper">
          <motion.button 
            className="header-user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="header-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="header-avatar-placeholder">
                  {user?.name?.charAt(0) || 'J'}
                </div>
              )}
              <span className="header-online-indicator"></span>
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{user?.name || 'Janice'}</span>
              <span className="header-user-role">{user?.role || 'Admin'}</span>
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
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="header-avatar-placeholder header-avatar-large">
                        {user?.name?.charAt(0) || 'J'}
                      </div>
                    )}
                  </div>
                  <div className="header-dropdown-user-details">
                    <h4>{user?.name || 'Janice Chandler'}</h4>
                    <p>{user?.email || 'janice@company.com'}</p>
                  </div>
                </div>

                <div className="header-dropdown-menu-items">
                  <Link to="/profile" className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <User size={16} />
                    <span>My Profile</span>
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