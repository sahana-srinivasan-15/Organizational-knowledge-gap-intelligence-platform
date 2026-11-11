import apiClient from './client';

export const certificateApi = {
  uploadCertificate: async (formData) => {
    const response = await apiClient.post('/api/v1/certificates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyCertificates: async () => {
    const response = await apiClient.get('/api/v1/certificates/my-certificates');
    return response.data;
  },

  getDownloadUrl: (id) => `/api/v1/certificates/download/${id}`,

  downloadCertificate: async (id, filename = 'certificate.pdf') => {
    const response = await apiClient.get(`/api/v1/certificates/download/${id}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'certificate.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default certificateApi;

