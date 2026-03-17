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

function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authAxios, user: currentUser, updateProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchUserProfile();
    fetchUserActivity();
    fetchUserStats();
  }, [fetchUserProfile, fetchUserActivity, fetchUserStats]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      if (userId === 'me' || parseInt(userId) === currentUser?.id) {
        const { data } = await authAxios.get('/auth/profile/');
        setProfile(data);
        setEditedProfile(data);
      } else {
        const { data } = await authAxios.get(`/employees/${userId}/`);
        setProfile(data.employee);
        setEditedProfile(data.employee);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await authAxios.get(`/users/${userId || currentUser?.id}/activity/`);
      setRecentActivity(response.data);
    } catch (err) {
      console.error('Error fetching activity:', err);
      // Set empty array on error
      setRecentActivity([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await authAxios.get(`/users/${userId || currentUser?.id}/stats/`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        trips_this_year: 0,
        expenses_submitted: 0,
        pending_approvals: 0,
        total_reimbursed: 0
      });
    }
  };

  const handleSave = async () => {
    try {
      const { data } = await updateProfile(editedProfile);
      setProfile(data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'first_name' || name === 'last_name' || name === 'email') {
      setEditedProfile(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [name]: value
        }
      }));
    } else {
      setEditedProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p>Loading profile…</p>
    </div>
  );

  if (error || !profile) return (
    <div className="error-container">
      <h2>Profile Unavailable</h2>
      <p>{error || 'Profile not found'}</p>
      <button onClick={() => navigate(-1)} className="back-btn">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  const isOwnProfile = currentUser?.id === profile.id || userId === 'me';
  const fullName = profile.user ?
    `${profile.user.first_name || ''} ${profile.user.last_name || ''}`.trim() :
    profile.full_name || 'User';

  const initials = fullName !== 'User' ?
    fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) :
    'U';

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } }
  };

  const iconMap = {
    expense: DollarSign,
    trip: Calendar,
    approval: CheckCircle
  };

  return (
    <div className="profile-page">
      <button className="profile-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <motion.div
        className="profile-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
              <h1 className="profile-name">{fullName}</h1>
              <div className="profile-subtitle">
                <span className="profile-position">{profile.position || 'No position'}</span>
                <span className="dot-sep" />
                <span className="profile-dept">{profile.department || 'No department'}</span>
              </div>
              <div className="employee-id-badge">
                <Shield size={10} /> {profile.employee_id || 'No ID'}
              </div>
            </div>

            <div className="profile-header-actions">
              <span className={`role-pill ${profile.role || 'employee'}`}>
                <Award size={11} /> {profile.role || 'employee'}
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

      <motion.div
        className="profile-body"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <div className="profile-left-col">
          <motion.div className="profile-card" variants={fadeUp}>
            <div className="card-header">
              <span className="card-title">Contact & Information</span>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  className="edit-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        name="first_name"
                        value={editedProfile.user?.first_name || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        name="last_name"
                        value={editedProfile.user?.last_name || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      name="email"
                      type="email"
                      value={editedProfile.user?.email || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      value={editedProfile.phone || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      name="position"
                      value={editedProfile.position || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      name="department"
                      value={editedProfile.department || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditedProfile(profile);
                        setIsEditing(false);
                      }}
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                      <Save size={14} /> Save
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="detail-grid">
                    {[
                      { icon: Mail, label: 'Email', value: profile.user?.email },
                      { icon: Phone, label: 'Phone', value: profile.phone || 'Not provided' },
                      { icon: Building2, label: 'Department', value: profile.department || 'Not set' },
                      { icon: Briefcase, label: 'Position', value: profile.position || 'Not set' },
                      { icon: Calendar, label: 'Member Since', value: profile.hire_date ? formatDate(profile.hire_date) : 'N/A' },
                      { icon: MapPin, label: 'Location', value: profile.location || 'Head Office' },
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

          <motion.div className="profile-card" variants={fadeUp}>
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
              <Activity size={15} />
            </div>
            <div className="card-body">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => {
                  const Icon = iconMap[item.type] || Clock;
                  return (
                    <motion.div
                      key={item.id || i}
                      className="activity-item"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      <div className={`activity-icon ${item.type}`}>
                        <Icon size={14} />
                      </div>
                      <div className="activity-content">
                        <div className="activity-action">{item.action}</div>
                        <div className="activity-subject">{item.subject}</div>
                        <div className="activity-meta">
                          <span className="activity-date">{formatDate(item.date)}</span>
                          {item.amount && <span className="activity-amount">€{item.amount.toFixed(2)}</span>}
                        </div>
                      </div>
                      <ChevronRight size={14} />
                    </motion.div>
                  );
                })
              ) : (
                <p className="no-activity">No recent activity</p>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div className="profile-right-col" variants={fadeUp}>
          <div className="profile-card">
            <div className="card-header">
              <span className="card-title">Quick Stats</span>
            </div>
            <div className="card-body">
              {[
                { label: 'Trips this year', value: stats.trips_this_year || 0 },
                { label: 'Expenses submitted', value: stats.expenses_submitted || 0 },
                { label: 'Pending approvals', value: stats.pending_approvals || 0 },
                { label: 'Total reimbursed', value: stats.total_reimbursed ? `€${stats.total_reimbursed}` : '€0' },
              ].map(({ label, value }) => (
                <div className="stat-row" key={label}>
                  <span className="stat-label">{label}</span>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <div className="card-header">
              <span className="card-title">Account</span>
            </div>
            <div className="card-body">
              {[
                { label: 'Account status', value: profile.is_active ? 'Active' : 'Inactive' },
                { label: 'Role', value: profile.role || 'employee' },
                { label: 'Last login', value: profile.last_login ? formatDate(profile.last_login) : 'N/A' },
                { label: 'Employee ID', value: profile.employee_id || 'N/A' },
              ].map(({ label, value }) => (
                <div className="stat-row" key={label}>
                  <span className="stat-label">{label}</span>
                  <span className="stat-value">{value}</span>
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