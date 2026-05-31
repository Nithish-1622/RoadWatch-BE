import { roadApi } from './axiosConfig';

export const getAllRoads = async () => {
  const response = await roadApi.get('/roads');
  return response.data;
};

export const getRoadById = async (id) => {
  const response = await roadApi.get(`/roads/${id}`);
  return response.data;
};

export const createRoad = async (roadData) => {
  const response = await roadApi.post('/roads', roadData);
  return response.data;
};

export const updateRoad = async (id, roadData) => {
  const response = await roadApi.put(`/roads/${id}`, roadData);
  return response.data;
};

export const deleteRoad = async (id) => {
  const response = await roadApi.delete(`/roads/${id}`);
  return response.data;
};

export const suggestRoad = async (roadData) => {
  const response = await roadApi.post('/roads/suggest', roadData);
  return response.data;
};
