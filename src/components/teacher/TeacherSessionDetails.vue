<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw, type Router } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import type { CourseSessionListItem, AttendanceLog, TokenResult, User } from '@/backend/ApiClientBase'

type AttendeeRow = {
  userId: number
  fullName: string
  album?: string
}

const route = useRoute()
const router = useRouter()

const sessionId = computed(() => Number(route.params.sessionId))

const session = ref<CourseSessionListItem | null>(null)
const attendance = ref<AttendanceLog[]>([])
const attendees = ref<AttendeeRow[]>([])
const isLoading = ref(true)
const error = ref('')
const copyInfo = ref('')
const scannerUrl = ref('')
const deviceRegisterUrl = ref('')

const userCache = ref(new Map<number, AttendeeRow>())

const headerTitle = computed(() => {
  if (!session.value) return 'Szczegóły zajęć'
  const courseName = session.value.courseName ?? ''
  const groupName = session.value.courseGroupName ?? ''
  return `${courseName} — ${groupName}`.trim()
})

function buildAbsoluteUrl(href: string) {
  try {
    return new URL(href, window.location.origin).toString()
  } catch {
    return href
  }
}

function resolveNamedRouteUrl(r: Router, name: string, query?: LocationQueryRaw) {
  const resolved = r.resolve({ name, query })
  return buildAbsoluteUrl(resolved.href)
}

async function safeCopyToClipboard(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* ignore */
  }

  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', 'true')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    el.style.top = '-9999px'
    document.body.appendChild(el)
    el.focus()
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

let copyTimer: number | null = null
function setCopyInfo(msg: string) {
  copyInfo.value = msg
  if (copyTimer) window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copyInfo.value = ''
  }, 2500)
}

async function loadData() {
  error.value = ''

  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) {
    isLoading.value = false
    error.value = 'Brak poprawnego sessionId w URL.'
    return
  }

  isLoading.value = true
  try {
    session.value = await ApiClient.courseTeacherSessionGet(sessionId.value)
    await refreshAttendanceOnly()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Błąd ładowania danych'
    console.error('Błąd ładowania szczegółów zajęć', e)
  } finally {
    isLoading.value = false
  }
}

async function refreshAttendanceOnly() {
  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) return

  try {
    attendance.value = await ApiClient.courseSessionAttendanceListGet(sessionId.value)
    await hydrateAttendeesFromAttendance()
  } catch (e) {
    console.error('Błąd odświeżania listy obecności', e)
  }
}

async function hydrateAttendeesFromAttendance() {
  const ids = Array.from(
    new Set(
      attendance.value
        .map((a) => a.attenderUserId)
        .filter((x): x is number => typeof x === 'number')
    )
  )

  const rows: AttendeeRow[] = []
  for (const id of ids) {
    const cached = userCache.value.get(id)
    if (cached) {
      rows.push(cached)
      continue
    }

    try {
      const u = (await ApiClient.userGet(id)) as User
      const fullName = [u?.name, u?.surname].filter(Boolean).join(' ').trim() || `UserID: ${id}`
      const albumRaw = u?.student?.albumIdNumber
      const album = albumRaw == null ? undefined : String(albumRaw)
      const row: AttendeeRow = { userId: id, fullName, album }
      userCache.value.set(id, row)
      rows.push(row)
    } catch {
      const row: AttendeeRow = { userId: id, fullName: `UserID: ${id}` }
      userCache.value.set(id, row)
      rows.push(row)
    }
  }

  attendees.value = rows
}

async function getScannerToken(): Promise<string | null> {
  if (!Number.isFinite(sessionId.value) || sessionId.value <= 0) return null
  try {
    const res = (await ApiClient.courseSessionAttendanceScannerTokenGet(sessionId.value)) as TokenResult
    return res?.token ?? null
  } catch {
    return null
  }
}

async function getDeviceRegisterToken(deviceUserId: number): Promise<string | null> {
  try {
    const res = (await ApiClient.userDeviceRegisterTokenGet(deviceUserId)) as TokenResult
    return res?.token ?? null
  } catch {
    return null
  }
}

