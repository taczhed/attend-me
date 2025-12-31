<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import type { CourseSessionListItem, AttendanceLog } from '@/backend/ApiClientBase'
import StudentRegisterAttendance from '@/components/student/StudentRegisterAttendance.vue'

const route = useRoute()

const sessionId = computed(() => Number(route.params.sessionId))
const courseGroupId = computed(() => Number(route.query.courseGroupId))

const session = ref<CourseSessionListItem | null>(null)
const attendance = ref<AttendanceLog[]>([])
const isLoading = ref(true)
const showRegister = ref(false)

const headerTitle = computed(() => {
  const s = session.value
  if (!s) return 'Szczegóły zajęć'
  return `${s.courseName ?? ''} — ${s.courseGroupName ?? ''}`.trim()
})

const isPresent = computed(() => {
  if (!session.value?.courseSessionId) return false
  return attendance.value.some((a) => a.courseSessionId === session.value?.courseSessionId)
})

async function loadData() {
  isLoading.value = true

  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) {
    isLoading.value = false
    return
  }

  if (!Number.isFinite(courseGroupId.value) || courseGroupId.value <= 0) {
    isLoading.value = false
    return
  }

  try {
    const sessions = await ApiClient.courseStudentGroupSessionsGet(courseGroupId.value)
    session.value = sessions.find((s) => s.courseSessionId === sessionId.value) ?? null

    attendance.value = await ApiClient.courseStudentAttendanceGet(courseGroupId.value)
  } catch (e) {
    console.error('Błąd ładowania szczegółów zajęć', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="w-full max-w-5xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary-900">Szczegóły zajęć</h1>
        <p class="text-gray-600">{{ headerTitle }}</p>
      </div>

      <button
        class="px-4 py-2 rounded-lg bg-green-700 text-white"
        @click="showRegister = !showRegister"
      >
        Rejestruj obecność
      </button>
    </div>

    <div v-if="!Number.isFinite(sessionId) || sessionId <= 0" class="alert error">
      Brak poprawnego sessionId w URL.
    </div>

    <div v-else-if="!Number.isFinite(courseGroupId) || courseGroupId <= 0" class="alert error">
      Brak courseGroupId w URL (query). Wróć do listy i wejdź ponownie w zajęcia.
    </div>

    <div v-else-if="isLoading" class="text-center py-8 text-gray-500">Ładowanie...</div>

    <div v-else-if="!session" class="alert error">
      Nie znaleziono tej sesji w grupie (sessionId={{ sessionId }}).
    </div>

    <div v-else class="space-y-4">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold mb-4">Wybrane zajęcia</h2>

        <div class="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
          <div>
            <div class="font-medium text-gray-900">
              {{ session.dateStart ? new Date(session.dateStart).toLocaleDateString() : '' }}
              |
              {{
                session.dateStart
                  ? new Date(session.dateStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''
              }}
              -
              {{
                session.dateEnd
                  ? new Date(session.dateEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''
              }}
            </div>
            <div class="text-sm text-gray-500">{{ session.locationName }}</div>
          </div>

          <span
            class="px-3 py-1 rounded-full text-sm"
            :class="isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
          >
            {{ isPresent ? 'Obecny' : 'Brak' }}
          </span>
        </div>
      </div>

      <div v-if="showRegister" class="bg-white p-6 rounded-lg shadow-md space-y-3">
        <div class="text-sm text-gray-600">
          Kod QR jest generowany dla aktualnie aktywnych zajęć (backend decyduje).
        </div>
        <StudentRegisterAttendance />
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert {
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
.alert.error {
  background: #ffe9e9;
  border: 1px solid #ffbcbc;
}
</style>
