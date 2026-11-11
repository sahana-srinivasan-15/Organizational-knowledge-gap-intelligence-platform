import apiClient from './client';
import adminApi from './adminApi';

export const adminPerformanceApi = {
  getOverview: async () => {
    const response = await apiClient.get('/api/v1/admin/performance/overview');
    return response.data;
  },

  inquireManager: async ({ userId, inquiryQuestion }) => {
    const response = await apiClient.post('/api/v1/admin/performance/inquire-manager', {
      userId,
      inquiryQuestion,
    });
    return response.data;
  },

  acceptReason: async ({ userId, extensionDays = 30, approvalNotes = '' }) => {
    const response = await apiClient.post('/api/v1/admin/performance/accept-reason', {
      userId,
      extensionDays,
      approvalNotes,
    });
    return response.data;
  },

  grantReward: async ({ userId, recipientRole, rewardType, amount, citation }) => {
    const response = await apiClient.post('/api/v1/admin/performance/reward', {
      userId,
      recipientRole,
      rewardType,
      amount,
      citation,
    });
    return response.data;
  },

  appreciatePersonnel: async ({ userId, recipientRole, message, badgeCategory }) => {
    const response = await apiClient.post('/api/v1/admin/performance/appreciate', {
      userId,
      recipientRole,
      message,
      badgeCategory,
    });
    return response.data;
  },

  terminateEmployee: async (userId) => {
    return adminApi.deleteUser(userId);
  },
};

export default adminPerformanceApi;

