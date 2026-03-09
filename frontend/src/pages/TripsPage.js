// frontend/src/pages/TripsPage.js
import React, { useState } from 'react';
import { FaPlus, FaPlane, FaMapMarkerAlt, FaCalendar, FaUser } from 'react-icons/fa';

function TripsPage() {
  const [trips, setTrips] = useState([
    {
      id: 1,
      destination: 'New York',
      employee: 'John Smith',
      startDate: '2026-04-15',
      endDate: '2026-04-20',
      purpose: 'Client Meeting',
      status: 'Approved',
      expenses: 1250.75
    },
    {
      id: 2,
      destination: 'London',
      employee: 'Sarah Jade',
      startDate: '2026-04-22',
      endDate: '2026-04-28',
      purpose: 'Conference',
      status: 'Pending',
      expenses: 0
    },
    {
      id: 3,
      destination: 'Tokyo',
      employee: 'Mark Brown',
      startDate: '2026-05-05',
      endDate: '2026-05-12',
      purpose: 'Business Development',
      status: 'Approved',
      expenses: 3450.50
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrip, setNewTrip] = useState({
    destination: '',
    employee: '',
    startDate: '',
    endDate: '',
    purpose: '',
    status: 'Pending'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trip = {
      ...newTrip,
      id: trips.length + 1,
      expenses: 0
    };
    setTrips([...trips, trip]);
    setShowAddForm(false);
    setNewTrip({
      destination: '',
      employee: '',
      startDate: '',
      endDate: '',
      purpose: '',
      status: 'Pending'
    });
  };

  const getStatusClass = (status) => {
    return status.toLowerCase() === 'approved' ? 'status-approved' : 'status-pending';
  };

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
            <p className="stat-value">3</p>
          </div>
        </div>
        <div className="stat-card">
          <FaCalendar className="stat-icon" />
          <div className="stat-info">
            <h3>Upcoming</h3>
            <p className="stat-value">2</p>
          </div>
        </div>
        <div className="stat-card">
          <FaMapMarkerAlt className="stat-icon" />
          <div className="stat-info">
            <h3>Destinations</h3>
            <p className="stat-value">5</p>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Trip</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Destination</label>
                <input
                  type="text"
                  name="destination"
                  value={newTrip.destination}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Employee</label>
                <input
                  type="text"
                  name="employee"
                  value={newTrip.employee}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newTrip.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newTrip.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Purpose</label>
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
                <button type="submit" className="btn-primary">
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="trips-list">
        {trips.map(trip => (
          <div key={trip.id} className="trip-card">
            <div className="trip-header">
              <h3>{trip.destination}</h3>
              <span className={`trip-status ${getStatusClass(trip.status)}`}>
                {trip.status}
              </span>
            </div>
            <div className="trip-details">
              <div className="trip-detail">
                <FaUser className="detail-icon" />
                <span>{trip.employee}</span>
              </div>
              <div className="trip-detail">
                <FaCalendar className="detail-icon" />
                <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
              </div>
              <div className="trip-detail">
                <FaMapMarkerAlt className="detail-icon" />
                <span>{trip.purpose}</span>
              </div>
            </div>
            <div className="trip-footer">
              <span className="trip-expenses">Expenses: €{trip.expenses.toFixed(2)}</span>
              <div className="trip-actions">
                <button className="btn-small">View</button>
                <button className="btn-small">Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TripsPage;
