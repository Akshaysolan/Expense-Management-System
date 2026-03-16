import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function ApprovalsPage() {
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/expenses/?status=pending');
      // Also fetch pending trips
      const tripsResponse = await authAxios.get('/trips/?status=pending');
      
      // Combine and format data
      const expenseApprovals = response.data.map(exp => ({
        id: exp.id,
        type: 'Expense',
        subject: exp.subject,
        employee: exp.employee_name,
        amount: parseFloat(exp.amount),
        date: exp.date,
        status: exp.status
      }));
      
      const tripApprovals = tripsResponse.data.map(trip => ({
        id: trip.id,
        type: 'Trip',
        subject: trip.destination,
        employee: trip.employee_name,
        amount: parseFloat(trip.estimated_expenses),
        date: trip.start_date,
        status: trip.status
      }));
      
      setApprovals([...expenseApprovals, ...tripApprovals]);
      setError(null);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError('Failed to load approvals.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, type) => {
    try {
      if (type === 'Expense') {
        await authAxios.post(`/expenses/${id}/approve/`);
      } else {
        await authAxios.post(`/trips/${id}/approve/`);
      }
      fetchApprovals(); // Refresh list
    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve.');
    }
  };

  const handleReject = async (id, type) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      if (type === 'Expense') {
        await authAxios.post(`/expenses/${id}/reject/`, { reason });
      } else {
        await authAxios.post(`/trips/${id}/reject/`, { reason });
      }
      fetchApprovals(); // Refresh list
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject.');
    }
  };

  const filteredApprovals = approvals.filter(item => {
    if (filter === 'all') return true;
    return item.status.toLowerCase() === filter.toLowerCase();
  });

  const pendingCount = approvals.filter(item => item.status === 'pending').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchApprovals} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Approvals</h1>
        <div className="approval-stats">
          <span className="pending-badge">Pending: {pendingCount}</span>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({approvals.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({approvals.filter(a => a.status === 'pending').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({approvals.filter(a => a.status === 'approved').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({approvals.filter(a => a.status === 'rejected').length})
        </button>
      </div>

      <div className="approvals-list">
        {filteredApprovals.length > 0 ? (
          filteredApprovals.map(item => (
            <motion.div 
              key={`${item.type}-${item.id}`} 
              className={`approval-card status-${item.status.toLowerCase()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="approval-header">
                <span className="approval-type">{item.type}</span>
                <span className={`approval-status ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
              <div className="approval-body">
                <h3>{item.subject}</h3>
                <p>Employee: {item.employee}</p>
                <p>Amount: €{item.amount.toFixed(2)}</p>
                <p>Date: {new Date(item.date).toLocaleDateString()}</p>
              </div>
              {item.status === 'pending' && (
                <div className="approval-actions">
                  <button className="btn-approve" onClick={() => handleApprove(item.id, item.type)}>
                    <FaCheck /> Approve
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(item.id, item.type)}>
                    <FaTimes /> Reject
                  </button>
                  <button className="btn-view" onClick={() => navigate(`/${item.type === 'Expense' ? 'expenses' : 'trips'}/${item.id}`)}>
                    <FaEye /> View
                  </button>
                </div>
              )}
              {item.status !== 'pending' && (
                <div className="approval-footer">
                  <button className="btn-view" onClick={() => navigate(`/${item.type === 'Expense' ? 'expenses' : 'trips'}/${item.id}`)}>
                    <FaEye /> View Details
                  </button>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <p>No approvals found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalsPage;