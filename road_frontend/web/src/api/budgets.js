import { budgetApi } from './axiosConfig';

export const getAllBudgets = async () => {
  const response = await budgetApi.get('/budgets');
  return response.data;
};

export const getBudgetById = async (id) => {
  const response = await budgetApi.get(`/budgets/${id}`);
  return response.data;
};

export const createBudget = async (budgetData) => {
  const response = await budgetApi.post('/budgets', budgetData);
  return response.data;
};

export const updateBudget = async (id, budgetData) => {
  const response = await budgetApi.put(`/budgets/${id}`, budgetData);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await budgetApi.delete(`/budgets/${id}`);
  return response.data;
};

// Contractor APIs
export const getAllContractors = async () => {
  const response = await budgetApi.get('/budgets/contractors');
  return response.data;
};

export const createContractor = async (contractorData) => {
  const response = await budgetApi.post('/budgets/contractors', contractorData);
  return response.data;
};

export const updateContractor = async (id, contractorData) => {
  const response = await budgetApi.put(`/budgets/contractors/${id}`, contractorData);
  return response.data;
};

export const deleteContractor = async (id) => {
  const response = await budgetApi.delete(`/budgets/contractors/${id}`);
  return response.data;
};
