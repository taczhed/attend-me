<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import type { CourseSessionListItem, AttendanceLog } from '@/backend/ApiClientBase'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatDatePL, formatTimePL } from '@/utils/dateHelpers'

const route = useRoute()
const router = useRouter()

const courseGroupId = Number(route.params.groupId)
const sessions = ref<CourseSessionListItem[]>([])
const attendanceLogs = ref<AttendanceLog[]>([])
const isLoading = ref(true)
const error = ref('')

async function fetchSessionDetails() {
  isLoading.value = true
  error.value = ''

  try {
    const sessionsData = await ApiClient.courseStudentGroupSessionsGet(courseGroupId)
    const attendanceData = await ApiClient.courseStudentAttendanceGet(courseGroupId)

    sessions.value = sessionsData
    attendanceLogs.value = attendanceData
  } catch (err) {
    console.error('Failed to fetch session details', err)
    error.value = 'Nie udało się pobrać szczegółów zajęć'
  } finally {
    isLoading.value = false
  }
}

function isSessionPresent(sessionId: number | undefined): boolean {
  if (!sessionId) {
    return false
  }
  const log = attendanceLogs.value.find((log) => log.courseSessionId === sessionId)
  return log !== undefined
}

function getSessionDate(sessionId: number | undefined): Date | undefined {
  if (!sessionId) {
    return undefined
  }
  const session = sessions.value.find((s) => s.courseSessionId === sessionId)
  return session?.dateStart
}

const attendanceRate = computed(() => {
  const totalSessions = sessions.value.length
  const presentCount = sessions.value.filter((session) =>
    isSessionPresent(session.courseSessionId),
  ).length
  const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0
  return { present: presentCount, total: totalSessions, percentage }
})

const courseProgress = computed(() => {
  const total = sessions.value.length
  const now = new Date()
  const past = sessions.value.filter((s) => s.dateEnd && new Date(s.dateEnd) < now).length
  return total > 0 ? Math.round((past / total) * 100) : 0
})

const completedSessionsCount = computed(() => {
  const now = new Date()
  return sessions.value.filter((s) => s.dateEnd && new Date(s.dateEnd) < now).length
})

const currentSession = computed<CourseSessionListItem | null>(() => {
  const now = new Date()
  const session = sessions.value.find((s) => {
    if (!s.dateStart || !s.dateEnd) {
      return false
    }
    const start = new Date(s.dateStart)
    const end = new Date(s.dateEnd)
    return start <= now && now <= end
  })
  return session || null
})

const isCurrentlyPresent = computed(() => {
  if (!currentSession.value) {
    return false
  }
  return isSessionPresent(currentSession.value.courseSessionId)
})

const reversedAttendanceLogs = computed(() => {
  const logsCopy = [...attendanceLogs.value]
  return logsCopy.reverse()
})

function openAttendanceQR() {
  router.push({ name: 'student-attendance-qr' })
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
      <div class="w-full max-w-4xl">
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

        <div v-else-if="sessions.length > 0" class="space-y-6">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h1 class="text-3xl font-bold text-secondary-900 mb-4">
              {{ sessions[0]?.courseName }}
            </h1>
            <div class="space-y-2 text-gray-700">
              <p class="flex items-center gap-2">
                <span class="font-semibold">Grupa:</span>
                <span>{{ sessions[0]?.courseGroupName }}</span>
              </p>
            </div>
          </div>

          <div v-if="currentSession" class="bg-primary-50 border border-primary-200 p-6 rounded-lg">
            <h2 class="text-xl font-semibold mb-3 text-primary-900">Aktualne zajęcia</h2>
            <div class="space-y-2">
              <p class="text-gray-700">
                <span class="font-semibold">Termin:</span>
                {{ formatDatePL(currentSession.dateStart) }}
                {{ formatTimePL(currentSession.dateStart) }}
                -
                {{ formatTimePL(currentSession.dateEnd) }}
              </p>
              <p class="text-gray-700">
                <span class="font-semibold">Status:</span>
                <span
                  v-if="isCurrentlyPresent"
                  class="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                >
                  Obecny
                </span>
                <span
                  v-else
                  class="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                >
                  Nieobecny
                </span>
              </p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-xl font-semibold mb-3 text-gray-800">Frekwencja całkowita</h2>
              <div class="text-4xl font-bold text-primary-600 mb-2">
                {{ attendanceRate.percentage }}%
              </div>
              <p class="text-gray-600">
                {{ attendanceRate.present }} / {{ attendanceRate.total }} zajęć
              </p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-xl font-semibold mb-3 text-gray-800">Zaawansowanie kursu</h2>
              <div class="text-4xl font-bold text-secondary-600 mb-2">{{ courseProgress }}%</div>
              <p class="text-gray-600">
                Ukończono {{ completedSessionsCount }} / {{ sessions.length }} zajęć
              </p>
            </div>
          </div>

          <div class="flex gap-4">
            <BaseButton @click="fetchSessionDetails" variant="secondary">Odśwież</BaseButton>
            <BaseButton @click="openAttendanceQR" variant="primary">
              Rejestruj obecność
            </BaseButton>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-gray-800">Historia obecności</h2>

            <div v-if="attendanceLogs.length === 0" class="text-center py-8 text-gray-500">
              Brak historii obecności
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="log in reversedAttendanceLogs"
                :key="log.courseSessionId"
                class="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p class="font-medium text-gray-900">
                    {{ formatDatePL(getSessionDate(log.courseSessionId)) }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ formatTimePL(getSessionDate(log.courseSessionId)) }}
                  </p>
                </div>
                <div>
                  <span
                    class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    Obecny
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">Brak danych o zajęciach</div>
      </div>
    </main>
  </div>
</template>
