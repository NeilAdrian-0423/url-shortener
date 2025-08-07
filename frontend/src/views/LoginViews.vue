<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-2xl">
      <h2 class="mb-8 text-3xl font-bold text-center">Welcome Back</h2>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">
            Username or Email
          </label>
          <input v-model="credentials.username" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input v-model="credentials.password" type="password" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div v-if="error" class="p-3 border border-red-200 rounded-lg bg-red-50">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <button type="submit" :disabled="loading"
          class="w-full px-4 py-2 text-white transition duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          Don't have an account?
          <router-link to="/register" class="text-blue-600 hover:underline">
            Register with invite code
          </router-link>
        </p>
      </div>

      <div class="p-3 mt-4 bg-gray-100 rounded-lg">
        <p class="text-xs text-gray-600">
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref({
  username: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.login(credentials.value);
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>
