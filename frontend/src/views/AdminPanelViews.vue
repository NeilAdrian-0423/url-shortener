<!-- eslint-disable no-unused-vars -->
<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Total Users</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalUsers }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Total URLs</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalUrls }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Total Clicks</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalClicks }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Today's URLs</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.todayUrls }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button @click="activeTab = 'users'" :class="[
              'py-2 px-6 border-b-2 font-medium text-sm',
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]">
              Users
            </button>
            <button @click="activeTab = 'urls'" :class="[
              'py-2 px-6 border-b-2 font-medium text-sm',
              activeTab === 'urls'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]">
              All URLs
            </button>
            <button @click="activeTab = 'invites'" :class="[
              'py-2 px-6 border-b-2 font-medium text-sm',
              activeTab === 'invites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]">
              Invites
            </button>
          </nav>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="p-6">
          <div class="mb-4 flex justify-between items-center">
            <input v-model="userSearch" @input="searchUsers" type="text" placeholder="Search users..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    URLs
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="user in users" :key="user.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ user.username }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ user.email }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select v-model="user.role" @change="updateUser(user)" class="text-sm border-gray-300 rounded">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ user.urlCount }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button @click="toggleUserStatus(user)" :class="[
                      'px-2 py-1 text-xs rounded-full',
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    ]">
                      {{ user.is_active ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button @click="viewUserDetails(user)" class="text-blue-600 hover:text-blue-800 mr-3">
                      View
                    </button>
                    <button @click="deleteUser(user)" class="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Invites Tab -->
        <div v-if="activeTab === 'invites'" class="p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">Create Invite</h3>
            <form @submit.prevent="createInvite" class="flex gap-4">
              <input v-model="inviteForm.email" type="email" placeholder="Email (optional)"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
              <input v-model.number="inviteForm.expiresIn" type="number" placeholder="Expires in (days)"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg" />
              <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Invite
              </button>
            </form>
          </div>

          <div v-if="newInvite" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-gray-600 mb-2">Invite created successfully!</p>
            <div class="flex items-center gap-4">
              <code class="flex-1 bg-white px-3 py-2 rounded border">
                {{ newInvite.inviteUrl }}
              </code>
              <button @click="copyToClipboard(newInvite.inviteUrl)"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Copy
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created By
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Used By
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="invite in invites" :key="invite.id">
                  <td class="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {{ invite.code }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ invite.email || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      'px-2 py-1 text-xs rounded-full',
                      invite.is_used
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-green-100 text-green-800'
                    ]">
                      {{ invite.is_used ? 'Used' : 'Available' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {{ invite.created_by_username }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {{ invite.used_by_username || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button v-if="!invite.is_used" @click="revokeInvite(invite.id)"
                      class="text-red-600 hover:text-red-800">
                      Revoke
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- URLs Tab -->
        <div v-if="activeTab === 'urls'" class="p-6">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Short URL
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Original URL
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Owner
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Protected
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clicks
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="url in allUrls" :key="url.id">
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {{ url.username }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span v-if="url.is_password_protected" class="text-amber-600">
                      🔒
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">
                      {{ url.clicks }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button @click="deleteUrl(url.id)" class="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="selectedUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">User Details: {{ selectedUser.username }}</h2>
          <button @click="selectedUser = null" class="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p class="text-sm text-gray-600">Email</p>
            <p class="font-medium">{{ selectedUser.email }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Role</p>
            <p class="font-medium">{{ selectedUser.role }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Status</p>
            <p class="font-medium">{{ selectedUser.is_active ? 'Active' : 'Inactive' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Last Login</p>
            <p class="font-medium">{{ formatDate(selectedUser.last_login) }}</p>
          </div>
        </div>

        <h3 class="text-lg font-semibold mb-4">User's URLs</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Short URL
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Original URL
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="url in selectedUser.urls" :key="url.id">
                <td class="px-4 py-2 whitespace-nowrap text-sm">
                  /{{ url.short_code }}
                </td>
                <td class="px-4 py-2 text-sm">
                  <div class="truncate max-w-md">{{ url.long_url }}</div>
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-sm">
                  {{ url.clicks }}
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

const activeTab = ref('users');
const stats = ref({
  totalUsers: 0,
  totalUrls: 0,
  totalClicks: 0,
  todayUrls: 0
});

const users = ref([]);
const allUrls = ref([]);
const invites = ref([]);
const selectedUser = ref(null);
const userSearch = ref('');
const newInvite = ref(null);

const inviteForm = ref({
  email: '',
  expiresIn: null
});

const fetchStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    stats.value = response.data;
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
};

const fetchUsers = async (search = '') => {
  try {
    const response = await api.get('/admin/users', {
      params: { search, limit: 100 }
    });
    users.value = response.data.users;
  } catch (err) {
    console.error('Failed to fetch users:', err);
  }
};

const fetchAllUrls = async () => {
  try {
    const response = await api.get('/admin/all-urls', {
      params: { limit: 100 }
    });
    allUrls.value = response.data.urls;
  } catch (err) {
    console.error('Failed to fetch URLs:', err);
  }
};

const fetchInvites = async () => {
  try {
    const response = await api.get('/invites');
    invites.value = response.data;
  } catch (err) {
    console.error('Failed to fetch invites:', err);
  }
};

const updateUser = async (user) => {
  try {
    await api.put(`/admin/users/${user.id}`, {
      role: user.role,
      is_active: user.is_active
    });
  } catch (err) {
    console.error('Failed to update user:', err);
  }
};

const toggleUserStatus = async (user) => {
  user.is_active = !user.is_active;
  await updateUser(user);
};

const deleteUser = async (user) => {
  if (!confirm(`Are you sure you want to delete user ${user.username}?`)) return;

  try {
    await api.delete(`/admin/users/${user.id}`);
    await fetchUsers();
  } catch (err) {
    alert('Failed to delete user');
  }
};

const viewUserDetails = async (user) => {
  try {
    const response = await api.get(`/admin/users/${user.id}`);
    selectedUser.value = response.data;
  } catch (err) {
    console.error('Failed to fetch user details:', err);
  }
};

const deleteUrl = async (id) => {
  if (!confirm('Are you sure you want to delete this URL?')) return;

  try {
    await api.delete(`/admin/urls/${id}`);
    await fetchAllUrls();
  } catch (err) {
    alert('Failed to delete URL');
  }
};

const createInvite = async () => {
  try {
    const response = await api.post('/invites/create', inviteForm.value);
    newInvite.value = response.data;
    inviteForm.value = { email: '', expiresIn: null };
    await fetchInvites();

    setTimeout(() => {
      newInvite.value = null;
    }, 10000);
  } catch (err) {
    alert('Failed to create invite');
  }
};

const revokeInvite = async (id) => {
  if (!confirm('Are you sure you want to revoke this invite?')) return;

  try {
    await api.delete(`/invites/${id}`);
    await fetchInvites();
  } catch (err) {
    alert('Failed to revoke invite');
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (err) {
    alert('Failed to copy to clipboard');
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

let searchTimeout;
const searchUsers = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchUsers(userSearch.value);
  }, 300);
};

onMounted(() => {
  fetchStats();
  fetchUsers();
  fetchAllUrls();
  fetchInvites();
});
</script>
