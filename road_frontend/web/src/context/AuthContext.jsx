import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem('accessToken', token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
