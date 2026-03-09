import React from 'react';
import PendingTasks from './PendingTasks';
import QuickAccess from './QuickAccess';
import RecentExpenses from './RecentExpenses';
import MonthlyReport from './MonthlyReport';
import PDFUploader from './PDFUploader';

function Dashboard({ data, onPDFUpload }) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
      </header>
      
      <div className="dashboard-grid">
        <div className="grid-item pending-tasks">
          <PendingTasks tasks={data.pending_tasks} />
        </div>
        
        <div className="grid-item quick-access">
          <QuickAccess />
        </div>
        
        <div className="grid-item pdf-uploader">
          <PDFUploader onUpload={onPDFUpload} />
        </div>
        
        <div className="grid-item recent-expenses">
          <RecentExpenses expenses={data.expenses} />
        </div>
        
        <div className="grid-item monthly-report">
          <MonthlyReport data={data.monthly_report} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;