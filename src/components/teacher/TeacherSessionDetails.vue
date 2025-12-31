<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import type { CourseSessionListItem, AttendanceLog, TokenResult, User } from '@/backend/ApiClientBase'

const route = useRoute()
const router = useRouter()

const sessionId = computed(() => Number(route.params.sessionId))

const session = ref<CourseSessionListItem | null>(null)
const attendance = ref<AttendanceLog[]>([])
const isLoading = ref(true)
const error = ref('')

const isRefreshingAttendance = ref(false)
let attendanceIntervalId: number | null = null

const usersById = ref<Record<number, User>>({})

const headerTitle = computed(() => {
  if (!session.value) return 'Szczegóły zajęć'
  const courseName = session.value.courseName ?? ''
  const groupName = session.value.courseGroupName ?? ''
  return `${courseName} — ${groupName}`.trim()
})

function buildAbsoluteUrl(pathOrHref: string) {
  return new URL(pathOrHref, window.location.origin).toString()
}

function resolveNamedRouteUrl(name: string, query?: LocationQueryRaw) {
  const resolved = router.resolve({ name, query })
  return buildAbsoluteUrl(resolved.href)
}

async function loadSession() {
  error.value = ''

  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) {
    isLoading.value = false
    error.value = 'Brak poprawnego sessionId w URL.'
    return
  }

  isLoading.value = true
  try {
    session.value = await ApiClient.courseTeacherSessionGet(sessionId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Błąd ładowania danych sesji'
    console.error('Błąd ładowania sesji', e)
  } finally {
    isLoading.value = false
  }
}

async function refreshAttendanceList() {
  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) return

  isRefreshingAttendance.value = true
  try {
    const list = await ApiClient.courseSessionAttendanceListGet(sessionId.value)
    attendance.value = list ?? []
    await hydrateUsersForAttendance(attendance.value)
  } catch (e) {
    console.error('Błąd odświeżania listy obecności', e)
  } finally {
    isRefreshingAttendance.value = false
  }
}

async function hydrateUsersForAttendance(list: AttendanceLog[]) {
  const ids = Array.from(
    new Set(list.map((a) => a.attenderUserId).filter((x): x is number => typeof x === 'number')),
  )

  const missing = ids.filter((id) => !usersById.value[id])
  if (!missing.length) return

  try {
    const users = await Promise.all(
      missing.map(async (id) => {
        try {
          const u = await ApiClient.userGet(id)
          return [id, u] as const
        } catch {
          return null
        }
      }),
    )

    const next = { ...usersById.value }
    for (const entry of users) {
      if (!entry) continue
      const [id, u] = entry
      next[id] = u
    }
    usersById.value = next
  } catch (e) {
    console.error('Błąd dociągania danych użytkowników', e)
  }
}

function formatAttender(a: AttendanceLog) {
  const id = a.attenderUserId
  if (!id) return 'Nieznany użytkownik'

  const u = usersById.value[id]
  if (!u) return `UserID: ${id}`

  const fullName = [u.name, u.surname].filter(Boolean).join(' ').trim()
  const album = u.student?.albumIdNumber

  return `${fullName || `UserID: ${id}`}${album ? ` (${album})` : ''}`
}

