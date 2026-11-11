import apiClient from './client';

export const predictionApi = {
  predictOutcome: async (employeeProfileId, courseId, learningPathId) => {
    const response = await apiClient.post('/api/v1/ml/predict/training-outcome', {
      employeeProfileId,
      courseId,
      learningPathId,
    });
    return response.data;
  },
};

export default predictionApi;
