import apiClient from './client';

export const learningPathApi = {
  getOwnActivePath: async () => {
    const response = await apiClient.get('/api/v1/learning-paths/me');
    return response.data;
  },

  getEmployeeActivePath: async (employeeProfileId) => {
    const response = await apiClient.get(`/api/v1/learning-paths/employee/${employeeProfileId}`);
    return response.data;
  },

  getPathById: async (id) => {
    const response = await apiClient.get(`/api/v1/learning-paths/${id}`);
    return response.data;
  },

  generateOwnPath: async () => {
    const response = await apiClient.post('/api/v1/learning-paths/generate/me');
    return response.data;
  },

  syncOwnPath: async () => {
    const response = await apiClient.post('/api/v1/learning-paths/sync/me');
    return response.data;
  },

  enrollFromPlatform: async (data) => {
    const response = await apiClient.post('/api/v1/learning-paths/enroll/platform', data);
    return response.data;
  },

  syncPlatformEnrollments: async () => {
    const response = await apiClient.post('/api/v1/learning-paths/sync/platform');
    return response.data;
  },

  verifyPlatformCourse: async (courseId, data = {}) => {
    const response = await apiClient.post(`/api/v1/learning-paths/courses/${courseId}/verify-platform`, data);
    return response.data;
  },

  generateEmployeePath: async (employeeProfileId) => {
    const response = await apiClient.post(`/api/v1/learning-paths/generate/employee/${employeeProfileId}`);
    return response.data;
  },

  updateCourseProgress: async (pathId, courseId, progressPercentage) => {
    const response = await apiClient.patch(
      `/api/v1/learning-paths/${pathId}/courses/${courseId}/progress`,
      { progressPercentage }
    );
    return response.data;
  },
};

export default learningPathApi;
