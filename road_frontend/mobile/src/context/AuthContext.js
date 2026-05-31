import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../api/auth';
export const AuthContext = createContext({
  user: null,
  loading: true,
  loginUser: async () => {},
  logoutUser: async () => {}
});
export const AuthProvider = ({
  children
}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const userData = await getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
        await AsyncStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);
  const loginUser = async (userData, token) => {
    await AsyncStorage.setItem('accessToken', token);
    setUser(userData);
  };
  const logoutUser = async () => {
    await AsyncStorage.removeItem('accessToken');
    setUser(null);
  };
  return <AuthContext.Provider value={{
    user,
    loading,
    loginUser,
    logoutUser
  }}>
      {children}
    </AuthContext.Provider>;
};