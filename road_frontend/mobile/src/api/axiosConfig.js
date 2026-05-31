import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = (port) => {
  let ip = '192.168.1.40'; // fallback
  if (Constants.expoConfig?.hostUri) {
    ip = Constants.expoConfig.hostUri.split(':')[0];
  }
  return `http://${ip}:${port}/api/v1`;
};

// Base instances for different microservices with 10s timeout to prevent hanging
const timeout = 10000;
export const authApi = axios.create({ baseURL: getBaseUrl(3007), timeout });
export const roadApi = axios.create({ baseURL: getBaseUrl(3001), timeout });
export const budgetApi = axios.create({ baseURL: getBaseUrl(3002), timeout });
export const complaintApi = axios.create({ baseURL: getBaseUrl(3003), timeout });
export const documentApi = axios.create({ baseURL: getBaseUrl(3004), timeout });
export const searchApi = axios.create({ baseURL: getBaseUrl(3005), timeout });
export const aiApi = axios.create({ baseURL: getBaseUrl(3006), timeout });
export const notificationApi = axios.create({ baseURL: getBaseUrl(3008), timeout });

const addInterceptors = (apiInstance) => {
  apiInstance.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('accessToken');
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
