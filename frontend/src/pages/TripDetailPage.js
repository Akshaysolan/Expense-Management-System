// frontend/src/pages/TripDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Trash2, Download, CheckCircle, 
  XCircle, Clock, User, Calendar, MapPin,
  DollarSign, Plane, FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchTripDetail();
  }, [id]);

  const fetchTripDetail = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/trips/${id}/`);
      setTrip(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trip:', err);
      setError('Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await authAxios.delete(`/trips/${id}/`);
      navigate('/trips');
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert('Failed to delete trip.');
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="status-icon approved" />;
      case 'rejected': return <XCircle className="status-icon rejected" />;
      case 'completed': return <CheckCircle className="status-icon completed" />;
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

  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error || 'Trip not found'}</p>
        <button onClick={() => navigate('/trips')} className="back-btn">
          <ArrowLeft size={16} /> Back to Trips
        </button>
      </div>
    );
  }

  return (
    <div className="trip-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/trips')}>
          <ArrowLeft size={20} />
          <span>Back to Trips</span>
        </button>
        
        <div className="header-actions">
          <button className="action-button edit" onClick={() => navigate(`/trips/${id}/edit`)}>
            <Edit size={18} />
            <span>Edit</span>
          </button>
          <button className="action-button delete" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
          <button className="action-button download">
            <Download size={18} />
            <span>Export</span>
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
          <div className={`status-banner ${getStatusClass(trip.status)}`}>
            {getStatusIcon(trip.status)}
            <span>{trip.status}</span>
          </div>

          {/* Title Section */}
          <div className="title-section">
            <h1>
              <Plane className="title-icon" />
              {trip.destination}
            </h1>
            <p className="purpose">{trip.purpose}</p>
          </div>

          {/* Details Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <MapPin className="detail-icon" />
              <div className="detail-info">
                <label>Destination</label>
                <span>{trip.destination}</span>
              </div>
            </div>

            <div className="detail-item">
              <User className="detail-icon" />
              <div className="detail-info">
                <label>Employee</label>
                <span>{trip.employee_name}</span>
              </div>
            </div>

            <div className="detail-item">
              <Calendar className="detail-icon" />
              <div className="detail-info">
                <label>Duration</label>
                <span>
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  <span className="duration-badge">
                    ({calculateDuration(trip.start_date, trip.end_date)} days)
                  </span>
                </span>
              </div>
            </div>

            <div className="detail-item">
              <DollarSign className="detail-icon" />
              <div className="detail-info">
                <label>Estimated Expenses</label>
                <span className="amount">€{parseFloat(trip.estimated_expenses).toFixed(2)}</span>
              </div>
            </div>

            {trip.actual_expenses > 0 && (
              <div className="detail-item">
                <DollarSign className="detail-icon" />
                <div className="detail-info">
                  <label>Actual Expenses</label>
                  <span className="amount actual">€{parseFloat(trip.actual_expenses).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="detail-item full-width">
              <FileText className="detail-icon" />
              <div className="detail-info">
                <label>Purpose</label>
                <p className="purpose-text">{trip.purpose}</p>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          {trip.expenses && trip.expenses.length > 0 && (
            <div className="expenses-section">
              <h3>Trip Expenses</h3>
              <div className="expenses-list">
                {trip.expenses.map(expense => (
                  <div key={expense.id} className="expense-item">
                    <span>{expense.subject}</span>
                    <span className="expense-amount">€{expense.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {trip.notes && (
            <div className="notes-section">
              <h3>Notes</h3>
              <p>{trip.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="metadata-section">
            <p className="metadata">
              Created: {formatDate(trip.created_at)}
              {trip.updated_at !== trip.created_at && 
                ` • Updated: ${formatDate(trip.updated_at)}`
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
            <h2>Delete Trip</h2>
            <p>Are you sure you want to delete the trip to "{trip.destination}"? This action cannot be undone.</p>
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

export default TripDetailPage;