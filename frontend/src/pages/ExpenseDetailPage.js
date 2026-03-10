// frontend/src/pages/ExpenseDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Trash2, Download, CheckCircle, 
  XCircle, Clock, User, Calendar, Tag, FileText,
  DollarSign, Building2, Paperclip
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchExpenseDetail();
  }, [id]);

  const fetchExpenseDetail = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/expenses/${id}/`);
      setExpense(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expense:', err);
      setError('Failed to load expense details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await authAxios.delete(`/expenses/${id}/`);
      navigate('/expenses');
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="status-icon approved" />;
      case 'rejected': return <XCircle className="status-icon rejected" />;
      default: return <Clock className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    return status?.toLowerCase() || 'pending';
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
        <p>Loading expense details...</p>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error || 'Expense not found'}</p>
        <button onClick={() => navigate('/expenses')} className="back-btn">
          <ArrowLeft size={16} /> Back to Expenses
        </button>
      </div>
    );
  }

  return (
    <div className="expense-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/expenses')}>
          <ArrowLeft size={20} />
          <span>Back to Expenses</span>
        </button>
        
        <div className="header-actions">
          <button className="action-button edit" onClick={() => navigate(`/expenses/${id}/edit`)}>
            <Edit size={18} />
            <span>Edit</span>
          </button>
          <button className="action-button delete" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
          <button className="action-button download">
            <Download size={18} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        <motion.div 
          className="detail-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Status Banner */}
          <div className={`status-banner ${getStatusClass(expense.status)}`}>
            {getStatusIcon(expense.status)}
            <span>{expense.status || 'Pending'}</span>
          </div>

          {/* Title Section */}
          <div className="title-section">
            <h1>{expense.subject}</h1>
            <p className="description">{expense.description || 'No description provided'}</p>
          </div>

          {/* Details Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <DollarSign className="detail-icon" />
              <div className="detail-info">
                <label>Amount</label>
                <span className="amount">€{parseFloat(expense.amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="detail-item">
              <User className="detail-icon" />
              <div className="detail-info">
                <label>Employee</label>
                <span>{expense.employee_name || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-item">
              <Building2 className="detail-icon" />
              <div className="detail-info">
                <label>Team</label>
                <span>{expense.team_name || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-item">
              <Tag className="detail-icon" />
              <div className="detail-info">
                <label>Category</label>
                <span>{expense.category_name || 'Other'}</span>
              </div>
            </div>

            <div className="detail-item">
              <Calendar className="detail-icon" />
              <div className="detail-info">
                <label>Date</label>
                <span>{formatDate(expense.date)}</span>
              </div>
            </div>

            <div className="detail-item">
              <FileText className="detail-icon" />
              <div className="detail-info">
                <label>Status</label>
                <span className={`status-text ${expense.status?.toLowerCase()}`}>
                  {expense.status}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Section */}
          {expense.receipt_file && (
            <div className="receipt-section">
              <h3>
                <Paperclip size={18} />
                Attached Receipt
              </h3>
              <div className="receipt-preview">
                <img 
                  src={expense.receipt_file} 
                  alt="Receipt" 
                  className="receipt-image"
                />
                <div className="receipt-actions">
                  <button className="btn-secondary">
                    <Download size={16} /> Download
                  </button>
                  <button className="btn-secondary">View Full Size</button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="metadata-section">
            <p className="metadata">
              Created: {formatDate(expense.created_at)} 
              {expense.updated_at !== expense.created_at && 
                ` • Updated: ${formatDate(expense.updated_at)}`
              }
            </p>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-content delete-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2>Delete Expense</h2>
            <p>Are you sure you want to delete "{expense.subject}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ExpenseDetailPage;