import React from 'react';
import { FaPlus, FaReceipt, FaFileAlt, FaPlane } from 'react-icons/fa';

function QuickAccess() {
  return (
    <div className="card">
      <h3>Quick Access</h3>
      <div className="quick-access-buttons">
        <button className="quick-btn">
          <FaPlus className="btn-icon" />
          New expense
        </button>
        <button className="quick-btn">
          <FaReceipt className="btn-icon" />
          Add receipt
        </button>
        <button className="quick-btn">
          <FaFileAlt className="btn-icon" />
          Create report
        </button>
        <button className="quick-btn">
          <FaPlane className="btn-icon" />
          Create trip
        </button>
      </div>
    </div>
  );
}

export default QuickAccess;