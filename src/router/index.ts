import { createRouter, createWebHistory } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient.ts'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'

import StudentSessionDetails from '@/components/student/StudentSessionDetails.vue'
import TeacherSessionDetails from '@/components/teacher/TeacherSessionDetails.vue'
import TeacherScanner from '@/components/teacher/TeacherScanner.vue'
import StudentDeviceRegister from '@/components/student/StudentDeviceRegister.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'home', component: HomeView },

    { path: '/student/session/:sessionId', name: 'student-session-details', component: StudentSessionDetails },

    { path: '/teacher/session/:sessionId', name: 'teacher-session-details', component: TeacherSessionDetails },
    { path: '/teacher/scanner', name: 'teacher-scanner', component: TeacherScanner },
    {
      path: '/student/device-register',
      name: 'student-device-register',
      component: StudentDeviceRegister,
    },

  ],
})

ApiClient.onUnauthorized = () => router.push({ name: 'login' })

export default router
