import React from 'react';
import { FaHome, FaMoneyBill, FaPlane, FaCheckCircle, FaCog, FaHeadset } from 'react-icons/fa';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="profile">
        <h2>Janice Chandler</h2>
      </div>
      <nav className="nav-menu">
        <div className="nav-item active">
          <FaHome className="icon" />
          <span>Home</span>
        </div>
        <div className="nav-item">
          <FaMoneyBill className="icon" />
          <span>Expenses</span>
        </div>
        <div className="nav-item sub-item">
          <FaPlane className="icon" />
          <span>Trips</span>
        </div>
        <div className="nav-item sub-item">
          <FaCheckCircle className="icon" />
          <span>Approvals</span>
        </div>
        <div className="nav-item">
          <FaCog className="icon" />
          <span>Settings</span>
        </div>
        <div className="nav-item">
          <FaHeadset className="icon" />
          <span>Support</span>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;