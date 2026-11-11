import apiClient from './client';

export const liveClassApi = {
  getLiveClasses: async (params = {}) => {
    const res = await apiClient.get('/api/v1/live-classes', { params });
    return res.data;
  },

  getLiveClassById: async (id) => {
    const res = await apiClient.get(`/api/v1/live-classes/${id}`);
    return res.data;
  },

  createLiveClass: async (data) => {
    const res = await apiClient.post('/api/v1/live-classes', data);
    return res.data;
  },

  updateStatus: async (id, data) => {
    const res = await apiClient.patch(`/api/v1/live-classes/${id}/status`, data);
    return res.data;
  },

  joinClass: async (id) => {
    const res = await apiClient.post(`/api/v1/live-classes/${id}/join`);
    return res.data;
  },
};

export default liveClassApi;

