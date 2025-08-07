<!-- eslint-disable no-unused-vars -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
      <h2 class="text-3xl font-bold text-center mb-8">Create Account</h2>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Invite Code
          </label>
          <input v-model="formData.inviteCode" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            :class="{ 'border-green-500': inviteValid }" />
          <p v-if="inviteValid" class="text-green-600 text-sm mt-1">
            ✓ Valid invite code
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input v-model="formData.username" type="text" required pattern="[a-zA-Z0-9_-]+"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input v-model="formData.email" type="email" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input v-model="formData.password" type="password" required minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600 text-sm">{{ error }}</p>
        </div>

        <button type="submit" :disabled="loading || !formData.inviteCode"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-600">
          Already have an account?
          <router-link to="/login" class="text-blue-600 hover:underline">
            Login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formData = ref({
  inviteCode: '',
  username: '',
  email: '',
  password: ''
});

const loading = ref(false);
const error = ref('');
const inviteValid = ref(false);

// Check invite code from URL
onMounted(() => {
  if (route.query.invite) {
    formData.value.inviteCode = route.query.invite;
    validateInvite();
  }
});

// Watch invite code changes
let validateTimeout;
watch(() => formData.value.inviteCode, () => {
  clearTimeout(validateTimeout);
  validateTimeout = setTimeout(validateInvite, 500);
});

const validateInvite = async () => {
  if (!formData.value.inviteCode) return;

  try {
    const response = await api.get(`/invites/validate/${formData.value.inviteCode}`);
    inviteValid.value = response.data.valid;
    if (response.data.email) {
      formData.value.email = response.data.email;
    }
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    inviteValid.value = false;
  }
};

const handleRegister = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authStore.register(formData.value);
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.error || 'Registration failed';
  } finally {
    loading.value = false;
  }
};
</script>
