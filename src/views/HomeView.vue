<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { ApiClient } from '@/backend/ApiClient.ts'
import type { User } from '@/backend/ApiClientBase.ts'
import AppHeader from '@/components/AppHeader.vue'
import TeacherDashboard from '@/components/teacher/TeacherDashboard.vue'
import StudentDashboard from '@/components/student/StudentDashboard.vue'
import { useRouter } from 'vue-router'

const currentUser = ref<User | null>(null)
const isLoading = ref(true)

const router = useRouter()

watchEffect(() => {
  ApiClient.userGet()
    .then((user) => {
      currentUser.value = user
      console.log(user)
    })
    .catch((err) => {
      console.error('Failed to fetch user', err)
    })
    .finally(() => {
      isLoading.value = false
    })
})

function logout() {
  ApiClient.userLogout()
  currentUser.value = null
  router.replace('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-secondary-50">
    <AppHeader :user="currentUser" @logout="logout" />

    <!-- Main Content -->
    <main class="flex-grow flex flex-col items-center pt-8 px-4 pb-8">
      <div v-if="isLoading" class="text-xl text-secondary-600 mt-10">Ładowanie...</div>

      <TeacherDashboard v-else-if="currentUser?.isTeacher" :user="currentUser" />

      <StudentDashboard v-else-if="currentUser?.isStudent" :user="currentUser" />

      <div v-else class="text-center mt-20">
        <h1 class="text-4xl font-bold text-secondary-900 mb-4">Witaj w AttendMe</h1>
        <p class="text-xl text-gray-600 mb-8">Zaloguj się, aby uzyskać dostęp do panelu.</p>
        <router-link
          to="/login"
          class="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md"
        >
          Zaloguj się
        </router-link>
      </div>
    </main>
  </div>
</template>
