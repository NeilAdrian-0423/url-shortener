import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token')
  }),

  actions: {
    async login(credentials) {
      const response = await api.post('/auth/login', credentials);
      this.token = response.data.token;
      this.user = response.data.user;
      this.isAuthenticated = true;
      localStorage.setItem('token', this.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      return response.data;
    },

    async register(data) {
      const response = await api.post('/auth/register', data);
      this.token = response.data.token;
      this.user = response.data.user;
      this.isAuthenticated = true;
      localStorage.setItem('token', this.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      return response.data;
    },


    async fetchUser() {
      try {
        const response = await api.get('/auth/me');
        this.user = response.data;
        return response.data;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }
});
