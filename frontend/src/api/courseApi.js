import apiClient from './client';

export const courseApi = {
  getAllCourses: async () => {
    const response = await apiClient.get('/api/v1/courses');
    return response.data;
  },

  getOwnRecommendations: async () => {
    const response = await apiClient.get('/api/v1/courses/recommendations/me');
    return response.data;
  },

  getEmployeeRecommendations: async (employeeProfileId) => {
    const response = await apiClient.get(`/api/v1/courses/recommendations/employee/${employeeProfileId}`);
    return response.data;
  },

  recommendCourse: async (data) => {
    const response = await apiClient.post('/api/v1/courses/recommend', data);
    return response.data;
  },
};

export default courseApi;
