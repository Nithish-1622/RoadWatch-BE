import { authApi } from './axiosConfig';

export const login = async (credentials) => {
  const response = await authApi.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await authApi.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await authApi.get('/auth/me');
  return response.data;
};

export const refreshToken = async (token) => {
  const response = await authApi.post('/auth/refresh', { refreshToken: token });
  return response.data;
};
