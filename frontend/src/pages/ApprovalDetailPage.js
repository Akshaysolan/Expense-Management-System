// frontend/src/pages/ApprovalDetailPage.js
import React, { useState } from 'react';
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
  
  const [approval, setApproval] = useState({
    id: parseInt(id),
    type: 'Expense',
    subject: 'Business Lunch with Client',
    employee: 'Sarah Jade',
    employeeId: 3,
    amount: 75.50,
    date: '2026-04-08',
    submittedDate: '2026-04-07',
    description: 'Lunch meeting with potential client to discuss new project opportunity.',
    status: 'Pending',
    comments: [],
    attachments: []
  });

  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      // API call would go here
      setApproval(prev => ({ ...prev, status: 'Approved' }));
      setTimeout(() => navigate('/approvals'), 1500);
    } catch (error) {
      console.error('Error approving:', error);
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
      // API call would go here
      setApproval(prev => ({ ...prev, status: 'Rejected' }));
      setTimeout(() => navigate('/approvals'), 1500);
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    const newComment = {
      id: Date.now(),
      user: user?.full_name || 'Current User',
      text: comment,
      date: new Date().toISOString()
    };
    
    setApproval(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));
    setComment('');
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

  return (
    <div className="approval-detail-page">
      {/* Header */}
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
          {/* Status Banner */}
          <div className={`status-banner ${approval.status.toLowerCase()}`}>
            {getStatusIcon(approval.status)}
            <span>{approval.status}</span>
          </div>

          {/* Title */}
          <div className="title-section">
            <h1>{approval.subject}</h1>
            <span className="approval-type-badge">{approval.type}</span>
          </div>

          {/* Two Column Layout */}
          <div className="two-column-layout">
            {/* Left Column - Details */}
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

              {approval.attachments.length > 0 && (
                <div className="attachments-section">
                  <h3>Attachments</h3>
                  <div className="attachment-list">
                    {approval.attachments.map((att, idx) => (
                      <div key={idx} className="attachment-item">
                        <FileText size={16} />
                        <span>{att}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions & Comments */}
            <div className="right-column">
              {approval.status === 'Pending' && (
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
                
                {approval.comments.length === 0 ? (
                  <p className="no-comments">No comments yet</p>
                ) : (
                  <div className="comments-list">
                    {approval.comments.map(com => (
                      <div key={com.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">{com.user}</span>
                          <span className="comment-date">{formatDate(com.date)}</span>
                        </div>
                        <p className="comment-text">{com.text}</p>
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