import { complaintApi } from './axiosConfig';

export const getAllComplaints = async () => {
  const response = await complaintApi.get('/complaints');
  return response.data;
};

export const getComplaintById = async (id) => {
  const response = await complaintApi.get(`/complaints/${id}`);
  return response.data;
};

export const createComplaint = async (complaintData) => {
  const response = await complaintApi.post('/complaints', complaintData);
  return response.data;
};

export const updateComplaint = async (id, complaintData) => {
  const response = await complaintApi.put(`/complaints/${id}`, complaintData);
  return response.data;
};

export const deleteComplaint = async (id) => {
  const response = await complaintApi.delete(`/complaints/${id}`);
  return response.data;
};

export const updateComplaintStatus = async (id, statusData) => {
  const response = await complaintApi.patch(`/complaints/${id}/status`, statusData);
  return response.data;
};
