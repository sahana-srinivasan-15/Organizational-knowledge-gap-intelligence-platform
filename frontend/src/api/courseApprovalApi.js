import apiClient from './client';

export const courseApprovalApi = {
  submitRequest: async (requestData) => {
    const response = await apiClient.post('/api/v1/course-approvals', requestData);
    return response.data;
  },

  reviewRequest: async (requestId, reviewData) => {
    const response = await apiClient.put(`/api/v1/course-approvals/${requestId}/review`, reviewData);
    return response.data;
  },

  getMyRequests: async () => {
    const response = await apiClient.get('/api/v1/course-approvals/me');
    return response.data;
  },

  getDepartmentRequests: async (params = {}) => {
    const response = await apiClient.get('/api/v1/course-approvals/department', { params });
    return response.data;
  },

  getRequestById: async (id) => {
    const response = await apiClient.get(`/api/v1/course-approvals/${id}`);
    return response.data;
  },

  withdrawRequest: async (requestId) => {
    const response = await apiClient.put(`/api/v1/course-approvals/${requestId}/withdraw`);
    return response.data;
  },

  deleteRequest: async (requestId) => {
    const response = await apiClient.delete(`/api/v1/course-approvals/${requestId}`);
    return response.data;
  },
};

export default courseApprovalApi;
