import apiClient from './client';

export const skillGapApi = {
  getOwnSkillGaps: async () => {
    const response = await apiClient.get('/api/v1/skills/gaps/me');
    return response.data;
  },

  getEmployeeSkillGaps: async (employeeProfileId) => {
    const response = await apiClient.get(`/api/v1/skills/gaps/employee/${employeeProfileId}`);
    return response.data;
  },

  conductResumeAssessment: async (data = {}) => {
    const response = await apiClient.post('/api/v1/skills/gaps/conduct-resume-assessment', data);
    return response.data;
  },

  sendGapReportToManager: async (data = {}) => {
    const response = await apiClient.post('/api/v1/skills/gaps/send-to-manager', data);
    return response.data;
  },

  resetMyJourney: async () => {
    const response = await apiClient.post('/api/v1/skills/gaps/reset-journey');
    return response.data;
  },
};

export default skillGapApi;
