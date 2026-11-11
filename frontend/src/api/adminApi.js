import apiClient from './client';

export const adminApi = {
  getAllUsers: async (params = {}) => {
    const response = await apiClient.get('/api/v1/admin/users', {
      params: { size: 100, ...params },
    });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/api/v1/admin/users', userData);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await apiClient.put(`/api/v1/admin/users/${userId}/status`, { status });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/api/v1/admin/users/${userId}`);
    return response.data;
  },
};

export default adminApi;
