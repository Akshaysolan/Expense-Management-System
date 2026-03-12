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

/* ─────────────────────────────────────────────
   DESIGN SYSTEM – Refined Executive Dark Theme
   Fonts: Playfair Display + DM Sans
   Palette: Deep navy, warm ivory, amber gold
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --navy-950: #070c18;
    --navy-900: #0d1526;
    --navy-800: #111d35;
    --navy-700: #162240;
    --navy-600: #1e2f55;
    --navy-400: #2e4880;
    --gold-500: #c9a84c;
    --gold-400: #d4b86a;
    --gold-300: #e2cc94;
    --ivory-100: #f5f0e8;
    --ivory-200: #ede6d8;
    --ivory-300: #d9cebd;
    --slate-400: #8899b8;
    --slate-300: #a8b8d0;
    --green-400: #3db87a;
    --red-400: #e05c6a;
    --amber-400: #f59e0b;
    --shadow-gold: 0 0 40px rgba(201,168,76,0.12);
    --shadow-deep: 0 24px 64px rgba(7,12,24,0.6);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .profile-page {
    min-height: 100vh;
    background: var(--navy-950);
    font-family: 'DM Sans', sans-serif;
    color: var(--ivory-100);
    position: relative;
    overflow-x: hidden;
  }

  /* Atmospheric grid background */
  .profile-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }

  .profile-page > * { position: relative; z-index: 1; }

  /* ── Back Nav ── */
  .profile-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 24px 32px;
    color: var(--slate-400);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    background: none;
    border: none;
    transition: color 0.2s;
  }
  .profile-back:hover { color: var(--gold-400); }

  /* ── Hero Section ── */
  .profile-hero {
    position: relative;
    padding: 0 32px 0;
    max-width: 1100px;
    margin: 0 auto;
  }

  .hero-banner {
    height: 200px;
    border-radius: 20px 20px 0 0;
    background: linear-gradient(135deg, var(--navy-700) 0%, var(--navy-600) 50%, var(--navy-800) 100%);
    position: relative;
    overflow: hidden;
  }

  .hero-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(46,72,128,0.5) 0%, transparent 50%);
  }

  /* Decorative lines on banner */
  .hero-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 30px,
      rgba(201,168,76,0.04) 30px,
      rgba(201,168,76,0.04) 31px
    );
  }

  .hero-content {
    background: var(--navy-900);
    border: 1px solid rgba(201,168,76,0.12);
    border-top: none;
    border-radius: 0 0 20px 20px;
    padding: 0 40px 40px;
  }

  /* ── Avatar ── */
  .avatar-wrap {
    position: relative;
    display: inline-block;
    margin-top: -52px;
    margin-bottom: 20px;
  }

  .profile-avatar {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--navy-600), var(--navy-400));
    border: 3px solid var(--gold-500);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 600;
    color: var(--gold-400);
    box-shadow: var(--shadow-gold), 0 0 0 6px var(--navy-900);
    letter-spacing: 1px;
  }

  .avatar-edit-btn {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--gold-500);
    border: 2px solid var(--navy-900);
    color: var(--navy-950);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }
  .avatar-edit-btn:hover { background: var(--gold-300); transform: scale(1.1); }

  /* ── Profile Header ── */
  .profile-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
  }

  .profile-name {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--ivory-100);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .profile-subtitle {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .profile-position {
    font-size: 14px;
    color: var(--slate-300);
    font-weight: 400;
  }

  .dot-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--slate-400);
  }

  .profile-dept {
    font-size: 14px;
    color: var(--gold-400);
    font-weight: 500;
  }

  .employee-id-badge {
    margin-top: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--slate-400);
    background: rgba(201,168,76,0.06);
    border: 1px solid rgba(201,168,76,0.14);
    padding: 4px 10px;
    border-radius: 4px;
  }

  /* ── Role Badge ── */
  .role-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .role-pill.admin { background: rgba(201,168,76,0.12); color: var(--gold-400); border: 1px solid rgba(201,168,76,0.25); }
  .role-pill.manager { background: rgba(61,184,122,0.1); color: var(--green-400); border: 1px solid rgba(61,184,122,0.25); }
  .role-pill.employee { background: rgba(46,72,128,0.3); color: var(--slate-300); border: 1px solid rgba(46,72,128,0.5); }

  /* ── Edit Button ── */
  .edit-profile-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 10px;
    background: transparent;
    border: 1px solid rgba(201,168,76,0.35);
    color: var(--gold-400);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.25s;
  }
  .edit-profile-btn:hover {
    background: rgba(201,168,76,0.08);
    border-color: var(--gold-400);
    box-shadow: 0 0 20px rgba(201,168,76,0.15);
  }

  /* ── Main Layout ── */
  .profile-body {
    max-width: 1100px;
    margin: 24px auto 60px;
    padding: 0 32px;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 20px;
  }

  @media (max-width: 900px) {
    .profile-body { grid-template-columns: 1fr; }
  }

  /* ── Cards ── */
  .card {
    background: var(--navy-900);
    border: 1px solid rgba(201,168,76,0.1);
    border-radius: 16px;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--ivory-100);
    letter-spacing: 0.01em;
  }

  .card-body { padding: 24px; }

  /* ── Detail Grid ── */
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  @media (max-width: 600px) {
    .detail-grid { grid-template-columns: 1fr; }
  }

  .detail-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    border-right: 1px solid rgba(255,255,255,0.04);
    transition: background 0.2s;
  }
  .detail-item:hover { background: rgba(201,168,76,0.03); }
  .detail-item:nth-child(2n) { border-right: none; }
  .detail-item:nth-last-child(-n+2) { border-bottom: none; }

  .detail-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold-500);
    flex-shrink: 0;
  }

  .detail-label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--slate-400);
    margin-bottom: 4px;
    font-weight: 500;
  }

  .detail-value {
    font-size: 14px;
    color: var(--ivory-200);
    font-weight: 400;
  }

  /* ── Activity Feed ── */
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    position: relative;
  }
  .activity-item:last-child { border-bottom: none; padding-bottom: 0; }

  .activity-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .activity-icon.expense { background: rgba(245,158,11,0.12); color: var(--amber-400); }
  .activity-icon.trip    { background: rgba(46,72,128,0.4); color: var(--slate-300); }
  .activity-icon.approval{ background: rgba(61,184,122,0.12); color: var(--green-400); }

  .activity-action { font-size: 13px; color: var(--ivory-200); font-weight: 500; }
  .activity-subject { font-size: 13px; color: var(--slate-300); margin-top: 2px; }
  .activity-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }
  .activity-date { font-size: 11px; color: var(--slate-400); }
  .activity-amount {
    font-size: 12px;
    font-weight: 600;
    color: var(--gold-400);
    background: rgba(201,168,76,0.08);
    padding: 2px 8px;
    border-radius: 100px;
  }

  /* ── Stats sidebar ── */
  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .stat-row:last-child { border-bottom: none; }
  .stat-label { font-size: 13px; color: var(--slate-400); }
  .stat-value { font-size: 20px; font-weight: 600; font-family: 'Playfair Display', serif; color: var(--ivory-100); }
  .stat-value.gold { color: var(--gold-400); }
  .stat-value.green { color: var(--green-400); }

  /* ── Edit Form ── */
  .edit-form { padding: 24px; }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-group label {
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--slate-400);
    font-weight: 500;
  }

  .form-group input {
    background: rgba(7,12,24,0.5);
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 10px;
    padding: 11px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--ivory-100);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-group input:focus {
    border-color: var(--gold-500);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
  }
  .form-group input::placeholder { color: var(--slate-400); }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 22px;
    background: linear-gradient(135deg, var(--gold-500), var(--gold-400));
    color: var(--navy-950);
    border: none;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.35); }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 18px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--slate-300);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { border-color: rgba(255,255,255,0.2); color: var(--ivory-100); background: rgba(255,255,255,0.04); }

  /* ── Status indicator ── */
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--green-400);
    box-shadow: 0 0 8px rgba(61,184,122,0.6);
    display: inline-block;
    margin-right: 6px;
  }

  /* ── Loading / Error ── */
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--navy-950);
    color: var(--ivory-100);
    font-family: 'DM Sans', sans-serif;
    gap: 16px;
  }

  .loading-spinner {
    width: 40px; height: 40px;
    border: 2px solid rgba(201,168,76,0.2);
    border-top-color: var(--gold-500);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .back-btn {
    padding: 10px 22px;
    border-radius: 10px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.25);
    color: var(--gold-400);
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
  }

  /* ── Divider line ── */
  .gold-line {
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, var(--gold-500), transparent);
    margin: 2px 0 16px;
  }
