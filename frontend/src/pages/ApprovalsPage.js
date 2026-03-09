// frontend/src/pages/ApprovalsPage.js
import React, { useState } from 'react';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';

function ApprovalsPage() {
  const [approvals, setApprovals] = useState([
    {
      id: 1,
      type: 'Expense',
      subject: 'Business Lunch',
      employee: 'Sarah Jade',
      amount: 75.50,
      date: '2026-04-08',
      status: 'Pending'
    },
    {
      id: 2,
      type: 'Trip',
      subject: 'London Conference',
      employee: 'John Smith',
      amount: 1250.00,
      date: '2026-04-22',
      status: 'Pending'
    },
    {
      id: 3,
      type: 'Expense',
      subject: 'Hotel Booking',
      employee: 'Jennifer Lee',
      amount: 450.75,
      date: '2026-04-09',
      status: 'Pending'
    },
    {
      id: 4,
      type: 'Expense',
      subject: 'Office Supplies',
      employee: 'Mark Brown',
      amount: 89.99,
      date: '2026-04-07',
      status: 'Approved'
    },
    {
      id: 5,
      type: 'Trip',
      subject: 'Client Visit',
      employee: 'David Wilson',
      amount: 890.50,
      date: '2026-04-15',
      status: 'Rejected'
    }
  ]);

  const [filter, setFilter] = useState('all');

  const handleApprove = (id) => {
    setApprovals(approvals.map(item => 
      item.id === id ? { ...item, status: 'Approved' } : item
    ));
  };

  const handleReject = (id) => {
    setApprovals(approvals.map(item => 
      item.id === id ? { ...item, status: 'Rejected' } : item
    ));
  };

  const filteredApprovals = approvals.filter(item => {
    if (filter === 'all') return true;
    return item.status.toLowerCase() === filter.toLowerCase();
  });

  const pendingCount = approvals.filter(item => item.status === 'Pending').length;

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
          All
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      <div className="approvals-list">
        {filteredApprovals.map(item => (
          <div key={item.id} className={`approval-card status-${item.status.toLowerCase()}`}>
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
            {item.status === 'Pending' && (
              <div className="approval-actions">
                <button className="btn-approve" onClick={() => handleApprove(item.id)}>
                  <FaCheck /> Approve
                </button>
                <button className="btn-reject" onClick={() => handleReject(item.id)}>
                  <FaTimes /> Reject
                </button>
                <button className="btn-view">
                  <FaEye /> View
                </button>
              </div>
            )}
            {item.status !== 'Pending' && (
              <div className="approval-footer">
                <button className="btn-view">
                  <FaEye /> View Details
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApprovalsPage;