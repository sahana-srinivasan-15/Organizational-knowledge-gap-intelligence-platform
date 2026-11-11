import apiClient from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/api/v1/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  },

  getEmployeeProfile: async () => {
    const response = await apiClient.get('/api/v1/employees/me/profile');
    return response.data;
  },

  updateEmployeeProfile: async (profileData) => {
    const response = await apiClient.put('/api/v1/employees/me/profile', profileData);
    return response.data;
  },

  updateMentorStatus: async (mentorData) => {
    const response = await apiClient.put('/api/v1/employees/me/mentor-status', mentorData);
    return response.data;
  },

  getMentorEligibility: async () => {
    const response = await apiClient.get('/api/v1/employees/me/mentor-eligibility');
    return response.data;
  },

  getMentorCourses: async () => {
    const response = await apiClient.get('/api/v1/employees/me/mentor-courses');
    return response.data;
  },

  getProfileMentorCourses: async (profileId) => {
    const response = await apiClient.get(`/api/v1/employees/profiles/${profileId}/mentor-courses`);
    return response.data;
  },
};

export default authApi;
