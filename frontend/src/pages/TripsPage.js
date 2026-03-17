import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaPlane, FaMapMarkerAlt, FaCalendar, FaUser, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import '../styles/TripsPage.css';

function TripsPage() {
  const navigate = useNavigate();
  const { authAxios, user } = useAuth();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrip, setNewTrip] = useState({
    destination: '',
    purpose: '',
    start_date: '',
    end_date: '',
    estimated_expenses: '',
    employee: user?.id || ''
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/trips/');
      setTrips(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load trips.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await authAxios.post('/trips/', newTrip);
      setTrips(prev => [response.data, ...prev]);
      setShowAddForm(false);
      setNewTrip({
        destination: '',
        purpose: '',
        start_date: '',
        end_date: '',
        estimated_expenses: '',
        employee: user?.id || ''
      });
    } catch (err) {
      console.error('Error creating trip:', err);
      alert('Failed to create trip. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    return status?.toLowerCase() || 'pending';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && trips.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading trips...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Trips</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          <FaPlus /> New Trip
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <FaPlane className="stat-icon" />
          <div className="stat-info">
            <h3>Active Trips</h3>
            <p className="stat-value">{trips.filter(t => t.status === 'approved').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaCalendar className="stat-icon" />
          <div className="stat-info">
            <h3>Upcoming</h3>
            <p className="stat-value">
              {trips.filter(t => new Date(t.start_date) > new Date() && t.status === 'approved').length}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <FaMapMarkerAlt className="stat-icon" />
          <div className="stat-info">
            <h3>Total Trips</h3>
            <p className="stat-value">{trips.length}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Create New Trip</h2>
                <button className="close-btn" onClick={() => setShowAddForm(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Destination *</label>
                  <input
                    type="text"
                    name="destination"
                    value={newTrip.destination}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={newTrip.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      name="end_date"
                      value={newTrip.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Estimated Expenses (€)</label>
                  <input
                    type="number"
                    name="estimated_expenses"
                    step="0.01"
                    min="0"
                    value={newTrip.estimated_expenses}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Purpose *</label>
                  <textarea
                    name="purpose"
                    value={newTrip.purpose}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Trip'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="trips-list">
        {trips.length > 0 ? (
          trips.map(trip => (
            <motion.div 
              key={trip.id} 
              className="trip-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
            >
              <div className="trip-header">
                <h3>{trip.destination}</h3>
                <span className={`trip-status ${getStatusClass(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              <div className="trip-details">
                <div className="trip-detail">
                  <FaUser className="detail-icon" />
                  <span>{trip.employee_name}</span>
                </div>
                <div className="trip-detail">
                  <FaCalendar className="detail-icon" />
                  <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                </div>
                <div className="trip-detail">
                  <FaMapMarkerAlt className="detail-icon" />
                  <span>{trip.purpose}</span>
                </div>
              </div>
              <div className="trip-footer">
                <span className="trip-expenses">
                  Estimated: €{parseFloat(trip.estimated_expenses || 0).toFixed(2)}
                </span>
                <div className="trip-actions">
                  <button className="btn-small" onClick={() => navigate(`/trips/${trip.id}`)}>
                    View
                  </button>
                  {trip.status === 'pending' && (
                    <button className="btn-small" onClick={() => navigate(`/trips/${trip.id}/edit`)}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <FaPlane size={48} />
            <h3>No trips found</h3>
            <p>Click "New Trip" to create your first trip</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripsPage;