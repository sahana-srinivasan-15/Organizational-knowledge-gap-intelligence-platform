import apiClient from './client';

export const mentoringTrackingApi = {
  getSessions: async (assignmentId) => {
    const response = await apiClient.get(`/api/v1/mentoring-tracking/assignments/${assignmentId}/sessions`);
    return response.data;
  },

  createSession: async (sessionData) => {
    const response = await apiClient.post('/api/v1/mentoring-tracking/sessions', sessionData);
    return response.data;
  },

  getMilestones: async (assignmentId) => {
    const response = await apiClient.get(`/api/v1/mentoring-tracking/assignments/${assignmentId}/milestones`);
    return response.data;
  },

  createMilestone: async (milestoneData) => {
    const response = await apiClient.post('/api/v1/mentoring-tracking/milestones', milestoneData);
    return response.data;
  },

  updateMilestoneStatus: async (milestoneId, status) => {
    const response = await apiClient.patch(
      `/api/v1/mentoring-tracking/milestones/${milestoneId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  },
};

export default mentoringTrackingApi;
