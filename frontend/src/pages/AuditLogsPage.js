// frontend/src/pages/AuditLogsPage.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, Download, Calendar, User, 
  FileText, CheckCircle, XCircle, Clock,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';

function AuditLogsPage() {
  const [logs, setLogs] = useState([
    { id: 1, user: 'John Smith', action: 'Approved expense', target: 'Business Lunch', date: '2026-04-08T10:30:00', status: 'success' },
    { id: 2, user: 'Sarah Jade', action: 'Created trip', target: 'London Conference', date: '2026-04-08T09:15:00', status: 'info' },
    { id: 3, user: 'Mark Brown', action: 'Rejected expense', target: 'Hotel Booking', date: '2026-04-07T16:45:00', status: 'error' },
    { id: 4, user: 'Jennifer Lee', action: 'Updated profile', target: 'Contact information', date: '2026-04-07T14:20:00', status: 'info' },
    { id: 5, user: 'David Wilson', action: 'Deleted expense', target: 'Office Supplies', date: '2026-04-07T11:10:00', status: 'warning' },
    { id: 6, user: 'System', action: 'PDF uploaded', target: 'receipt_0326.pdf', date: '2026-04-07T09:30:00', status: 'info' },
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle size={16} className="status-icon success" />;
      case 'error': return <XCircle size={16} className="status-icon error" />;
      case 'warning': return <Clock size={16} className="status-icon warning" />;
      default: return <FileText size={16} className="status-icon info" />;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false;
    if (searchTerm && !log.user.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.target.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p className="subtitle">Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'success' ? 'active' : ''}`}
            onClick={() => setFilter('success')}
          >
            Success
          </button>
          <button
            className={`filter-tab ${filter === 'error' ? 'active' : ''}`}
            onClick={() => setFilter('error')}
          >
            Errors
          </button>
          <button
            className={`filter-tab ${filter === 'warning' ? 'active' : ''}`}
            onClick={() => setFilter('warning')}
          >
            Warnings
          </button>
        </div>

        <div className="date-filter">
          <Calendar size={16} />
          <select>
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Custom range</option>
          </select>
        </div>

        <button className="export-btn">
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Logs Table */}
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <motion.tr 
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ backgroundColor: '#f9fafb' }}
              >
                <td>{getStatusIcon(log.status)}</td>
                <td>
                  <div className="user-cell">
                    <User size={14} />
                    {log.user}
                  </div>
                </td>
                <td>{log.action}</td>
                <td>{log.target}</td>
                <td>{formatDateTime(log.date)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button 
          className="pagination-btn"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="page-info">Page {currentPage} of 10</span>
        <button 
          className="pagination-btn"
          onClick={() => setCurrentPage(p => p + 1)}
          disabled={currentPage === 10}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default AuditLogsPage;