async function copyScannerLink() {
  error.value = ''
  scannerUrl.value = ''

  const token = await getScannerToken()
  if (!token) {
    error.value = 'Nie udało się pobrać tokenu skanera.'
    return
  }

  const url = resolveNamedRouteUrl(router, 'teacher-scanner', { token })
  scannerUrl.value = url

  const ok = await safeCopyToClipboard(url)
  setCopyInfo(ok ? 'Skopiowano do schowka.' : 'Nie udało się skopiować linku.')
}

async function copyStudentDeviceRegisterLinkForUser(deviceUserId: number) {
  error.value = ''
  deviceRegisterUrl.value = ''

  const token = await getDeviceRegisterToken(deviceUserId)
  if (!token) {
    error.value = 'Nie udało się pobrać tokenu rejestracji urządzenia.'
    return
  }

  const url = resolveNamedRouteUrl(router, 'student-device-register', { token })
  deviceRegisterUrl.value = url

  const ok = await safeCopyToClipboard(url)
  setCopyInfo(ok ? 'Skopiowano do schowka.' : 'Nie udało się skopiować linku.')
}

async function copyStudentDeviceRegisterLink() {
  error.value = ''
  deviceRegisterUrl.value = ''

  if (attendees.value.length === 1) {
    await copyStudentDeviceRegisterLinkForUser(attendees.value[0]!.userId)
    return
  }

  error.value =
    'Nie udało się wygenerować uniwersalnego linku. Skopiuj link dla konkretnego studenta z listy obecności.'
}

let refreshTimer: number | null = null

onMounted(() => {
  loadData()
  refreshTimer = window.setInterval(() => {
    refreshAttendanceOnly()
  }, 5000)
})

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
  if (copyTimer) window.clearTimeout(copyTimer)
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
        <button class="px-4 py-2 rounded-lg bg-gray-900 text-white" @click="loadData">
          Odśwież
        </button>
        <button class="px-4 py-2 rounded-lg bg-green-700 text-white" @click="copyScannerLink">
          Otwórz skaner
        </button>
      </div>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-else-if="isLoading" class="text-center py-8 text-gray-500">Ładowanie...</div>

    <div v-else class="space-y-4">
      <div class="bg-white p-6 rounded-lg shadow-md space-y-3">
        <h2 class="text-lg font-semibold">Informacje o sesji</h2>

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
          <button
            class="px-4 py-2 rounded-lg bg-green-700 text-white"
            @click="copyStudentDeviceRegisterLink"
          >
            Kopiuj link rejestracji urządzenia studenta
          </button>
          <span v-if="copyInfo" class="text-sm text-gray-600 self-center">{{ copyInfo }}</span>
        </div>

        <div v-if="scannerUrl" class="text-xs text-gray-600">
          <div class="font-semibold mb-1">Link skanera:</div>
          <textarea class="w-full border rounded-lg p-2" rows="3" readonly :value="scannerUrl" />
        </div>

        <div v-if="deviceRegisterUrl" class="text-xs text-gray-600">
          <div class="font-semibold mb-1">Link rejestracji urządzenia:</div>
          <textarea class="w-full border rounded-lg p-2" rows="3" readonly :value="deviceRegisterUrl" />
        </div>

        <div class="text-xs text-gray-500">
          Auto-odświeżanie listy obecności co 5s (tylko lista, bez przeładowywania strony).
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Lista obecności</h2>
          <div class="text-xs text-gray-500">Aktualne</div>
        </div>

        <div v-if="attendees.length" class="space-y-2">
          <div
            v-for="a in attendees"
            :key="a.userId"
            class="p-3 border border-gray-200 rounded-lg flex items-center justify-between gap-3"
          >
            <div class="font-medium text-gray-900">
              {{ a.fullName }}<span v-if="a.album"> ({{ a.album }})</span>
            </div>
            <button
              class="px-3 py-1 rounded-lg bg-gray-900 text-white text-sm"
              @click="copyStudentDeviceRegisterLinkForUser(a.userId)"
            >
              Kopiuj link
            </button>
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
