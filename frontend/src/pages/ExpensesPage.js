// frontend/src/pages/ExpensesPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaSearch, FaFilter, FaDownload, 
  FaEye, FaEdit, FaTrash, FaTimes,
  FaSort, FaSortUp, FaSortDown, FaFileExport,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

function ExpensesPage() {
  const navigate = useNavigate();
  const { authAxios, user } = useAuth();
  
  // State management
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    subject: '',
    employee: user?.id || '',
    employee_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    team: user?.department || '',
    amount: '',
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null
  });

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/expenses/');
      setExpenses(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      Object.keys(newExpense).forEach(key => {
        if (key === 'receipt' && newExpense.receipt) {
          formData.append('receipt', newExpense.receipt);
        } else if (newExpense[key] !== null && newExpense[key] !== '') {
          formData.append(key, newExpense[key]);
        }
      });

      const response = await authAxios.post('/expenses/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setExpenses(prev => [response.data, ...prev]);
      setShowAddForm(false);
      resetForm();
      
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await authAxios.delete(`/expenses/${id}/`);
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    }
  };

  const resetForm = () => {
    setNewExpense({
      subject: '',
      employee: user?.id || '',
      employee_name: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
      team: user?.department || '',
      amount: '',
      category: 'other',
      description: '',
      date: new Date().toISOString().split('T')[0],
      receipt: null
    });
  };

  const handleFileChange = (e) => {
    setNewExpense(prev => ({
      ...prev,
      receipt: e.target.files[0]
    }));
  };

  // Filtering and sorting logic
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || expense.status?.toLowerCase() === filterStatus.toLowerCase();
    
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    
    const matchesDateRange = (!dateRange.start || new Date(expense.date) >= new Date(dateRange.start)) &&
                            (!dateRange.end || new Date(expense.date) <= new Date(dateRange.end));

    return matchesSearch && matchesStatus && matchesCategory && matchesDateRange;
  });

  // Sorting
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="sort-icon active" /> : <FaSortDown className="sort-icon active" />;
  };

  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '€0.00' : `€${numAmount.toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      approved: 'badge-success',
      rejected: 'badge-danger',
      pending: 'badge-warning'
    };
    return <span className={`status-badge ${statusColors[status?.toLowerCase()] || 'badge-secondary'}`}>
      {status || 'Pending'}
    </span>;
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="expenses-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p className="page-subtitle">Manage and track all expense claims</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            <FaPlus /> New Expense
          </button>
          <button className="btn-secondary">
            <FaFileExport /> Export
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filters
        </button>

        <select 
          className="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="advanced-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="office">Office Supplies</option>
                  <option value="lunch">Business Lunch</option>
                  <option value="travel">Travel</option>
                  <option value="dinner">Client Dinner</option>
                  <option value="hotel">Hotel</option>
                  <option value="software">Software</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Date From</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>

              <div className="filter-group">
                <label>Date To</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
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
                <h2>Add New Expense</h2>
                <button className="close-btn" onClick={() => setShowAddForm(false)}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="expense-form">
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={newExpense.subject}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    placeholder="e.g., Business lunch with client"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (€) *</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      name="category" 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="office">Office Supplies</option>
                      <option value="lunch">Business Lunch</option>
                      <option value="travel">Travel</option>
                      <option value="dinner">Client Dinner</option>
                      <option value="hotel">Hotel</option>
                      <option value="software">Software</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Team/Department</label>
                    <input
                      type="text"
                      name="team"
                      value={newExpense.team}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, team: e.target.value }))}
                      placeholder="Your department"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    placeholder="Provide details about this expense..."
                  />
                </div>

                <div className="form-group">
                  <label>Receipt (Optional)</label>
                  <input
                    type="file"
                    name="receipt"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="file-input"
                  />
                  <small className="file-hint">Upload receipt image or PDF (max 5MB)</small>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expenses Table */}
      <div className="table-container">
        <table className="expenses-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('subject')}>
                Subject {getSortIcon('subject')}
              </th>
              <th onClick={() => requestSort('employee_name')}>
                Employee {getSortIcon('employee_name')}
              </th>
              <th onClick={() => requestSort('team')}>
                Team {getSortIcon('team')}
              </th>
              <th onClick={() => requestSort('category')}>
                Category {getSortIcon('category')}
              </th>
              <th onClick={() => requestSort('amount')} className="amount-col">
                Amount {getSortIcon('amount')}
              </th>
              <th onClick={() => requestSort('date')}>
                Date {getSortIcon('date')}
              </th>
              <th onClick={() => requestSort('status')}>
                Status {getSortIcon('status')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((expense) => (
                <motion.tr 
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                >
                  <td className="subject-cell">{expense.subject || 'N/A'}</td>
                  <td>{expense.employee_name || 'N/A'}</td>
                  <td>{expense.team || 'N/A'}</td>
                  <td>
                    <span className="category-badge">{expense.category || 'other'}</span>
                  </td>
                  <td className="amount-cell">{formatAmount(expense.amount)}</td>
                  <td>{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{getStatusBadge(expense.status)}</td>
                  <td className="actions-cell">
                    <button 
                      className="icon-btn view"
                      onClick={() => navigate(`/expenses/${expense.id}`)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button 
                      className="icon-btn edit"
                      onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="icon-btn delete"
                      onClick={() => handleDeleteExpense(expense.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  <div className="empty-state">
                    <FaSearch size={48} className="empty-icon" />
                    <h3>No expenses found</h3>
                    <p>Try adjusting your filters or add a new expense</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedExpenses.length > 0 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default ExpensesPage;