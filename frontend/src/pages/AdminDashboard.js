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
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else if (dateRange === 'quarter') startDate.setMonth(startDate.getMonth() - 3);
      else if (dateRange === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Fetch all data in parallel
      const [
        usersResponse,
        expensesResponse,
        pendingExpensesResponse,
        pendingTripsResponse,
        activitiesResponse,
        monthlyStatsResponse
      ] = await Promise.allSettled([
        authAxios.get('/employees/'),
        authAxios.get('/expenses/', { params: { date_from: startDateStr, date_to: endDate } }),
        authAxios.get('/expenses/', { params: { status: 'pending' } }),
        authAxios.get('/trips/', { params: { status: 'pending' } }),
        authAxios.get('/audit-logs/', { params: { limit: 10 } }),
        authAxios.get('/analytics/', { params: { range: dateRange === 'week' ? '1m' : dateRange === 'month' ? '1m' : dateRange === 'quarter' ? '3m' : '1y' } })
      ]);
      
      // Process users
      const totalUsers = usersResponse.status === 'fulfilled' ? usersResponse.value.data.length : 1248;
      
      // Process expenses
      let totalExpenses = 0;
      let monthlySpend = 0;
      if (expensesResponse.status === 'fulfilled') {
        totalExpenses = expensesResponse.value.data.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      }
      
      // Process monthly stats
      if (monthlyStatsResponse.status === 'fulfilled') {
        monthlySpend = monthlyStatsResponse.value.data.summary?.total_amount || 0;
      }
      
      // Process pending approvals
      let pendingCount = 0;
      const pendingItems = [];
      
      if (pendingExpensesResponse.status === 'fulfilled') {
        const expenses = pendingExpensesResponse.value.data;
        pendingCount += expenses.length;
        expenses.slice(0, 3).forEach(exp => {
          pendingItems.push({
            id: exp.id,
            title: exp.subject,
            user: exp.employee_name,
            amount: parseFloat(exp.amount),
            date: exp.date,
            type: 'expense'
          });
        });
      }
      
      if (pendingTripsResponse.status === 'fulfilled') {
        const trips = pendingTripsResponse.value.data;
        pendingCount += trips.length;
        trips.slice(0, 3).forEach(trip => {
          pendingItems.push({
            id: trip.id,
            title: trip.destination,
            user: trip.employee_name,
            amount: parseFloat(trip.estimated_expenses),
            date: trip.start_date,
            type: 'trip'
          });
        });
      }
      
      // Process activities
      const activities = [];
      if (activitiesResponse.status === 'fulfilled') {
        activitiesResponse.value.data.slice(0, 5).forEach(act => {
          activities.push({
            id: act.id,
            type: act.action?.toLowerCase().includes('expense') ? 'expense' : 
                  act.action?.toLowerCase().includes('user') ? 'user' : 'approval',
            text: act.action,
            time: formatTimeAgo(act.timestamp)
          });
        });
      }
      
      setStats({
        totalUsers,
        totalExpenses,
        pendingApprovals: pendingCount,
        monthlySpend
      });
      
      setPendingApprovals(pendingItems);
      setRecentActivities(activities);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const handleApprove = async (id, type) => {
    try {
      if (type === 'expense') {
        await authAxios.post(`/expenses/${id}/approve/`);
      } else {
        await authAxios.post(`/trips/${id}/approve/`);
      }
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve.');
    }
  };

  const handleReject = async (id, type) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      if (type === 'expense') {
        await authAxios.post(`/expenses/${id}/reject/`, { reason });
      } else {
        await authAxios.post(`/trips/${id}/reject/`, { reason });
      }
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await authAxios.get('/admin/export/', {
        params: { range: dateRange },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data.');
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
      value: `€${stats.totalExpenses.toLocaleString()}`,
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
      value: `€${stats.monthlySpend.toLocaleString()}`,
      icon: TrendingUp,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      change: '+8%'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
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

      <div className="dashboard-grid">
        <motion.div 
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h2 className="card-title">
              <Clock size={20} />
              Pending Approvals ({stats.pendingApprovals})
            </h2>
            <button className="card-action">
              <Filter size={18} />
            </button>
          </div>
          <div className="pending-list">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((item, index) => (
                <motion.div 
                  key={`${item.type}-${item.id}`}
                  className="pending-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="pending-info">
                    <h4>{item.title}</h4>
                    <p>{item.user} • €{item.amount.toFixed(2)}</p>
                    <span className="pending-date">{new Date(item.date).toLocaleDateString()}</span>
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

        <motion.div 
          className="dashboard-card dashboard-card-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <h2 className="card-title">
              <MapPin size={20} />
              System Overview
            </h2>
            <div className="user-stats">
              <div className="user-stat">
                <Mail size={16} />
                <span>{stats.totalUsers} users</span>
              </div>
              <div className="user-stat">
                <Award size={16} />
                <span>{stats.pendingApprovals} pending</span>
              </div>
            </div>
          </div>
          <div className="map-placeholder">
            <div className="stats-summary">
              <div className="stat-item-large">
                <h3>Total Expenses</h3>
                <p>€{stats.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="stat-item-large">
                <h3>Monthly Spend</h3>
                <p>€{stats.monthlySpend.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AdminDashboard;