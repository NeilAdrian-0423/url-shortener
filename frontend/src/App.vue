<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import api from './services/api';

const authStore = useAuthStore();

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      await authStore.fetchUser();
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  }
});
</script>
