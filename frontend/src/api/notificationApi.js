import api from './client';

export const notificationApi = {
  getMyNotifications: () => api.get('/api/v1/notifications'),
  getUnreadCount: () => api.get('/api/v1/notifications/unread-count'),
  markAsRead: (id) => api.put(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/v1/notifications/read-all'),
};

export default notificationApi;

