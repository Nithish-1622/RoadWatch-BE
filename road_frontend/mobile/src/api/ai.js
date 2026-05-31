import { aiApi } from './axiosConfig';

export const predict = async (data) => {
  const response = await aiApi.post('/ai/predict', { data });
  return response.data;
};

export const getModelInfo = async () => {
  const response = await aiApi.get('/ai/model');
  return response.data;
};

export const updateModel = async (parameterData) => {
  const response = await aiApi.put('/ai/model', parameterData);
  return response.data;
};

export const deleteModel = async (id) => {
  const response = await aiApi.delete(`/ai/model/${id}`);
  return response.data;
};
