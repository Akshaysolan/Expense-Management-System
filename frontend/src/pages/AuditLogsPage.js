import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, Download, Calendar, User, 
  FileText, CheckCircle, XCircle, Clock,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function AuditLogsPage() {
  const { authAxios } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        status: filter !== 'all' ? filter : undefined
      };
      const response = await authAxios.get('/audit-logs/', { params });
      setLogs(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'success': return <CheckCircle size={16} className="status-icon success" />;
      case 'error': return <XCircle size={16} className="status-icon error" />;
      case 'warning': return <Clock size={16} className="status-icon warning" />;
      default: return <FileText size={16} className="status-icon info" />;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm && !log.user?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.action?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.target?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleExport = async () => {
    try {
      const response = await authAxios.get('/audit-logs/export/', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Failed to export logs.');
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p className="subtitle">Track all system activities and changes</p>
      </div>

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
          <select onChange={(e) => {
            const [days] = e.target.value.split(' ');
            const params = { days: parseInt(days) || 7 };
            fetchLogs(params);
          }}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <button className="export-btn" onClick={handleExport}>
          <Download size={16} />
          Export
        </button>
      </div>

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
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: 'var(--bg-hover)' }}
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
                  <td>{formatDateTime(log.timestamp || log.date)}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  <p>No audit logs found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button 
          className="pagination-btn"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="page-info">Page {currentPage} of {totalPages}</span>
        <button 
          className="pagination-btn"
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default AuditLogsPage;