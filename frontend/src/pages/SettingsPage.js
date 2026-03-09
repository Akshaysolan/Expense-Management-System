// frontend/src/pages/SettingsPage.js
import React, { useState } from 'react';
import { FaUser, FaBell, FaShieldAlt, FaPalette, FaGlobe, FaSave } from 'react-icons/fa';

function SettingsPage() {
  const [settings, setSettings] = useState({
    profile: {
      name: 'Janice Chandler',
      email: 'janice.chandler@company.com',
      role: 'Administrator',
      department: 'Finance'
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      approvalRequests: true,
      expenseReports: true,
      tripUpdates: false
    },
    preferences: {
      language: 'English',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      loginAlerts: true
    }
  });

  const [activeTab, setActiveTab] = useState('profile');

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

  const handleSave = () => {
    alert('Settings saved successfully!');
    console.log('Settings saved:', settings);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
        <button className="btn-primary" onClick={handleSave}>
          <FaSave /> Save Changes
        </button>
      </div>

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
            <div className="settings-section">
              <h2>Profile Settings</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={settings.profile.name}
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
                <label>Role</label>
                <input
                  type="text"
                  name="role"
                  value={settings.profile.role}
                  onChange={handleProfileChange}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select name="department" value={settings.profile.department} onChange={handleProfileChange}>
                  <option value="Finance">Finance</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="emailAlerts"
                    checked={settings.notifications.emailAlerts}
                    onChange={handleNotificationChange}
                  />
                  Email Alerts
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={settings.notifications.pushNotifications}
                    onChange={handleNotificationChange}
                  />
                  Push Notifications
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="approvalRequests"
                    checked={settings.notifications.approvalRequests}
                    onChange={handleNotificationChange}
                  />
                  Approval Requests
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="expenseReports"
                    checked={settings.notifications.expenseReports}
                    onChange={handleNotificationChange}
                  />
                  Expense Reports
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="tripUpdates"
                    checked={settings.notifications.tripUpdates}
                    onChange={handleNotificationChange}
                  />
                  Trip Updates
                </label>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2>Regional Settings</h2>
              <div className="form-group">
                <label>Language</label>
                <select name="language" value={settings.preferences.language} onChange={handlePreferenceChange}>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
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
                <select name="dateFormat" value={settings.preferences.dateFormat} onChange={handlePreferenceChange}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={settings.security.twoFactorAuth}
                    onChange={handleSecurityChange}
                  />
                  Enable Two-Factor Authentication
                </label>
              </div>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="loginAlerts"
                    checked={settings.security.loginAlerts}
                    onChange={handleSecurityChange}
                  />
                  Login Alerts
                </label>
              </div>
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={settings.security.sessionTimeout}
                  onChange={handleSecurityChange}
                  min="5"
                  max="120"
                />
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;