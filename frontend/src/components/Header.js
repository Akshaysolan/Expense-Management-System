import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { user, logout, authAxios } = useAuth();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchNotifications = async () => {
    try {
      const response = await authAxios.get('/notifications/');
      setNotifications(response.data.slice(0, 5));
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/search/', {
        params: { q: searchQuery }
      });
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await authAxios.patch(`/notifications/${id}/read/`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.action_url) {
      navigate(notif.action_url);
    }
    setShowNotifications(false);
  };

  const handleSearchResultClick = (result) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (result.type === 'expense') {
      navigate(`/expenses/${result.id}`);
    } else if (result.type === 'trip') {
      navigate(`/trips/${result.id}`);
    } else if (result.type === 'employee') {
      navigate(`/profile/${result.id}`);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getUserFullName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserDisplayName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user?.first_name) return user.first_name.charAt(0);
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const formatRole = (role) => {
    if (!role) return 'Employee';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
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

      <div className="header-center-section" ref={searchRef}>
        <motion.div 
          className={`header-search-container ${searchFocused ? 'header-search-focused' : ''}`}
          animate={searchFocused ? { scale: 1.02 } : { scale: 1 }}
        >
          <Search className="header-search-icon" size={20} />
          <input 
            type="text" 
            className="header-search-input"
            placeholder="Search expenses, trips, reports..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div 
                className="header-search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {searchResults.expenses?.length > 0 && (
                  <>
                    <div className="search-result-category">Expenses</div>
                    {searchResults.expenses.slice(0, 3).map(exp => (
                      <div key={exp.id} className="search-result-item" onClick={() => handleSearchResultClick({ ...exp, type: 'expense' })}>
                        <span className="search-result-icon">💰</span>
                        <div>
                          <div className="search-result-title">{exp.subject}</div>
                          <div className="search-result-subtitle">€{exp.amount} • {exp.employee_name}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {searchResults.trips?.length > 0 && (
                  <>
                    <div className="search-result-category">Trips</div>
                    {searchResults.trips.slice(0, 3).map(trip => (
                      <div key={trip.id} className="search-result-item" onClick={() => handleSearchResultClick({ ...trip, type: 'trip' })}>
                        <span className="search-result-icon">✈️</span>
                        <div>
                          <div className="search-result-title">{trip.destination}</div>
                          <div className="search-result-subtitle">{trip.employee_name} • {trip.start_date}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {searchResults.employees?.length > 0 && (
                  <>
                    <div className="search-result-category">Employees</div>
                    {searchResults.employees.slice(0, 3).map(emp => (
                      <div key={emp.id} className="search-result-item" onClick={() => handleSearchResultClick({ ...emp, type: 'employee' })}>
                        <span className="search-result-icon">👤</span>
                        <div>
                          <div className="search-result-title">{emp.full_name}</div>
                          <div className="search-result-subtitle">{emp.department} • {emp.position}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {loading && (
                  <div className="search-loading">
                    <div className="loading-spinner-small" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
                  {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                      <motion.div 
                        key={notif.id}
                        className={`header-notification-item ${!notif.is_read ? 'header-notification-unread' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 5 }}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="header-notification-icon">
                          {notif.notification_type?.includes('expense') ? '💰' :
                           notif.notification_type?.includes('trip') ? '✈️' : '📋'}
                        </div>
                        <div className="header-notification-content">
                          <p className="header-notification-title">{notif.title}</p>
                          <span className="header-notification-time">{formatTimeAgo(notif.created_at)}</span>
                        </div>
                        {!notif.is_read && <span className="header-notification-dot"></span>}
                      </motion.div>
                    ))
                  ) : (
                    <div className="header-notification-empty">
                      <p>No notifications</p>
                    </div>
                  )}
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

        <div className="header-user-wrapper" ref={userMenuRef}>
          <motion.button 
            className="header-user-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="header-user-avatar">
              <div className="header-avatar-placeholder">
                {getUserInitials()}
              </div>
              <span className="header-online-indicator"></span>
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{getUserDisplayName()}</span>
              <span className="header-user-role">{formatRole(user?.role)}</span>
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
                    <div className="header-avatar-placeholder header-avatar-large">
                      {getUserInitials()}
                    </div>
                  </div>
                  <div className="header-dropdown-user-details">
                    <h4>{getUserFullName()}</h4>
                    <p>{user?.email || ''}</p>
                    <p className="header-dropdown-user-role">
                      <span className="role-badge">{formatRole(user?.role)}</span>
                    </p>
                  </div>
                </div>

                <div className="header-dropdown-menu-items">
                  <Link to={`/profile/${user?.id}`} className="header-menu-item" onClick={() => setShowUserMenu(false)}>
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/analytics" className="header-menu-item" onClick={() => setShowUserMenu(false)}>
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
                    <span className="header-menu-badge">{unreadCount}</span>
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