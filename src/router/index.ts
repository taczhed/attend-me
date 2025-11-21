import { createRouter, createWebHistory } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient.ts'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
  ],
})

ApiClient.onUnauthorized = () => router.push({ name: 'login' })

export default router
