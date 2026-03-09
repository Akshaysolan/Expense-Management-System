// frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const fetchDashboardData = async () => {
  const { data } = await api.get('/dashboard/');
  return data;
};

export const fetchExpenses = async (params) => {
  const { data } = await api.get('/expenses/', { params });
  return data;
};

export const createExpense = async (expenseData) => {
  const { data } = await api.post('/expenses/', expenseData);
  toast.success('Expense created successfully!');
  return data;
};

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/upload-pdf/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  toast.success(`PDF processed! Found ${data.expenses_found} expenses.`);
  return data;
};

export default api;