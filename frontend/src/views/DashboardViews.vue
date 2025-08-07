<!-- eslint-disable vue/multi-word-component-names -->

<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Create URL Form -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-bold mb-6">Create Short URL</h2>

        <form @submit.prevent="createUrl" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Long URL
            </label>
            <input v-model="formData.url" type="url" required placeholder="https://example.com/very-long-url"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Custom Alias (Optional)
              </label>
              <div class="flex">
                <span
                  class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {{ baseUrl }}/
                </span>
                <input v-model="formData.customAlias" type="text" placeholder="custom-name" pattern="[a-zA-Z0-9-_]+"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Password Protection (Optional)
              </label>
              <input v-model="formData.password" type="password" placeholder="Leave empty for no password"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button type="submit" :disabled="loading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50">
            {{ loading ? 'Creating...' : 'Create Short URL' }}
          </button>
        </form>

        <!-- Result Display -->
        <div v-if="result" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Short URL created!</p>
              <a :href="result.shortUrl" target="_blank" class="text-lg font-mono text-blue-600 hover:underline">
                {{ result.shortUrl }}
              </a>
              <p v-if="result.isPasswordProtected" class="text-sm text-amber-600 mt-1">
                🔒 Password protected
              </p>
            </div>
            <button @click="copyToClipboard(result.shortUrl)"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              {{ copied ? '✓ Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600">{{ error }}</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Total URLs</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalUrls }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Total Clicks</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalClicks }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Created Today</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.todayUrls }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import api from '../services/api';

const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const formData = ref({
  url: '',
  customAlias: '',
  password: ''
});

const result = ref(null);
const loading = ref(false);
const error = ref('');
const copied = ref(false);
const stats = ref({
  totalUrls: 0,
  totalClicks: 0,
  todayUrls: 0
});

const createUrl = async () => {
  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const response = await api.post('/urls/shorten', formData.value);
    result.value = response.data;
    formData.value = { url: '', customAlias: '', password: '' };
    fetchStats();
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create URL';
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const myUrls = await api.get('/urls/my-urls');
    stats.value.totalUrls = myUrls.data.total;
    stats.value.totalClicks = myUrls.data.urls.reduce((sum, url) => sum + url.clicks, 0);
    stats.value.todayUrls = myUrls.data.urls.filter(url => {
      const created = new Date(url.created_at);
      const today = new Date();
      return created.toDateString() === today.toDateString();
    }).length;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    alert('Failed to copy to clipboard');
  }
};

onMounted(() => {
  fetchStats();
});
</script>
