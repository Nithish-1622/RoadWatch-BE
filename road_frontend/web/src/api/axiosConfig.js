import axios from 'axios';

// Base instances for different microservices
export const authApi = axios.create({ baseURL: 'http://localhost:3007/api/v1' });
export const roadApi = axios.create({ baseURL: 'http://localhost:3001/api/v1' });
export const budgetApi = axios.create({ baseURL: 'http://localhost:3002/api/v1' });
export const complaintApi = axios.create({ baseURL: 'http://localhost:3003/api/v1' });
export const documentApi = axios.create({ baseURL: 'http://localhost:3004/api/v1' });
export const searchApi = axios.create({ baseURL: 'http://localhost:3005/api/v1' });
export const aiApi = axios.create({ baseURL: 'http://localhost:3006/api/v1' });
export const notificationApi = axios.create({ baseURL: 'http://localhost:3008/api/v1' });

const addInterceptors = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Add interceptors to all instances
[authApi, roadApi, budgetApi, complaintApi, documentApi, searchApi, aiApi, notificationApi].forEach(addInterceptors);
