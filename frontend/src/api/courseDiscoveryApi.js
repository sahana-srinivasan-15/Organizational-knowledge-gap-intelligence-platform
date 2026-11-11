import apiClient from './client';

export const courseDiscoveryApi = {
  searchCourses: async (params = {}) => {
    const response = await apiClient.get('/api/v1/courses/discovery/search', { params });
    return response.data;
  },

  getTrendingCourses: async (limit = 8) => {
    const response = await apiClient.get('/api/v1/courses/discovery/trending', {
      params: { limit },
    });
    return response.data;
  },

  compareCourses: async (courseIds, employeeProfileId) => {
    const response = await apiClient.post('/api/v1/courses/discovery/compare', courseIds, {
      params: { employeeProfileId },
    });
    return response.data;
  },

  getAlternatives: async (courseId) => {
    const response = await apiClient.get(`/api/v1/courses/discovery/alternatives/${courseId}`);
    return response.data;
  },
};

export default courseDiscoveryApi;
