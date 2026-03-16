import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaBell, FaShieldAlt, FaPalette, FaGlobe, FaSave } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function SettingsPage() {
  const { authAxios, user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState({
    profile: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      position: ''
    },
    notifications: {
      email_alerts: true,
      push_notifications: true,
      approval_requests: true,
      expense_reports: true,
      trip_updates: false
    },
    preferences: {
      language: 'en',
      currency: 'EUR',
      date_format: 'DD/MM/YYYY',
      theme: 'light'
    },
    security: {
      two_factor_auth: false,
      session_timeout: 30,
      login_alerts: true
    }
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      // Fetch user profile
      if (user) {
        setSettings(prev => ({
          ...prev,
          profile: {
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            department: user.department || '',
            position: user.position || ''
          }
        }));
      }
      
      // Fetch notification preferences
      try {
        const notifResponse = await authAxios.get('/settings/notifications/');
        setSettings(prev => ({
          ...prev,
          notifications: notifResponse.data
        }));
      } catch (err) {
        console.log('Using default notification settings');
      }
      
      // Fetch preferences
      try {
        const prefResponse = await authAxios.get('/settings/preferences/');
        setSettings(prev => ({
          ...prev,
          preferences: prefResponse.data
        }));
      } catch (err) {
        console.log('Using default preferences');
      }
      
      // Fetch security settings
      try {
        const securityResponse = await authAxios.get('/settings/security/');
        setSettings(prev => ({
          ...prev,
          security: securityResponse.data
        }));
      } catch (err) {
        console.log('Using default security settings');
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        [name]: value
      }
    });
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [name]: checked
      }
    });
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [name]: value
      }
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      // Save profile settings
      if (activeTab === 'profile') {
        await updateProfile({
          first_name: settings.profile.first_name,
          last_name: settings.profile.last_name,
          email: settings.profile.email,
          phone: settings.profile.phone,
          department: settings.profile.department,
          position: settings.profile.position
        });
      }
      
      // Save notification settings
      if (activeTab === 'notifications') {
        await authAxios.post('/settings/notifications/', settings.notifications);
      }
      
      // Save preferences
      if (activeTab === 'preferences') {
        await authAxios.post('/settings/preferences/', settings.preferences);
      }
      
      // Save security settings
      if (activeTab === 'security') {
        await authAxios.post('/settings/security/', settings.security);
      }
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings.profile.first_name) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
        <motion.button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Notifications
          </button>
          <button 
            className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <FaGlobe /> Preferences
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaShieldAlt /> Security
          </button>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <FaPalette /> Appearance
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Profile Settings</h2>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={settings.profile.first_name}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={settings.profile.last_name}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={settings.profile.email}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={settings.profile.phone}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={settings.profile.department}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={settings.profile.position}
                  onChange={handleProfileChange}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Notification Preferences</h2>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="email_alerts"
                    checked={settings.notifications.email_alerts}
                    onChange={handleNotificationChange}
                  />
                  Email Alerts
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="push_notifications"
                    checked={settings.notifications.push_notifications}
                    onChange={handleNotificationChange}
                  />
                  Push Notifications
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="approval_requests"
                    checked={settings.notifications.approval_requests}
                    onChange={handleNotificationChange}
                  />
                  Approval Requests
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="expense_reports"
                    checked={settings.notifications.expense_reports}
                    onChange={handleNotificationChange}
                  />
                  Expense Reports
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="trip_updates"
                    checked={settings.notifications.trip_updates}
                    onChange={handleNotificationChange}
                  />
                  Trip Updates
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Regional Settings</h2>
              <div className="form-group">
                <label>Language</label>
                <select name="language" value={settings.preferences.language} onChange={handlePreferenceChange}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select name="currency" value={settings.preferences.currency} onChange={handlePreferenceChange}>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date Format</label>
                <select name="date_format" value={settings.preferences.date_format} onChange={handlePreferenceChange}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Security Settings</h2>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="two_factor_auth"
                    checked={settings.security.two_factor_auth}
                    onChange={handleSecurityChange}
                  />
                  Enable Two-Factor Authentication
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="login_alerts"
                    checked={settings.security.login_alerts}
                    onChange={handleSecurityChange}
                  />
                  Login Alerts
                </label>
              </div>
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  name="session_timeout"
                  value={settings.security.session_timeout}
                  onChange={handleSecurityChange}
                  min="5"
                  max="120"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div 
              className="settings-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2>Appearance</h2>
              <div className="theme-options">
                <div className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={settings.preferences.theme === 'light'}
                    onChange={handlePreferenceChange}
                  />
                  <div className="theme-preview light">
                    <span>Light Theme</span>
                  </div>
                </div>
                <div className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={settings.preferences.theme === 'dark'}
                    onChange={handlePreferenceChange}
                  />
                  <div className="theme-preview dark">
                    <span>Dark Theme</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;