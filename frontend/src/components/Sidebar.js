
import React, { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  User,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function Sidebar({ isCollapsed, toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#3b82f6' },
    { path: '/expenses', icon: Receipt, label: 'Expenses', color: '#10b981', badge: 5 },
    { path: '/trips', icon: Plane, label: 'Trips', color: '#f59e0b', badge: 2 },
    { path: '/approvals', icon: CheckCircle2, label: 'Approvals', color: '#8b5cf6', badge: 3 },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', color: '#ec4899' },
    { path: '/reports', icon: FileText, label: 'Reports', color: '#14b8a6' },
    { path: '/settings', icon: Settings, label: 'Settings', color: '#64748b' },
    { path: '/support', icon: HeadphonesIcon, label: 'Support', color: '#f43f5e' },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!', {
      icon: '👋',
    });
  };

  return (
    <motion.aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-header">
        <motion.div 
          className="logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="logo-icon">💰</span>
          {!isCollapsed && <span className="logo-text">ExpensePro</span>}
        </motion.div>
        <motion.button 
          className="collapse-btn"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </motion.button>
      </div>

      <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
        <motion.div 
          className="avatar"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user?.name?.charAt(0) || 'J'}
            </div>
          )}
          <span className="status-indicator"></span>
        </motion.div>
        {!isCollapsed && (
          <div className="user-info">
            <h4>{user?.name || 'Janice Chandler'}</h4>
            <p>{user?.role || 'Administrator'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUserMenu && !isCollapsed && (
          <motion.div 
            className="user-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button className="menu-item">
              <User size={16} />
              <span>My Profile</span>
            </button>
            <button className="menu-item">
              <Bell size={16} />
              <span>Notifications</span>
              <span className="badge">3</span>
            </button>
            <button className="menu-item" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button className="menu-item logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="nav-menu">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <motion.div
                className="nav-item-content"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon 
                  size={20} 
                  style={{ color: isActive ? item.color : undefined }}
                />
                {!isCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <motion.span 
                        className="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, delay: index * 0.1 }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <motion.div 
            className="upgrade-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
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
      </div>
    </motion.aside>
  );
}

export default Sidebar;