function attendanceTime(a: AttendanceLog) {
  const d = a.dateCreated
  if (!d) return ''
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function openScanner() {
  error.value = ''

  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) {
    error.value = 'Brak poprawnego sessionId w URL.'
    return
  }

  try {
    const res = (await ApiClient.courseSessionAttendanceScannerTokenGet(sessionId.value)) as TokenResult
    const token = res?.token

    if (!token) {
      error.value = 'Nie udało się pobrać tokenu skanera.'
      return
    }

    router.push({ name: 'teacher-scanner', query: { token } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Nie udało się otworzyć skanera'
    console.error('Błąd pobierania tokenu skanera', e)
  }
}

async function getScannerToken(): Promise<string | null> {
  const res = (await ApiClient.courseSessionAttendanceScannerTokenGet(sessionId.value)) as TokenResult
  return res?.token ?? null
}

async function getDeviceRegisterToken(): Promise<string | null> {
  // UWAGA: jeśli u Ciebie metoda ma inną nazwę, podmień tę linijkę.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = (await (ApiClient as any).userDeviceRegisterTokenGet?.()) as TokenResult | undefined
  return res?.token ?? null
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

const scannerLink = ref<string>('')
const deviceRegisterLink = ref<string>('')

async function copyScannerLink() {
  error.value = ''
  try {
    if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) {
      error.value = 'Brak poprawnego sessionId.'
      return
    }
    const token = await getScannerToken()
    if (!token) {
      error.value = 'Nie udało się pobrać tokenu skanera.'
      return
    }

    const url = resolveNamedRouteUrl('teacher-scanner', { token })
    scannerLink.value = url
    await copyToClipboard(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Nie udało się skopiować linku skanera'
  }
}

async function copyDeviceRegisterLink() {
  error.value = ''
  try {
    const token = await getDeviceRegisterToken()
    if (!token) {
      error.value = 'Nie udało się pobrać tokenu rejestracji urządzenia.'
      return
    }

    const url = resolveNamedRouteUrl('student-device-register', { token })
    deviceRegisterLink.value = url
    await copyToClipboard(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Nie udało się skopiować linku rejestracji urządzenia'
  }
}

onMounted(async () => {
  await loadSession()
  await refreshAttendanceList()

  attendanceIntervalId = window.setInterval(() => {
    refreshAttendanceList()
  }, 5000)
})

onBeforeUnmount(() => {
  if (attendanceIntervalId) window.clearInterval(attendanceIntervalId)
})
</script>

<template>
  <div class="w-full max-w-5xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary-900">Szczegóły zajęć</h1>
        <p class="text-gray-600">{{ headerTitle }}</p>
      </div>

      <div class="flex gap-2">
        <button class="px-4 py-2 rounded-lg bg-gray-900 text-white" @click="loadSession">
          Odśwież
        </button>
        <button class="px-4 py-2 rounded-lg bg-green-700 text-white" @click="openScanner">
          Otwórz skaner
        </button>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-else-if="isLoading" class="text-center py-8 text-gray-500">Ładowanie...</div>

    <div v-else class="space-y-4">
      <div class="bg-white p-6 rounded-lg shadow-md space-y-3">
        <h2 class="text-lg font-semibold mb-2">Informacje o sesji</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div><b>ID sesji:</b> {{ sessionId }}</div>
          <div><b>Sala:</b> {{ session?.locationName ?? '' }}</div>

          <div>
            <b>Data:</b>
            {{ session?.dateStart ? new Date(session.dateStart).toLocaleDateString() : '' }}
          </div>

          <div>
            <b>Godziny:</b>
            {{
              session?.dateStart
                ? new Date(session.dateStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''
            }}
            -
            {{
              session?.dateEnd
                ? new Date(session.dateEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''
            }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-2">
          <button class="px-4 py-2 rounded-lg bg-gray-900 text-white" @click="copyScannerLink">
            Kopiuj link skanera
          </button>
          <button class="px-4 py-2 rounded-lg bg-green-700 text-white" @click="copyDeviceRegisterLink">
            Kopiuj link rejestracji urządzenia studenta
          </button>
        </div>

        <div v-if="scannerLink || deviceRegisterLink" class="text-xs text-gray-600 break-all pt-1 space-y-1">
          <div v-if="scannerLink"><b>Link skanera:</b> {{ scannerLink }}</div>
          <div v-if="deviceRegisterLink"><b>Link rejestracji urządzenia:</b> {{ deviceRegisterLink }}</div>
        </div>

        <div class="text-xs text-gray-500 pt-1">
          Auto-odświeżanie listy obecności: co 5s (tylko lista, bez przeładowywania strony).
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Lista obecności</h2>
          <div class="text-xs text-gray-500">
            <span v-if="isRefreshingAttendance">Aktualizuję…</span>
          </div>
        </div>

        <div v-if="attendance.length" class="space-y-2">
          <div
            v-for="a in attendance"
            :key="a.attendanceLogId"
            class="p-3 border border-gray-200 rounded-lg flex items-center justify-between"
          >
            <div class="text-gray-900 font-medium">
              {{ formatAttender(a) }}
            </div>
            <div class="text-xs text-gray-500">
              {{ attendanceTime(a) }}
            </div>
          </div>
        </div>

        <div v-else class="text-gray-500">Brak obecności do wyświetlenia.</div>
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
