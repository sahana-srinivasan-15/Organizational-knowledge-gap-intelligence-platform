import apiClient from './client';

export const managerAnalyticsApi = {
  getOverview: async () => {
    const response = await apiClient.get('/api/v1/manager/analytics/overview');
    return response.data;
  },
};

export default managerAnalyticsApi;
