import apiClient from './client';

export const mentorshipApi = {
  getOwnRecommendations: async () => {
    const response = await apiClient.get('/api/v1/mentorship/recommendations/me');
    return response.data;
  },

  getEmployeeRecommendations: async (employeeProfileId) => {
    const response = await apiClient.get(`/api/v1/mentorship/recommendations/${employeeProfileId}`);
    return response.data;
  },

  getAssignments: async (status) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/api/v1/mentorship/assignments', { params });
    return response.data;
  },

  createRecommendationAssignment: async (menteeId, mentorId, skillId, notes) => {
    const response = await apiClient.post('/api/v1/mentorship/assignments/recommend', {
      menteeProfileId: menteeId,
      mentorProfileId: mentorId,
      menteeId,
      mentorId,
      skillId,
      notes,
    });
    return response.data;
  },

  approveAssignment: async (assignmentId) => {
    const response = await apiClient.put(`/api/v1/mentorship/assignments/${assignmentId}/approve`);
    return response.data;
  },

  rejectAssignment: async (assignmentId) => {
    const response = await apiClient.put(`/api/v1/mentorship/assignments/${assignmentId}/reject`);
    return response.data;
  },

  autoGenerateAssignments: async () => {
    const response = await apiClient.post('/api/v1/mentorship/assignments/auto-generate');
    return response.data;
  },

  getCompanyMentorsCount: async () => {
    const response = await apiClient.get('/api/v1/mentorship/company-mentors/count');
    return response.data;
  },
};

export default mentorshipApi;
