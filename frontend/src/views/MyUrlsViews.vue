<!-- eslint-disable no-unused-vars -->
<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My URLs</h1>

      <!-- Search Bar -->
      <div class="mb-6">
        <input v-model="searchQuery" @input="debouncedSearch" type="text" placeholder="Search URLs..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
      </div>

      <!-- URLs List -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short URL
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original URL
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protected
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="url in urls" :key="url.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <a :href="url.shortUrl" target="_blank" class="text-blue-600 hover:underline font-mono text-sm">
                    /{{ url.short_code }}
                  </a>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 truncate max-w-md">
                    {{ url.long_url }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button v-if="url.is_password_protected" @click="managePassword(url)"
                    class="text-amber-600 hover:text-amber-800">
                    🔒 Manage
                  </button>
                  <button v-else @click="managePassword(url)" class="text-gray-400 hover:text-gray-600">
                    Add Password
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {{ url.clicks }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(url.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button @click="copyToClipboard(url.shortUrl)" class="text-blue-600 hover:text-blue-800 mr-3">
                    Copy
                  </button>
                  <button @click="viewAnalytics(url)" class="text-green-600 hover:text-green-800 mr-3">
                    Analytics
                  </button>
                  <button @click="deleteUrl(url.id)" class="text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="urls.length === 0" class="text-center py-8 text-gray-500">
            No URLs found
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Previous
          </button>
          <span class="text-gray-600">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Password Management Modal -->
    <div v-if="selectedUrl" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">
          {{ selectedUrl.is_password_protected ? 'Update Password Protection' : 'Add Password Protection' }}
        </h2>

        <form @submit.prevent="updatePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input v-model="passwordForm.password" type="password" placeholder="Enter password (leave empty to remove)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div v-if="selectedUrl.is_password_protected" class="flex items-center">
            <input v-model="passwordForm.removePassword" type="checkbox" id="removePassword" class="mr-2" />
            <label for="removePassword" class="text-sm text-gray-700">
              Remove password protection
            </label>
          </div>

          <div class="flex justify-end gap-3">
            <button type="button" @click="selectedUrl = null"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Analytics Modal -->
    <div v-if="analyticsData" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">URL Analytics</h2>
          <button @click="analyticsData = null" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p class="text-sm text-gray-600">Short URL</p>
            <p class="font-medium font-mono">{{ analyticsData.url.shortUrl }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Clicks</p>
            <p class="font-medium text-2xl">{{ analyticsData.url.clicks }}</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold mb-4">Recent Clicks</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  IP Address
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Referrer
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="click in analyticsData.clicks" :key="click.id">
                <td class="px-4 py-2 whitespace-nowrap text-sm">
                  {{ formatDate(click.clicked_at) }}
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm">
                  {{ click.ip_address || '-' }}
                </td>
                <td class="px-4 py-2 text-sm">
                  {{ click.referrer || 'Direct' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Navbar from '../components/Navbar.vue';
import api from '../services/api';

const urls = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const selectedUrl = ref(null);
const analyticsData = ref(null);

const passwordForm = ref({
  password: '',
  removePassword: false
});

const fetchUrls = async (page = 1, search = '') => {
  try {
    const response = await api.get('/urls/my-urls', {
      params: { page, limit: 20, search }
    });
    urls.value = response.data.urls;
    currentPage.value = response.data.page;
    totalPages.value = response.data.totalPages;
  } catch (err) {
    console.error('Failed to fetch URLs:', err);
  }
};

const deleteUrl = async (id) => {
  if (!confirm('Are you sure you want to delete this URL?')) return;

  try {
    await api.delete(`/urls/${id}`);
    await fetchUrls(currentPage.value, searchQuery.value);
  } catch (err) {
    alert('Failed to delete URL');
  }
};

const managePassword = (url) => {
  selectedUrl.value = url;
  passwordForm.value = {
    password: '',
    removePassword: false
  };
};

const updatePassword = async () => {
  try {
    await api.put(`/urls/${selectedUrl.value.id}`, passwordForm.value);
    selectedUrl.value = null;
    await fetchUrls(currentPage.value, searchQuery.value);
  } catch (err) {
    alert('Failed to update password');
  }
};

const viewAnalytics = async (url) => {
  try {
    const response = await api.get(`/urls/analytics/${url.id}`);
    analyticsData.value = response.data;
  } catch (err) {
    alert('Failed to fetch analytics');
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    alert('Failed to copy to clipboard');
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchUrls(page, searchQuery.value);
  }
};

let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchUrls(1, searchQuery.value);
  }, 300);
};

onMounted(() => {
  fetchUrls();
});
</script>
