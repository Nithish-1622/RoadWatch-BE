import { notificationApi } from './axiosConfig';

export const sendNotification = async (notificationData) => {
  const response = await notificationApi.post('/notifications', notificationData);
  return response.data;
};

export const getAllNotifications = async () => {
  const response = await notificationApi.get('/notifications');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await notificationApi.delete(`/notifications/${id}`);
  return response.data;
};
