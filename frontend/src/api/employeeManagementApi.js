import apiClient from './client';

export const employeeManagementApi = {
  getEmployees: async (params = {}) => {
    const response = await apiClient.get('/api/v1/manager/employees', {
      params: { size: 100, ...params },
    });
    return response.data;
  },

  provisionEmployee: async (formData) => {
    const response = await apiClient.post('/api/v1/manager/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDepartments: async () => {
    const response = await apiClient.get('/api/v1/departments');
    return response.data;
  },

  getJobRoles: async (departmentId) => {
    const response = await apiClient.get('/api/v1/job-roles', {
      params: departmentId ? { departmentId } : {},
    });
    return response.data;
  },

  downloadResume: async (userId, filename = 'resume.pdf') => {
    const response = await apiClient.get(`/api/v1/employees/${userId}/resume`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'resume.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1500);
  },

  viewResume: async (userId) => {
    const response = await apiClient.get(`/api/v1/employees/${userId}/resume`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/pdf',
    });
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60000);
  },

  getResumeUrl: (userId) => `/api/v1/employees/${userId}/resume`,
};

export default employeeManagementApi;
