// frontend/src/pages/Dashboard.js
import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

function Dashboard({ data, onPDFUpload }) {
  const spendingData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'This Week',
        data: [1200, 1900, 1500, 2100, 1800, 2400, 1600],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ],
  };

  const categoryData = {
    labels: ['Travel', 'Meals', 'Office', 'Software', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#94a3b8',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, Janice! 👋</h1>
          <p className="date-range">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="header-actions">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => {
              if (e.target.files[0]) {
                onPDFUpload(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          <button 
            className="btn-export"
            onClick={() => document.getElementById('pdf-upload').click()}
          >
            📄 Upload PDF
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Spent</h3>
          <p className="stat-value">$24,567</p>
          <span className="stat-change positive">+12.5%</span>
        </div>
        <div className="stat-card">
          <h3>Pending Tasks</h3>
          <p className="stat-value">
            {data.pending_tasks?.reduce((acc, task) => acc + (task.count || 0), 0) || 12}
          </p>
          <span className="stat-change">Needs attention</span>
        </div>
        <div className="stat-card">
          <h3>Active Trips</h3>
          <p className="stat-value">3</p>
          <span className="stat-change positive">+2 this week</span>
        </div>
        <div className="stat-card">
          <h3>Budget Left</h3>
          <p className="stat-value">$12,433</p>
          <span className="stat-change negative">-8.2%</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="grid-item span-2">
          <div className="card">
            <h3>Spending Trend</h3>
            <div className="chart-container">
              <Line data={spendingData} />
            </div>
          </div>
        </div>

        <div className="grid-item">
          <div className="card">
            <h3>Categories</h3>
            <div className="chart-container small">
              <Doughnut data={categoryData} />
            </div>
          </div>
        </div>

        <div className="grid-item span-2">
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
                {data.expenses.map((expense, index) => (
                  <tr key={index}>
                    <td>{expense.subject}</td>
                    <td>{expense.employee}</td>
                    <td>{expense.team}</td>
                    <td className="amount">€{parseFloat(expense.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid-item">
          <div className="card">
            <h3>Pending Tasks</h3>
            <div className="tasks-list">
              {data.pending_tasks.map((task, index) => (
                <div key={index} className="task-item">
                  <span>{task.task_name || task.task_type}:</span>
                  <span className="task-count">
                    {task.value ? `€${task.value}` : task.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;