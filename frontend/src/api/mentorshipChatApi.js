import api from './client';

export const mentorshipChatApi = {
  getMessages: (assignmentId) => api.get(`/api/v1/mentorship-chat/${assignmentId}/messages`),
  sendMessage: (assignmentId, data) => api.post(`/api/v1/mentorship-chat/${assignmentId}/messages`, data),
};

export default mentorshipChatApi;

