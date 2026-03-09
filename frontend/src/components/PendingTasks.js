import React from 'react';

function PendingTasks({ tasks }) {
  return (
    <div className="card">
      <h3>Pending Tasks</h3>
      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-item">
            <span className="task-name">{task.task_name}:</span>
            <span className="task-count">
              {task.value ? `€${task.value}` : task.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingTasks;