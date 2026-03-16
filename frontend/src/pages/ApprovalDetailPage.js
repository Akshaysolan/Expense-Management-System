import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, 
  User, Calendar, DollarSign, FileText,
  MessageSquare, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authAxios, user } = useAuth();
  
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [type, setType] = useState('expense'); // 'expense' or 'trip'

  useEffect(() => {
    // Determine if it's expense or trip based on URL pattern or ID format
    const pathParts = window.location.pathname.split('/');
    const itemType = pathParts[1]; // 'expenses' or 'trips'
    setType(itemType === 'expenses' ? 'expense' : 'trip');
    fetchApprovalDetail();
  }, [id]);

  const fetchApprovalDetail = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'expense' ? `/expenses/${id}/` : `/trips/${id}/`;
      const response = await authAxios.get(endpoint);
      
      // Format data based on type
      if (type === 'expense') {
        setApproval({
          id: response.data.id,
          type: 'Expense',
          subject: response.data.subject,
          employee: response.data.employee_name,
          amount: parseFloat(response.data.amount),
          date: response.data.date,
          submittedDate: response.data.created_at,
          description: response.data.description,
          status: response.data.status,
          comments: response.data.comments || [],
          attachments: response.data.receipt_file ? [response.data.receipt_file] : []
        });
      } else {
        setApproval({
          id: response.data.id,
          type: 'Trip',
          subject: response.data.destination,
          employee: response.data.employee_name,
          amount: parseFloat(response.data.estimated_expenses),
          date: response.data.start_date,
          submittedDate: response.data.created_at,
          description: response.data.purpose,
          status: response.data.status,
          comments: response.data.comments || [],
          attachments: []
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching approval:', err);
      setError('Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const endpoint = type === 'expense' 
        ? `/expenses/${id}/comments/` 
        : `/trips/${id}/comments/`;
      const response = await authAxios.get(endpoint);
      setApproval(prev => ({ ...prev, comments: response.data }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const endpoint = type === 'expense' 
        ? `/expenses/${id}/approve/` 
        : `/trips/${id}/approve/`;
      await authAxios.post(endpoint);
      navigate('/approvals');
    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    try {
      const endpoint = type === 'expense' 
        ? `/expenses/${id}/reject/` 
        : `/trips/${id}/reject/`;
      await authAxios.post(endpoint, { reason: comment });
      navigate('/approvals');
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Failed to reject.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      const endpoint = type === 'expense' 
        ? `/expenses/${id}/comments/` 
        : `/trips/${id}/comments/`;
      const response = await authAxios.post(endpoint, { text: comment });
      setApproval(prev => ({
        ...prev,
        comments: [response.data, ...(prev?.comments || [])]
      }));
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="status-icon approved" size={24} />;
      case 'rejected': return <XCircle className="status-icon rejected" size={24} />;
      default: return <Clock className="status-icon pending" size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading details...</p>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="error-container">
        <AlertCircle size={48} />
        <h2>Error</h2>
        <p>{error || 'Item not found'}</p>
        <button onClick={() => navigate('/approvals')} className="back-btn">
          <ArrowLeft size={16} /> Back to Approvals
        </button>
      </div>
    );
  }

  return (
    <div className="approval-detail-page">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/approvals')}>
          <ArrowLeft size={20} />
          <span>Back to Approvals</span>
        </button>
      </div>

      <div className="detail-content">
        <motion.div 
          className="detail-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`status-banner ${approval.status.toLowerCase()}`}>
            {getStatusIcon(approval.status)}
            <span>{approval.status}</span>
          </div>

          <div className="title-section">
            <h1>{approval.subject}</h1>
            <span className="approval-type-badge">{approval.type}</span>
          </div>

          <div className="two-column-layout">
            <div className="left-column">
              <div className="details-section">
                <h3>Details</h3>
                
                <div className="detail-item">
                  <User size={18} />
                  <div>
                    <label>Employee</label>
                    <span>{approval.employee}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <DollarSign size={18} />
                  <div>
                    <label>Amount</label>
                    <span className="amount">€{approval.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <Calendar size={18} />
                  <div>
                    <label>Date</label>
                    <span>{formatDate(approval.date)}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <Calendar size={18} />
                  <div>
                    <label>Submitted</label>
                    <span>{formatDate(approval.submittedDate)}</span>
                  </div>
                </div>
              </div>

              <div className="description-section">
                <h3>Description</h3>
                <p>{approval.description}</p>
              </div>

              {approval.attachments?.length > 0 && (
                <div className="attachments-section">
                  <h3>Attachments</h3>
                  <div className="attachment-list">
                    {approval.attachments.map((att, idx) => (
                      <div key={idx} className="attachment-item">
                        <FileText size={16} />
                        <span>{att.split('/').pop()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="right-column">
              {approval.status === 'pending' && (
                <div className="action-section">
                  <h3>Actions</h3>
                  
                  <textarea
                    className="comment-input"
                    placeholder="Add comments or rejection reason..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="3"
                  />

                  <div className="action-buttons">
                    <button 
                      className="approve-button"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      <CheckCircle size={18} />
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    
                    <button 
                      className="reject-button"
                      onClick={handleReject}
                      disabled={processing || !comment.trim()}
                    >
                      <XCircle size={18} />
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>

                  <button 
                    className="add-comment-button"
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                  >
                    <MessageSquare size={16} />
                    Add Comment
                  </button>
                </div>
              )}

              <div className="comments-section">
                <h3>Comments & History</h3>
                
                {approval.comments?.length === 0 ? (
                  <p className="no-comments">No comments yet</p>
                ) : (
                  <div className="comments-list">
                    {approval.comments?.map(com => (
                      <div key={com.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">{com.author || com.user}</span>
                          <span className="comment-date">{formatDate(com.created_at)}</span>
                        </div>
                        <p className="comment-text">{com.text || com.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ApprovalDetailPage;