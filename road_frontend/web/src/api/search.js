import { searchApi } from './axiosConfig';

export const searchRoads = async (query) => {
  const response = await searchApi.get(`/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const createSavedSearch = async (searchData) => {
  const response = await searchApi.post('/search', searchData);
  return response.data;
};
