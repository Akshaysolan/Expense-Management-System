// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Mail, Lock, User, Briefcase, 
  Phone, UserPlus, AlertCircle, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Finance', 'IT', 
  'Human Resources', 'Operations', 'Legal', 'R&D'
];

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'finance', label: 'Finance Team' }
];

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    role: 'employee',
    password: '',
    password2: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    // Clear field error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (form.phone && !/^\+?[\d\s-]{10,}$/.test(form.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    if (!form.department) {
      newErrors.department = 'Please select a department';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
    }

    if (form.password !== form.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    return newErrors;
  };

  const getPasswordStrength = () => {
    const password = form.password;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^A-Za-z0-9]/)) strength += 25;
    
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength();
  const getStrengthColor = () => {
    if (passwordStrength < 50) return '#ef4444';
    if (passwordStrength < 75) return '#f59e0b';
    return '#10b981';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const user = await register(form);
      setSuccess('Account created successfully! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different error formats from backend
      if (err.response?.data) {
        const backendErrors = err.response.data;
        const formattedErrors = {};
        
        // Handle field-specific errors
        Object.keys(backendErrors).forEach(key => {
          if (key === 'non_field_errors' || key === 'general') {
            setErrors({ general: Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key] });
          } else {
            formattedErrors[key] = Array.isArray(backendErrors[key]) 
              ? backendErrors[key][0] 
              : backendErrors[key];
          }
        });
        
        setErrors(prev => ({ ...prev, ...formattedErrors }));
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-grid" />
      </div>

      <motion.div
        className="auth-card auth-card-wide"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="auth-logo">
          <motion.span 
            className="auth-logo-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            💼
          </motion.span>
          <span className="auth-logo-text">
            Expense<span>Pro</span>
          </span>
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join ExpensePro to manage your expenses efficiently
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div 
            className="auth-success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle size={18} />
            <span>{success}</span>
          </motion.div>
        )}

        {/* General Error */}
        {errors.general && (
          <motion.div 
            className="auth-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle size={18} />
            <span>{errors.general}</span>
          </motion.div>
        )}

        {/* Registration Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Name Row */}
          <div className="auth-form-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="first_name">
                First Name <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={18} />
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className={`auth-input ${errors.first_name ? 'error' : ''}`}
                  placeholder="John"
                  value={form.first_name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="given-name"
                />
              </div>
              {errors.first_name && (
                <p className="auth-field-error">{errors.first_name}</p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="last_name">
                Last Name <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={18} />
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className={`auth-input ${errors.last_name ? 'error' : ''}`}
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="family-name"
                />
              </div>
              {errors.last_name && (
                <p className="auth-field-error">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email Address <span className="auth-required">*</span>
            </label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                className={`auth-input ${errors.email ? 'error' : ''}`}
                placeholder="john.doe@company.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="auth-field-error">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="phone">
              Phone Number <span className="auth-optional">(optional)</span>
            </label>
            <div className="auth-input-wrapper">
              <Phone className="auth-input-icon" size={18} />
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`auth-input ${errors.phone ? 'error' : ''}`}
                placeholder="+1 234 567 8900"
                value={form.phone}
                onChange={handleChange}
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            {errors.phone && (
              <p className="auth-field-error">{errors.phone}</p>
            )}
          </div>

          {/* Department and Role Row */}
          <div className="auth-form-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="department">
                Department <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <Briefcase className="auth-input-icon" size={18} />
                <select
                  id="department"
                  name="department"
                  className={`auth-select ${errors.department ? 'error' : ''}`}
                  value={form.department}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              {errors.department && (
                <p className="auth-field-error">{errors.department}</p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="role">
                Role <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <Briefcase className="auth-input-icon" size={18} />
                <select
                  id="role"
                  name="role"
                  className="auth-select"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Password Row */}
          <div className="auth-form-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {form.password && (
                <div className="auth-password-strength">
                  <div 
                    className="auth-strength-bar"
                    style={{ width: `${passwordStrength}%`, backgroundColor: getStrengthColor() }}
                  />
                  <span className="auth-strength-text">
                    {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                  </span>
                </div>
              )}
              
              {errors.password && (
                <p className="auth-field-error">{errors.password}</p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password2">
                Confirm Password <span className="auth-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="password2"
                  name="password2"
                  className={`auth-input ${errors.password2 ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={form.password2}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password2 && (
                <p className="auth-field-error">{errors.password2}</p>
              )}
            </div>
          </div>

          {/* Password Requirements */}
          <div className="auth-requirements">
            <p className="auth-requirements-title">Password must contain:</p>
            <ul className="auth-requirements-list">
              <li className={form.password.length >= 8 ? 'valid' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(form.password) ? 'valid' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(form.password) ? 'valid' : ''}>
                One lowercase letter
              </li>
              <li className={/\d/.test(form.password) ? 'valid' : ''}>
                One number
              </li>
            </ul>
          </div>

          {/* Terms */}
          <div className="auth-terms">
            <label className="auth-checkbox">
              <input type="checkbox" required /> 
              <span>
                I agree to the <Link to="/terms" className="auth-link">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="auth-link">Privacy Policy</Link>
              </span>
            </label>
          </div>

          <motion.button
            type="submit"
            className="auth-button"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>

       
      </motion.div>
    </div>
  );
}

export default RegisterPage;