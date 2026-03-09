// frontend/src/components/PendingTasks.js
import React from 'react';

function PendingTasks({ tasks }) {
  // Default tasks if none provided
  const defaultTasks = [
    { task_name: 'Printing Approvals', count: 5 },
    { task_name: 'New Trips Registered', count: 1 },
    { task_name: 'Unreported Expenses', count: 4 },
    { task_name: 'Upcoming Expenses', count: 0 },
    { task_name: 'Unreported Advances', count: 0, value: 0.00 }
  ];

  const displayTasks = tasks && tasks.length > 0 ? tasks : defaultTasks;

  const formatValue = (task) => {
    if (task.value !== undefined && task.value !== null) {
      const numValue = typeof task.value === 'string' ? parseFloat(task.value) : task.value;
      return isNaN(numValue) ? '€0.00' : `€${numValue.toFixed(2)}`;
    }
    return task.count || 0;
  };

  return (
    <div className="card">
      <h3>Pending Tasks</h3>
      <div className="tasks-list">
        {displayTasks.map((task, index) => (
          <div key={task.id || index} className="task-item">
            <span className="task-name">{task.task_name || 'Task'}:</span>
            <span className="task-count">{formatValue(task)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingTasks;