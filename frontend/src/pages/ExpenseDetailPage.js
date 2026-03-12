// frontend/src/pages/ExpenseDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';  // Add AnimatePresence here
import { 
  ArrowLeft, Edit, Trash2, Download, CheckCircle, 
  XCircle, Clock, User, Calendar, Tag, FileText,
  DollarSign, Building2, Paperclip, MessageCircle,
  History, Printer, Share2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authAxios, user } = useAuth();
  
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    fetchExpenseDetail();
    fetchComments();
    fetchActivityLog();
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

  const fetchComments = async () => {
    try {
      const response = await authAxios.get(`/expenses/${id}/comments/`);
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const response = await authAxios.get(`/expenses/${id}/activity/`);
      setActivityLog(response.data);
    } catch (err) {
      console.error('Error fetching activity log:', err);
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

  const handleApprove = async () => {
    try {
      await authAxios.post(`/expenses/${id}/approve/`);
      setShowApproveModal(false);
      fetchExpenseDetail();
      fetchActivityLog();
    } catch (err) {
      console.error('Error approving expense:', err);
      alert('Failed to approve expense.');
    }
  };

  const handleReject = async () => {
    try {
      await authAxios.post(`/expenses/${id}/reject/`, { reason: rejectionReason });
      setShowRejectModal(false);
      setRejectionReason('');
      fetchExpenseDetail();
      fetchActivityLog();
    } catch (err) {
      console.error('Error rejecting expense:', err);
      alert('Failed to reject expense.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await authAxios.post(`/expenses/${id}/comments/`, {
        text: newComment
      });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment.');
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await authAxios.get(`/expenses/${id}/receipt/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${expense.subject}-${expense.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt.');
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canApprove = () => {
    return user?.role === 'admin' || user?.role === 'manager';
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
        <AlertCircle size={48} className="error-icon" />
        <h2>Error</h2>
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
          {expense.status?.toLowerCase() === 'pending' && canApprove() && (
            <>
              <button 
                className="action-button approve"
                onClick={() => setShowApproveModal(true)}
              >
                <CheckCircle size={18} />
                <span>Approve</span>
              </button>
              <button 
                className="action-button reject"
                onClick={() => setShowRejectModal(true)}
              >
                <XCircle size={18} />
                <span>Reject</span>
              </button>
            </>
          )}
          
          <button 
            className="action-button edit" 
            onClick={() => navigate(`/expenses/${id}/edit`)}
          >
            <Edit size={18} />
            <span>Edit</span>
          </button>
          
          <button 
            className="action-button delete" 
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
          
          {expense.receipt_file && (
            <button 
              className="action-button download"
              onClick={handleDownloadReceipt}
            >
              <Download size={18} />
              <span>Receipt</span>
            </button>
          )}
          
          <button className="action-button print">
            <Printer size={18} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        <div className="detail-grid">
          {/* Left Column - Main Info */}
          <motion.div 
            className="detail-card main-card"
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
                  <span>{expense.team || 'N/A'}</span>
                </div>
              </div>

              <div className="detail-item">
                <Tag className="detail-icon" />
                <div className="detail-info">
                  <label>Category</label>
                  <span className="category-tag">{expense.category || 'Other'}</span>
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

            {/* Approver Info */}
            {expense.approved_by && (
              <div className="approver-info">
                <CheckCircle size={16} />
                <span>Approved by {expense.approved_by} on {formatDate(expense.approved_at)}</span>
              </div>
            )}

            {expense.rejected_by && (
              <div className="rejecter-info">
                <XCircle size={16} />
                <span>Rejected by {expense.rejected_by} on {formatDate(expense.rejected_at)}</span>
                {expense.rejection_reason && (
                  <p className="rejection-reason">Reason: {expense.rejection_reason}</p>
                )}
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

          {/* Right Column - Receipt and Comments */}
          <div className="detail-sidebar">
            {/* Receipt Section */}
            {expense.receipt_file && (
              <motion.div 
                className="detail-card receipt-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="sidebar-title">
                  <Paperclip size={18} />
                  Attached Receipt
                </h3>
                <div className="receipt-preview">
                  {expense.receipt_file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img 
                      src={expense.receipt_file} 
                      alt="Receipt" 
                      className="receipt-image"
                    />
                  ) : (
                    <div className="receipt-placeholder">
                      <FileText size={48} />
                      <p>Receipt file</p>
                    </div>
                  )}
                  <div className="receipt-actions">
                    <button className="btn-secondary" onClick={handleDownloadReceipt}>
                      <Download size={16} /> Download
                    </button>
                    {expense.receipt_file.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <button className="btn-secondary">
                        <Share2 size={16} /> View
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Comments Section */}
            <motion.div 
              className="detail-card comments-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div 
                className="sidebar-title clickable"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle size={18} />
                Comments ({comments.length})
              </div>

              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <form onSubmit={handleAddComment} className="comment-form">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows="2"
                      />
                      <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
                        Post Comment
                      </button>
                    </form>

                    <div className="comments-list">
                      {comments.length > 0 ? (
                        comments.map(comment => (
                          <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                              <span className="comment-author">{comment.author}</span>
                              <span className="comment-time">{formatDate(comment.created_at)}</span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="no-comments">No comments yet</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Activity Log */}
            <motion.div 
              className="detail-card activity-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <h3 className="sidebar-title">
                <History size={18} />
                Activity Log
              </h3>
              <div className="activity-list">
                {activityLog.length > 0 ? (
                  activityLog.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <p className="activity-text">{activity.action}</p>
                        <span className="activity-time">{formatDate(activity.timestamp)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-activity">No activity recorded</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div 
              className="modal-content delete-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <AlertCircle size={48} className="modal-icon warning" />
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowApproveModal(false)}
          >
            <motion.div 
              className="modal-content approve-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <CheckCircle size={48} className="modal-icon success" />
              <h2>Approve Expense</h2>
              <p>Are you sure you want to approve "{expense.subject}" for €{parseFloat(expense.amount).toFixed(2)}?</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowApproveModal(false)}>
                  Cancel
                </button>
                <button className="btn-success" onClick={handleApprove}>
                  Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div 
              className="modal-content reject-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <XCircle size={48} className="modal-icon error" />
              <h2>Reject Expense</h2>
              <p>Are you sure you want to reject "{expense.subject}"?</p>
              
              <div className="form-group">
                <label>Reason for rejection *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows="3"
                  required
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-danger" 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExpenseDetailPage;