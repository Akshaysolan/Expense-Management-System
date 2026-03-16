import React from 'react';

function RecentExpenses({ expenses }) {
  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '€0.00';
    }
    return `€${numAmount.toFixed(2)}`;
  };

  return (
    <div className="card">
      <h3>Recent Expenses</h3>
      {expenses && expenses.length > 0 ? (
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Employee</th>
              <th>Team</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => (
              <tr key={expense.id || index}>
                <td>{expense.subject || 'N/A'}</td>
                <td>{expense.employee || 'N/A'}</td>
                <td>{expense.team || 'N/A'}</td>
                <td className="amount">{formatAmount(expense.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">No recent expenses found</p>
      )}
    </div>
  );
}

export default RecentExpenses;