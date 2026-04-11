import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Lobby API
export const lobbyAPI = {
  create: (data) => api.post('/lobby', data),
  list: () => api.get('/lobby'),
  completed: () => api.get('/lobby/completed'),
  delete: (id) => api.delete(`/lobby/${id}`),
  get: (id) => api.get(`/lobby/${id}`),
  join: (code) => api.post('/lobby/join', { code }),
  leave: (id) => api.delete(`/lobby/${id}/leave`),
  updateSettings: (id, data) => api.patch(`/lobby/${id}/settings`, data),
};

// Player API
export const playerAPI = {
  list: (params) => api.get('/players', { params }),
  get: (id) => api.get(`/players/${id}`),
};

// Auction API
export const auctionAPI = {
  getState: (lobbyId) => api.get(`/auction/${lobbyId}`),
  getResults: (lobbyId) => api.get(`/auction/${lobbyId}/results`),
};

export default api;
