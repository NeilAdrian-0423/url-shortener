import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Dashboard from './views/DashboardViews.vue';
import Login from './views/LoginViews.vue';
import Register from './views/RegisterViews.vue';
import AdminPanel from './views/AdminPanelViews.vue';
import MyUrls from './views/MyUrlsViews.vue';
import Profile from './views/ProfileViews.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/my-urls',
    name: 'MyUrls',
    component: MyUrls,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/');
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next('/');
  } else {
    next();
  }
});

export default router;
