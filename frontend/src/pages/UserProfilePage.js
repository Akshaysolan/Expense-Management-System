// frontend/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Building2, Calendar,
  Edit2, Save, X, Camera, Award, Clock,
  CheckCircle, XCircle, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    fetchUserProfile();
    fetchUserActivity();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // If userId is 'me' or matches current user, use profile endpoint
      if (userId === 'me' || parseInt(userId) === currentUser?.id) {
        const response = await authAxios.get('/auth/profile/');
        setProfile(response.data);
        setEditedProfile(response.data);
      } else {
        const response = await authAxios.get(`/employees/${userId}/`);
        setProfile(response.data.employee);
        setEditedProfile(response.data.employee);
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
      // Mock data - replace with actual API call
      setRecentActivity([
        { id: 1, type: 'expense', action: 'Submitted expense', subject: 'Business Lunch', amount: 75.50, date: '2026-04-08' },
        { id: 2, type: 'trip', action: 'Created trip', subject: 'London Conference', date: '2026-04-07' },
        { id: 3, type: 'approval', action: 'Approved expense', subject: 'Office Supplies', date: '2026-04-06' },
      ]);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const response = await authAxios.patch('/auth/profile/update/', editedProfile);
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile.');
    }
  };

  const handleChange = (e) => {
    setEditedProfile({
      ...editedProfile,
      [e.target.name]: e.target.value
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error || 'Profile not found'}</p>
        <button onClick={() => navigate(-1)} className="back-btn">
          Go Back
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id || userId === 'me';

  return (
    <div className="profile-page">
      {/* Cover Photo */}
      <div className="profile-cover">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {profile.user?.first_name?.charAt(0)}{profile.user?.last_name?.charAt(0)}
          </div>
          {isOwnProfile && (
            <button className="avatar-edit-btn">
              <Camera size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-header">
          <div>
            <h1>{profile.user?.first_name} {profile.user?.last_name}</h1>
            <p className="profile-title">{profile.position} • {profile.department}</p>
            <p className="profile-id">Employee ID: {profile.employee_id}</p>
          </div>
          
          {isOwnProfile && !isEditing && (
            <button className="edit-profile-btn" onClick={handleEdit}>
              <Edit2 size={16} />
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <motion.div 
            className="profile-edit-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Edit Profile</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editedProfile.user?.first_name || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editedProfile.user?.last_name || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={editedProfile.user?.email || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={editedProfile.phone || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={editedProfile.position || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleCancel}>
                <X size={16} /> Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="profile-details">
            <div className="detail-grid">
              <div className="detail-item">
                <Mail className="detail-icon" />
                <div>
                  <label>Email</label>
                  <span>{profile.user?.email}</span>
                </div>
              </div>

              <div className="detail-item">
                <Phone className="detail-icon" />
                <div>
                  <label>Phone</label>
                  <span>{profile.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="detail-item">
                <Building2 className="detail-icon" />
                <div>
                  <label>Department</label>
                  <span>{profile.department}</span>
                </div>
              </div>

              <div className="detail-item">
                <Award className="detail-icon" />
                <div>
                  <label>Role</label>
                  <span className="role-badge">{profile.role}</span>
                </div>
              </div>

              <div className="detail-item">
                <Calendar className="detail-icon" />
                <div>
                  <label>Member Since</label>
                  <span>{profile.hire_date ? formatDate(profile.hire_date) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                {activity.type === 'expense' && <DollarSign size={16} />}
                {activity.type === 'trip' && <Calendar size={16} />}
                {activity.type === 'approval' && <CheckCircle size={16} />}
                
                <div className="activity-content">
                  <p>
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-subject">{activity.subject}</span>
                    {activity.amount && <span className="activity-amount">€{activity.amount}</span>}
                  </p>
                  <span className="activity-date">{formatDate(activity.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;