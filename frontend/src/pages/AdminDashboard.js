// // frontend/src/pages/AdminDashboard.js
// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { 
//   Users, Building2, TrendingUp, DollarSign,
//   UserPlus, Settings, Download, Filter,
//   BarChart3, PieChart, Calendar, ChevronRight,
//   Mail, Phone, MapPin, Award
// } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
// import { api } from '../contexts/AuthContext';

// function AdminDashboard() {
//   const { user } = useAuth();
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     totalExpenses: 0,
//     totalAmount: 0,
//     pendingApprovals: 0,
//     activeTeams: 0
//   });
//   const [recentUsers, setRecentUsers] = useState([]);
//   const [recentExpenses, setRecentExpenses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [timeframe, setTimeframe] = useState('month');

//   useEffect(() => {
//     fetchAdminData();
//   }, [timeframe]);

//   const fetchAdminData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch users
//       const usersRes = await api.get('/employees/');
//       setRecentUsers(usersRes.data.slice(0, 5));
      
//       // Fetch expenses stats
//       const expensesRes = await api.get('/expenses/stats/');
//       setStats({
//         totalUsers: usersRes.data.length,
//         totalExpenses: expensesRes.data.total_expenses || 0,
//         totalAmount: expensesRes.data.total_amount || 0,
//         pendingApprovals: expensesRes.data.status_distribution?.find(s => s.status === 'pending')?.count || 0,
//         activeTeams: 5 // This should come from API
//       });
      
//       // Fetch recent expenses
//       const recentRes = await api.get('/expenses/?limit=10');
//       setRecentExpenses(recentRes.data);
      
//     } catch (err) {
//       console.error('Error fetching admin data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const StatCard = ({ icon: Icon, title, value, change, color }) => (
//     <motion.div 
//       className="admin-stat-card"
//       whileHover={{ y: -4 }}
//       transition={{ type: 'spring', stiffness: 300 }}
//     >
//       <div className="admin-stat-icon" style={{ backgroundColor: `${color}20`, color }}>
//         <Icon size={24} />
//       </div>
//       <div className="admin-stat-content">
//         <h3 className="admin-stat-title">{title}</h3>
//         <p className="admin-stat-value">{value}</p>
//         {change && (
//           <p className="admin-stat-change" style={{ color: change > 0 ? '#10b981' : '#ef4444' }}>
//             {change > 0 ? '+' : ''}{change}% from last {timeframe}
//           </p>
//         )}
//       </div>
//     </motion.div>
//   );

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner" />
//         <p>Loading admin dashboard...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="admin-dashboard">
//       {/* Header */}
//       <div className="admin-header">
//         <div>
//           <h1 className="admin-title">
//             Welcome back, {user?.full_name || 'Admin'}!
//           </h1>
//           <p className="admin-subtitle">
//             Here's what's happening with your organization today.
//           </p>
//         </div>
        
//         <div className="admin-header-actions">
//           <select 
//             className="admin-timeframe"
//             value={timeframe}
//             onChange={(e) => setTimeframe(e.target.value)}
//           >
//             <option value="week">This Week</option>
//             <option value="month">This Month</option>
//             <option value="quarter">This Quarter</option>
//             <option value="year">This Year</option>
//           </select>
          
//           <button className="admin-export-btn">
//             <Download size={18} />
//             Export Report
//           </button>
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="admin-stats-grid">
//         <StatCard 
//           icon={Users}
//           title="Total Users"
//           value={stats.totalUsers}
//           change={12}
//           color="#3b82f6"
//         />
//         <StatCard 
//           icon={DollarSign}
//           title="Total Expenses"
//           value={`€${stats.totalAmount.toLocaleString()}`}
//           change={8}
//           color="#10b981"
//         />
//         <StatCard 
//           icon={TrendingUp}
//           title="Pending Approvals"
//           value={stats.pendingApprovals}
//           change={-5}
//           color="#f59e0b"
//         />
//         <StatCard 
//           icon={Building2}
//           title="Active Teams"
//           value={stats.activeTeams}
//           change={0}
//           color="#8b5cf6"
//         />
//       </div>

//       {/* Charts Section */}
//       <div className="admin-charts">
//         <div className="admin-chart-card">
//           <div className="admin-chart-header">
//             <h3>Expense Trends</h3>
//             <BarChart3 size={20} />
//           </div>
//           <div className="admin-chart-placeholder">
//             <p>Chart visualization would go here</p>
//           </div>
//         </div>

//         <div className="admin-chart-card">
//           <div className="admin-chart-header">
//             <h3>Category Distribution</h3>
//             <PieChart size={20} />
//           </div>
//           <div className="admin-chart-placeholder">
//             <p>Pie chart would go here</p>
//           </div>
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div className="admin-activity-grid">
//         {/* Recent Users */}
//         <div className="admin-card">
//           <div className="admin-card-header">
//             <h3>Recent Users</h3>
//             <button className="admin-view-all">
//               View All <ChevronRight size={16} />
//             </button>
//           </div>
          
//           <div className="admin-user-list">
//             {recentUsers.map((employee, index) => (
//               <motion.div 
//                 key={employee.id}
//                 className="admin-user-item"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: index * 0.1 }}
//               >
//                 <div className="admin-user-avatar">
//                   {employee.user?.first_name?.charAt(0) || 'U'}
//                   {employee.user?.last_name?.charAt(0) || ''}
//                 </div>
//                 <div className="admin-user-info">
//                   <h4>{employee.full_name}</h4>
//                   <p>{employee.department} • {employee.role}</p>
//                 </div>
//                 <div className="admin-user-status">
//                   <span className="status-dot active" />
//                   Active
//                 </div>
//               </motion.div>
//             ))}
//           </div>
          
//           <button className="admin-add-user">
//             <UserPlus size={16} />
//             Add New User
//           </button>
//         </div>

//         {/* Recent Expenses */}
//         <div className="admin-card">
//           <div className="admin-card-header">
//             <h3>Recent Expenses</h3>
//             <button className="admin-view-all">
//               View All <ChevronRight size={16} />
//             </button>
//           </div>
          
//           <div className="admin-expense-list">
//             {recentExpenses.map((expense, index) => (
//               <motion.div 
//                 key={expense.id}
//                 className="admin-expense-item"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: index * 0.1 }}
//               >
//                 <div className="admin-expense-info">
//                   <h4>{expense.subject}</h4>
//                   <p>{expense.employee_name} • {expense.team_name}</p>
//                 </div>
//                 <div className="admin-expense-amount">
//                   €{expense.amount?.toFixed(2)}
//                 </div>
//                 <div className={`admin-expense-status ${expense.status}`}>
//                   {expense.status}
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <div className="admin-card">
//           <div className="admin-card-header">
//             <h3>Quick Actions</h3>
//             <Settings size={16} />
//           </div>
          
//           <div className="admin-quick-actions">
//             <button className="admin-action-btn">
//               <UserPlus size={18} />
//               Invite Users
//             </button>
//             <button className="admin-action-btn">
//               <Building2 size={18} />
//               Manage Teams
//             </button>
//             <button className="admin-action-btn">
//               <DollarSign size={18} />
//               Set Budgets
//             </button>
//             <button className="admin-action-btn">
//               <Calendar size={18} />
//               Schedule Review
//             </button>
//             <button className="admin-action-btn">
//               <Download size={18} />
//               Generate Report
//             </button>
//             <button className="admin-action-btn">
//               <Settings size={18} />
//               System Settings
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;