// frontend/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Award,
  Filter
} from 'lucide-react';
import { useAuth, authAxios } from '../contexts/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    pendingApprovals: 0,
    monthlySpend: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes, pendingRes] = await Promise.all([
        authAxios.get('/admin/stats/'),
        authAxios.get('/admin/recent-activities/'),
        authAxios.get('/admin/pending-approvals/')
      ]);
      
      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data);
      setPendingApprovals(pendingRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, type) => {
    try {
      await authAxios.post(`/admin/approve/${type}/${id}/`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (id, type) => {
    try {
      await authAxios.post(`/admin/reject/${type}/${id}/`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await authAxios.get('/admin/export/', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expense-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: '#4361ee',
      bgColor: 'rgba(67, 97, 238, 0.1)',
      change: '+12%'
    },
    {
      title: 'Total Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      icon: DollarSign,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      change: '+23%'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      change: '-5%'
    },
    {
      title: 'Monthly Spend',
      value: `$${stats.monthlySpend.toLocaleString()}`,
      icon: TrendingUp,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      change: '+8%'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="admin-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.first_name || 'Admin'}! Here's what's happening with your platform.
          </p>
        </div>
        <div className="dashboard-actions">
          <select 
            className="dashboard-date-filter"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <motion.button 
            className="dashboard-export-btn"
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={18} />
            Export Report
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <h3 className="stat-title">{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change" style={{ color: stat.change.startsWith('+') ? '#10b981' : '#ef4444' }}>
                  {stat.change} from last period
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Pending Approvals */}
        <motion.div 
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h2 className="card-title">
              <Clock size={20} />
              Pending Approvals
            </h2>
            <button className="card-action">
              <Filter size={18} />
            </button>
          </div>
          <div className="pending-list">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((item, index) => (
                <motion.div 
                  key={item.id}
                  className="pending-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="pending-info">
                    <h4>{item.title}</h4>
                    <p>{item.user} • ${item.amount}</p>
                    <span className="pending-date">{item.date}</span>
                  </div>
                  <div className="pending-actions">
                    <motion.button 
                      className="pending-approve"
                      onClick={() => handleApprove(item.id, item.type)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </motion.button>
                    <motion.button 
                      className="pending-reject"
                      onClick={() => handleReject(item.id, item.type)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Reject"
                    >
                      <XCircle size={18} />
                    </motion.button>
                    <motion.button 
                      className="pending-more"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="More options"
                    >
                      <MoreVertical size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state">
                <CheckCircle size={48} className="empty-icon" />
                <p>No pending approvals</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div 
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <h2 className="card-title">
              <Activity size={20} />
              Recent Activities
            </h2>
          </div>
          <div className="activities-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <motion.div 
                  key={activity.id}
                  className="activity-item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'expense' && <DollarSign size={16} />}
                    {activity.type === 'user' && <Users size={16} />}
                    {activity.type === 'approval' && <CheckCircle size={16} />}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{activity.text}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state">
                <Activity size={48} className="empty-icon" />
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* User Activity Map */}
        <motion.div 
          className="dashboard-card dashboard-card-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <h2 className="card-title">
              <MapPin size={20} />
              User Activity Map
            </h2>
            <div className="user-stats">
              <div className="user-stat">
                <Mail size={16} />
                <span>128 active</span>
              </div>
              <div className="user-stat">
                <Phone size={16} />
                <span>24 calls</span>
              </div>
              <div className="user-stat">
                <Award size={16} />
                <span>12 new</span>
              </div>
            </div>
          </div>
          <div className="map-placeholder">
            <div className="map-grid">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="map-dot" />
              ))}
            </div>
            <p className="map-text">Interactive map will be displayed here</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminDashboard;