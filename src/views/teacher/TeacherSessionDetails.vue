<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { CourseSessionListItem, CourseSessionAttendanceRecord } from '@/backend/ApiClientBase'

const route = useRoute()
const router = useRouter()

const sessionId = Number(route.params.id)
const session = ref<CourseSessionListItem | null>(null)
const attendanceList = ref<CourseSessionAttendanceRecord[]>([])
const isLoading = ref(true)
const error = ref('')

async function fetchSessionDetails() {
  isLoading.value = true
  error.value = ''

  try {
    const sessionData = await ApiClient.courseTeacherSessionGet(sessionId)
    session.value = sessionData

    const attendance = await ApiClient.courseSessionAttendanceListGet(sessionId)
    attendanceList.value = attendance
  } catch (err) {
    console.error('Failed to fetch session details', err)
    error.value = 'Nie udało się pobrać szczegółów zajęć'
  } finally {
    isLoading.value = false
  }
}

function openScanner() {
  router.push({ name: 'teacher-qr-scanner', params: { id: sessionId } })
}

function goBack() {
  router.push('/')
}

onMounted(() => {
  fetchSessionDetails()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-secondary-50">
    <AppHeader />

    <main class="flex-grow flex flex-col items-center pt-8 px-4 pb-8">
      <div class="w-full max-w-5xl">
        <div class="mb-6">
          <BaseButton @click="goBack" variant="secondary">Powrót</BaseButton>
        </div>

        <div v-if="isLoading" class="text-center py-12 text-gray-500">
          Ładowanie szczegółów zajęć...
        </div>

        <div
          v-else-if="error"
          class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg"
        >
          {{ error }}
        </div>

        <div v-else-if="session" class="space-y-6">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-3xl font-bold text-secondary-900 mb-4">{{ session.courseName }}</h1>
            <div class="space-y-2 text-gray-700">
              <p class="flex items-center gap-2">
                <span class="font-semibold">Grupa:</span>
                <span>{{ session.courseGroupName }}</span>
              </p>
              <p class="flex items-center gap-2">
                <span class="font-semibold">Lokalizacja:</span>
                <span>{{ session.locationName }}</span>
              </p>
              <p class="flex items-center gap-2">
                <span class="font-semibold">Termin:</span>
                <span>
                  {{
                    session.dateStart ? new Date(session.dateStart).toLocaleDateString('pl-PL') : ''
                  }}
                  {{
                    session.dateStart
                      ? new Date(session.dateStart).toLocaleTimeString('pl-PL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''
                  }}
                  -
                  {{
                    session.dateEnd
                      ? new Date(session.dateEnd).toLocaleTimeString('pl-PL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''
                  }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex gap-4">
            <BaseButton @click="fetchSessionDetails" variant="secondary">Odśwież</BaseButton>
            <BaseButton @click="openScanner" variant="primary">Skanowanie</BaseButton>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-gray-800">Lista obecności</h2>

            <div v-if="attendanceList.length === 0" class="text-center py-8 text-gray-500">
              Brak studentów przypisanych do zajęć
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Imię</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Nr indeksu</th>
                    <th class="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="record in attendanceList"
                    :key="record.attenderUserId"
                    class="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td class="py-3 px-4">{{ record.userName + ' ' + record.userSurname }}</td>
                    <td class="py-3 px-4 text-gray-600">{{ record.studentAlbumIdNumber }}</td>
                    <td class="py-3 px-4 text-center">
                      <span
                        v-if="record.wasUserPresent"
                        class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                      >
                        Obecny
                      </span>
                      <span
                        v-else
                        class="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                      >
                        Nieobecny
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