`;

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
      <style>{styles}</style>
      <div className="loading-spinner" />
      <p style={{ color: 'var(--slate-400)', fontSize: 13 }}>Loading profile…</p>
    </div>
  );

  if (error || !profile) return (
    <div className="error-container">
      <style>{styles}</style>
      <h2 style={{ fontFamily: 'Playfair Display, serif' }}>Profile Unavailable</h2>
      <p style={{ color: 'var(--slate-400)' }}>{error || 'Profile not found'}</p>
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
      <style>{styles}</style>

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
          {/* Avatar */}
          <div className="avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            {isOwnProfile && (
              <button className="avatar-edit-btn" title="Change photo">
                <Camera size={12} />
              </button>
            )}
          </div>

          {/* Name row */}
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
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contact & Info Card */}
          <motion.div className="card" variants={fadeUp}>
            <div className="card-header">
              <span className="card-title">Contact & Information</span>
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
                      { icon: Mail,      label: 'Email',       value: profile.user?.email },
                      { icon: Phone,     label: 'Phone',       value: profile.phone || 'Not provided' },
                      { icon: Building2, label: 'Department',  value: profile.department },
                      { icon: Briefcase, label: 'Position',    value: profile.position },
                      { icon: Calendar,  label: 'Member Since',value: profile.hire_date ? formatDate(profile.hire_date) : 'N/A' },
                      { icon: MapPin,    label: 'Location',    value: profile.location || 'Head Office' },
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
              <Activity size={15} style={{ color: 'var(--slate-400)' }} />
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
                    <ChevronRight size={14} style={{ color: 'var(--slate-400)', marginTop: 2 }} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Right column (stats sidebar) ── */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} variants={fadeUp}>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Stats</span>
            </div>
            <div className="card-body">
              <div className="gold-line" />
              {[
                { label: 'Trips this year',      value: '12',      cls: '' },
                { label: 'Expenses submitted',   value: '47',      cls: 'gold' },
                { label: 'Pending approvals',    value: '3',       cls: '' },
                { label: 'Total reimbursed',     value: '€8,240',  cls: 'green' },
              ].map(({ label, value, cls }) => (
                <div className="stat-row" key={label}>
                  <span className="stat-label">{label}</span>
                  <span className={`stat-value ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account card */}
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
                  <span style={{ fontSize: 13, color: 'var(--ivory-200)', fontWeight: 500 }}>{value}</span>
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