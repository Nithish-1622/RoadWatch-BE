import { documentApi } from './axiosConfig';

export const getAllDocuments = async () => {
  const response = await documentApi.get('/documents');
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await documentApi.get(`/documents/${id}`);
  return response.data;
};

export const uploadDocument = async (documentData) => {
  const response = await documentApi.post('/documents', documentData);
  return response.data;
};

export const updateDocument = async (id, documentData) => {
  const response = await documentApi.put(`/documents/${id}`, documentData);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await documentApi.delete(`/documents/${id}`);
  return response.data;
};
