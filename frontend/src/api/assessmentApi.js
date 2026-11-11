import apiClient from './client';

export const assessmentApi = {
  getAllAssessments: async () => {
    const response = await apiClient.get('/api/v1/assessments');
    return response.data;
  },

  getEligibleCourses: async () => {
    const response = await apiClient.get('/api/v1/assessments/courses');
    return response.data;
  },

  getAssessmentForCourse: async (courseId) => {
    const response = await apiClient.get(`/api/v1/assessments/course/${courseId}`);
    return response.data;
  },

  startCourseAttempt: async (courseId) => {
    const response = await apiClient.post(`/api/v1/assessments/course/${courseId}/start`);
    return response.data;
  },

  getCourseHistory: async (courseId) => {
    const response = await apiClient.get(`/api/v1/assessments/course/${courseId}/history`);
    return response.data;
  },

  getAssessmentsForSkill: async (skillId) => {
    const response = await apiClient.get(`/api/v1/assessments/skill/${skillId}`);
    return response.data;
  },

  getAssessmentById: async (id) => {
    const response = await apiClient.get(`/api/v1/assessments/${id}`);
    return response.data;
  },

  getQuestionsSafe: async (id) => {
    const response = await apiClient.get(`/api/v1/assessments/${id}/questions`);
    return response.data;
  },

  generateQuestionsForCourse: async (courseId, count = 5) => {
    const response = await apiClient.post(`/api/v1/assessments/course/${courseId}/generate-questions?count=${count}`);
    return response.data;
  },

  generateQuestionsForAssessment: async (assessmentId, count = 5) => {
    const response = await apiClient.post(`/api/v1/assessments/${assessmentId}/generate-questions?count=${count}`);
    return response.data;
  },

  startAttempt: async (id) => {
    const response = await apiClient.post(`/api/v1/assessments/${id}/start`);
    return response.data;
  },

  submitAssessment: async (id, submissionData) => {
    const response = await apiClient.post(`/api/v1/assessments/${id}/submit`, submissionData);
    return response.data;
  },

  getOwnHistory: async () => {
    const response = await apiClient.get('/api/v1/assessments/history/me');
    return response.data;
  },

  getEmployeeHistory: async (employeeProfileId) => {
    const response = await apiClient.get(`/api/v1/assessments/history/employee/${employeeProfileId}`);
    return response.data;
  },
};

export default assessmentApi;
