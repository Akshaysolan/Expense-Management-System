// frontend/src/pages/ExpensesPage.js
import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';

function ExpensesPage({ expenses, onAddExpense }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newExpense, setNewExpense] = useState({
    subject: '',
    employee: '',
    team: '',
    amount: '',
    category: 'other',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAddExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      setShowAddForm(false);
      setNewExpense({
        subject: '',
        employee: '',
        team: '',
        amount: '',
        category: 'other',
        description: ''
      });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.team?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '€0.00' : `€${numAmount.toFixed(2)}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Expenses</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <FaPlus /> Add Expense
          </button>
          <button className="btn-secondary">
            <FaDownload /> Export
          </button>
        </div>
      </div>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="filter-btn">
          <FaFilter /> Filter
        </button>
      </div>

      {showAddForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={newExpense.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee</label>
                  <input
                    type="text"
                    name="employee"
                    value={newExpense.employee}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Team</label>
                  <select name="team" value={newExpense.team} onChange={handleInputChange} required>
                    <option value="">Select Team</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (€)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={newExpense.category} onChange={handleInputChange}>
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
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newExpense.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="expenses-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Employee</th>
              <th>Team</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense, index) => (
                <tr key={expense.id || index}>
                  <td>{expense.subject || 'N/A'}</td>
                  <td>{expense.employee || 'N/A'}</td>
                  <td>{expense.team || 'N/A'}</td>
                  <td>{expense.category || 'other'}</td>
                  <td className="amount">{formatAmount(expense.amount)}</td>
                  <td>{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button className="action-btn">View</button>
                    <button className="action-btn">Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No expenses found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExpensesPage;