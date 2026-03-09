import React from 'react';

function RecentExpenses({ expenses }) {
  return (
    <div className="card">
      <h3>Recent Expenses</h3>
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
            <tr key={index}>
              <td>{expense.subject}</td>
              <td>{expense.employee}</td>
              <td>{expense.team}</td>
              <td className="amount">€{expense.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentExpenses;