import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function MonthlyReport({ data }) {
  const chartData = data.labels?.map((label, index) => ({
    name: label,
    Marketing: data.marketing?.[index] || 0,
    Sales: data.sales?.[index] || 0,
    Finance: data.finance?.[index] || 0
  })) || [];

  return (
    <div className="card">
      <h3>Monthly Report</h3>
      <div className="report-controls">
        <button className="report-btn">Team Spending Trend</button>
        <button className="report-btn active">Day-to-Day Expenses</button>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Marketing" fill="#8884d8" />
            <Bar dataKey="Sales" fill="#82ca9d" />
            <Bar dataKey="Finance" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="x-axis-labels">
        {['PO', 'Q1', 'M8', 'M9', 'Q2', 'Q3', 'Q4'].map((label, i) => (
          <span key={i} className="axis-label">{label}</span>
        ))}
      </div>
    </div>
  );
}

export default MonthlyReport;