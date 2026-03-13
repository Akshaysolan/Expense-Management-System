// frontend/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Building2, Calendar,
  Edit2, Save, X, Camera, Award, Clock,
  CheckCircle, DollarSign, ArrowLeft, Briefcase,
  MapPin, Shield, Activity, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


/* ─── Tiny helpers ─── */
const getRolePillClass = (role = '') => {
  const r = role.toLowerCase();
  if (r.includes('admin')) return 'admin';
  if (r.includes('manager')) return 'manager';
  return 'employee';
};

const iconMap = { expense: DollarSign, trip: Calendar, approval: CheckCircle };

function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authAxios, user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => { fetchUserProfile(); fetchUserActivity(); }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      if (userId === 'me' || parseInt(userId) === currentUser?.id) {
        const { data } = await authAxios.get('/auth/profile/');
        setProfile(data); setEditedProfile(data);
      } else {
        const { data } = await authAxios.get(`/employees/${userId}/`);
        setProfile(data.employee); setEditedProfile(data.employee);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    setRecentActivity([
      { id: 1, type: 'expense', action: 'Submitted expense', subject: 'Business Lunch', amount: 75.50, date: '2026-04-08' },
      { id: 2, type: 'trip',    action: 'Created trip',      subject: 'London Conference',              date: '2026-04-07' },
      { id: 3, type: 'approval',action: 'Approved expense',  subject: 'Office Supplies',                date: '2026-04-06' },
    ]);
  };

  const handleSave = async () => {
    try {
      const { data } = await authAxios.patch('/auth/profile/update/', editedProfile);
      setProfile(data); setIsEditing(false);
    } catch { alert('Failed to update profile.'); }
  };

  const handleChange = (e) =>
    setEditedProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Loading profile…</p>
    </div>
  );

  if (error || !profile) return (
    <div className="error-container">
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Profile Unavailable</h2>
      <p style={{ color: 'var(--text-faint)' }}>{error || 'Profile not found'}</p>
      <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
    </div>
  );

  const isOwnProfile = currentUser?.id === profile.id || userId === 'me';
  const initials = `${profile.user?.first_name?.charAt(0) ?? ''}${profile.user?.last_name?.charAt(0) ?? ''}`;

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="profile-page">
      {/* Back */}
      <button className="profile-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* ── Hero ── */}
      <motion.div
        className="profile-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hero-banner" />

        <div className="hero-content">
          <div className="avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            {isOwnProfile && (
              <button className="avatar-edit-btn" title="Change photo">
                <Camera size={12} />
              </button>
            )}
          </div>

          <div className="profile-header-row">
            <div>
              <h1 className="profile-name">
                {profile.user?.first_name} {profile.user?.last_name}
              </h1>
              <div className="profile-subtitle">
                <span className="profile-position">{profile.position}</span>
                <span className="dot-sep" />
                <span className="profile-dept">{profile.department}</span>
              </div>
              <div className="employee-id-badge">
                <Shield size={10} /> {profile.employee_id}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className={`role-pill ${getRolePillClass(profile.role)}`}>
                <Award size={11} /> {profile.role}
              </span>
              {isOwnProfile && !isEditing && (
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                  <Edit2 size={13} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Body ── */}
      <motion.div
        className="profile-body"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contact & Info Card */}
          <motion.div className="card" variants={fadeUp}>
            <div className="card-header">
              <span className="card-title">Contact &amp; Information</span>
              <span className="status-dot" title="Active" />
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  className="edit-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input name="first_name" value={editedProfile.user?.first_name || ''} onChange={handleChange} placeholder="First name" />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input name="last_name" value={editedProfile.user?.last_name || ''} onChange={handleChange} placeholder="Last name" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input name="email" type="email" value={editedProfile.user?.email || ''} onChange={handleChange} placeholder="email@company.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" type="tel" value={editedProfile.phone || ''} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input name="position" value={editedProfile.position || ''} onChange={handleChange} placeholder="Job title" />
                  </div>
                  <div className="form-actions">
                    <button className="btn-secondary" onClick={() => { setEditedProfile(profile); setIsEditing(false); }}>
                      <X size={14} /> Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                      <Save size={14} /> Save Changes
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="detail-grid">
                    {[
                      { icon: Mail,      label: 'Email',        value: profile.user?.email },
                      { icon: Phone,     label: 'Phone',        value: profile.phone || 'Not provided' },
                      { icon: Building2, label: 'Department',   value: profile.department },
                      { icon: Briefcase, label: 'Position',     value: profile.position },
                      { icon: Calendar,  label: 'Member Since', value: profile.hire_date ? formatDate(profile.hire_date) : 'N/A' },
                      { icon: MapPin,    label: 'Location',     value: profile.location || 'Head Office' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div className="detail-item" key={label}>
                        <div className="detail-icon-wrap"><Icon size={15} /></div>
                        <div>
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Activity Feed */}
          <motion.div className="card" variants={fadeUp}>
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
              <Activity size={15} style={{ color: 'var(--text-faint)' }} />
            </div>
            <div className="card-body">
              {recentActivity.map((item, i) => {
                const Icon = iconMap[item.type] || Clock;
                return (
                  <motion.div
                    key={item.id}
                    className="activity-item"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
                  >
                    <div className={`activity-icon ${item.type}`}>
                      <Icon size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="activity-action">{item.action}</div>
                      <div className="activity-subject">{item.subject}</div>
                      <div className="activity-meta">
                        <span className="activity-date">{formatDate(item.date)}</span>
                        {item.amount && <span className="activity-amount">€{item.amount.toFixed(2)}</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-faint)', marginTop: 2 }} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} variants={fadeUp}>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Stats</span>
            </div>
            <div className="card-body">
              <div className="gold-line" />
              {[
                { label: 'Trips this year',    value: '12',     cls: '' },
                { label: 'Expenses submitted', value: '47',     cls: 'gold' },
                { label: 'Pending approvals',  value: '3',      cls: '' },
                { label: 'Total reimbursed',   value: '€8,240', cls: 'green' },
              ].map(({ label, value, cls }) => (
                <div className="stat-row" key={label}>
                  <span className="stat-label">{label}</span>
                  <span className={`stat-value ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Account</span>
            </div>
            <div className="card-body">
              <div className="gold-line" />
              {[
                { label: 'Account status', value: <><span className="status-dot" />Active</> },
                { label: 'Role',           value: profile.role },
                { label: 'Last login',     value: 'Today, 9:41 AM' },
                { label: 'Reports to',     value: profile.manager || 'N/A' },
              ].map(({ label, value }) => (
                <div className="stat-row" key={label}>
                  <span className="stat-label">{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default UserProfilePage;