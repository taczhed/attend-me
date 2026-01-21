import { createRouter, createWebHistory } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/teacher/session/:id',
      name: 'teacher-session-details',
      component: () => import('@/views/teacher/TeacherSessionDetails.vue'),
    },
    {
      path: '/teacher/session/:id/scan',
      name: 'teacher-qr-scanner',
      component: () => import('@/views/teacher/TeacherQRScanner.vue'),
    },
    {
      path: '/teacher/device-token',
      name: 'teacher-device-token',
      component: () => import('@/views/teacher/TeacherDeviceTokenGenerator.vue'),
    },
    {
      path: '/student/device-register',
      name: 'student-device-register',
      component: () => import('@/views/student/StudentDeviceRegister.vue'),
    },
    {
      path: '/student/course/:groupId',
      name: 'student-session-details',
      component: () => import('@/views/student/StudentSessionDetails.vue'),
    },
    {
      path: '/student/attendance-qr',
      name: 'student-attendance-qr',
      component: () => import('@/views/student/StudentAttendanceQR.vue'),
    },
  ],
})

ApiClient.onUnauthorized = () => router.push({ name: 'login' })

export default router
