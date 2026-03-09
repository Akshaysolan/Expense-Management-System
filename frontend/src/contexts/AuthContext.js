// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Janice Chandler',
    role: 'Administrator',
    email: 'janice.chandler@company.com',
    avatar: null,
  });

  const login = (credentials) => {
    // Implement login logic here
    console.log('Login with:', credentials);
  };

  const logout = () => {
    setUser(null);
    // Implement logout logic here
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}