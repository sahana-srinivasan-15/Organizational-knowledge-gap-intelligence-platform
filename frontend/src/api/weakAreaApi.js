import apiClient from './client';

export const weakAreaApi = {
  getMyWeakAreas: async () => {
    const res = await apiClient.get('/api/v1/weak-areas/me');
    return res.data;
  },

  getEmployeeWeakAreas: async (employeeProfileId) => {
    const res = await apiClient.get(`/api/v1/weak-areas/employee/${employeeProfileId}`);
    return res.data;
  },

  submitReview: async (skillId, data) => {
    const res = await apiClient.post(`/api/v1/weak-areas/skill/${skillId}/review`, data);
    return res.data;
  },

  submitMentorFeedback: async (employeeProfileId, skillId, data) => {
    const res = await apiClient.post(`/api/v1/weak-areas/employee/${employeeProfileId}/skill/${skillId}/mentor-feedback`, data);
    return res.data;
  },
};

export default weakAreaApi;

