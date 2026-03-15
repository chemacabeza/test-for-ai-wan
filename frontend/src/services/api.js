import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ── Video Jobs ────────────────────────────────────────────────────────────────

export const createTextToVideoJob = (data) =>
  api.post('/videos/text-to-video', data).then((r) => r.data);

export const createImageToVideoJob = (data) =>
  api.post('/videos/image-to-video', data).then((r) => r.data);

export const getAllJobs = () =>
  api.get('/videos').then((r) => r.data);

export const getJobById = (id) =>
  api.get(`/videos/${id}`).then((r) => r.data);

export const cancelJob = (id) =>
  api.delete(`/videos/${id}/cancel`).then((r) => r.data);

export const deleteJob = (id) =>
  api.delete(`/videos/${id}`);

// ── fal.ai File Upload (direct, using fal.ai's REST file API) ─────────────────
// For I2V we need a publicly accessible image URL.
// We upload directly to fal.ai's CDN from the frontend using a proxy approach.
// The backend exposes a proxy endpoint so the API key never leaves the server.

export const uploadImageToFal = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/videos/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
};

export default api;
