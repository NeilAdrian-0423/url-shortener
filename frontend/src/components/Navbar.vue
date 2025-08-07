<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center">
            <span class="text-2xl">🔗</span>
            <span class="ml-2 text-xl font-bold text-gray-900">URL Shortener</span>
          </router-link>

          <div class="ml-10 flex items-baseline space-x-4">
            <router-link to="/" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </router-link>
            <router-link to="/my-urls"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              My URLs
            </router-link>
            <router-link v-if="user?.role === 'admin'" to="/admin"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Admin Panel
            </router-link>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <div class="relative">
            <button @click="showDropdown = !showDropdown"
              class="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none">
              <span class="mr-2">{{ user?.username }}</span>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>

            <div v-if="showDropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <router-link to="/profile" @click="showDropdown = false"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile
              </router-link>
              <button @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const showDropdown = ref(false);

const user = computed(() => authStore.user);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>
