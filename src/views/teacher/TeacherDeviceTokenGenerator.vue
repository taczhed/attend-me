<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import type { CourseSessionListItem, CourseSessionAttendanceRecord } from '@/backend/ApiClientBase'
import {
  CourseSessionListFiltersPagedListParams,
  CourseSessionListFilters,
} from '@/backend/ApiClientBase'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { parseAlbumId, isValidAlbumId } from '@/utils/numberHelpers'

const router = useRouter()

const albumIdInput = ref('')
const generatedToken = ref('')
const isLoading = ref(false)
const isSearching = ref(false)
const isResetting = ref(false)
const error = ref('')
const foundStudent = ref<{ userId: number; name: string; surname: string; albumId: number } | null>(
  null,
)

const allStudents = ref<
  Map<number, { userId: number; name: string; surname: string; albumId: number }>
>(new Map())

onMounted(async () => {
  try {
    isSearching.value = true
    const params = new CourseSessionListFiltersPagedListParams({
      pageNumber: 1,
      pageSize: 100,
      filters: new CourseSessionListFilters({}),
    })

    const sessionsResult = await ApiClient.courseTeacherSessionsGet(params)
    const sessions: CourseSessionListItem[] = sessionsResult.items || []

    for (const session of sessions) {
      if (session.courseSessionId) {
        try {
          const attendanceList: CourseSessionAttendanceRecord[] =
            await ApiClient.courseSessionAttendanceListGet(session.courseSessionId)

          attendanceList.forEach((record) => {
            if (record.attenderUserId && record.studentAlbumIdNumber) {
              const key = record.studentAlbumIdNumber
              if (!allStudents.value.has(key)) {
                allStudents.value.set(key, {
                  userId: record.attenderUserId,
                  name: record.userName || '',
                  surname: record.userSurname || '',
                  albumId: record.studentAlbumIdNumber,
                })
              }
            }
          })
        } catch (err) {
          console.error('Failed to fetch attendance for session', session.courseSessionId, err)
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch teacher sessions', err)
  } finally {
    isSearching.value = false
  }
})

async function searchStudent() {
  error.value = ''
  foundStudent.value = null
  generatedToken.value = ''

  const inputValue = albumIdInput.value.trim()
  if (!inputValue) {
    error.value = 'Wpisz numer indeksu studenta (wymagane)'
    return
  }

  const albumId = parseAlbumId(inputValue)
  if (!isValidAlbumId(albumId)) {
    error.value = 'Numer indeksu musi być liczbą większą od 0'
    return
  }

  const student = allStudents.value.get(albumId!)
  if (student) {
    foundStudent.value = student
  } else {
    error.value = `Nie znaleziono studenta o numerze indeksu ${albumId}. Upewnij się, że student uczestniczył w Twoich zajęciach.`
  }
}

async function generateToken() {
  if (!foundStudent.value) {
    error.value = 'Najpierw wyszukaj studenta'
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    const result = await ApiClient.userDeviceRegisterTokenGet(foundStudent.value.userId)
    generatedToken.value = result.token || ''
  } catch (err: unknown) {
    console.error('Failed to generate device token', err)
    error.value = 'Nie udało się wygenerować tokenu. Sprawdź czy student istnieje w systemie.'
  } finally {
    isLoading.value = false
  }
}

async function resetDevice() {
  if (!foundStudent.value) {
    error.value = 'Najpierw wyszukaj studenta'
    return
  }

  error.value = ''
  isResetting.value = true

  try {
    await ApiClient.userDeviceResetToken(foundStudent.value.userId)
    alert('Urządzenie zostało zresetowane. Student może teraz zarejestrować nowe urządzenie.')
    generatedToken.value = ''
  } catch (err: unknown) {
    console.error('Failed to reset device', err)
    error.value = 'Nie udało się zresetować urządzenia. Spróbuj ponownie.'
  } finally {
    isResetting.value = false
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(generatedToken.value)
  alert('Token skopiowany do schowka!')
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-secondary-50">
    <AppHeader />

    <main class="flex-grow flex flex-col items-center pt-8 px-4 pb-8">
      <div class="w-full max-w-2xl">
        <div class="mb-6">
          <BaseButton @click="goBack" variant="secondary">Powrót</BaseButton>
        </div>

        <div class="bg-white p-8 rounded-lg shadow-md">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-secondary-900 mb-2">
              Zarządzanie tokenami rejestracyjnymi
            </h1>
            <p class="text-gray-600">
              Wygeneruj token dla studenta do zarejestrowania urządzenia lub wyrejestruj urządzenie
              studenta
            </p>
          </div>

          <div class="space-y-6">
            <div class="space-y-4">
              <BaseInput
                v-model="albumIdInput"
                type="text"
                label="Numer indeksu"
                placeholder="12345"
                :error="error && !foundStudent ? error : ''"
              />

              <BaseButton
                @click="searchStudent"
                variant="secondary"
                :disabled="isSearching"
                class="w-full"
              >
                {{ isSearching ? 'Ładowanie listy studentów...' : 'Wyszukaj studenta' }}
              </BaseButton>
            </div>

            <div v-if="foundStudent" class="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div class="space-y-1 text-sm text-gray-700">
                <p>
                  <strong>Imię i nazwisko:</strong> {{ foundStudent.name }}
                  {{ foundStudent.surname }}
                </p>
                <p><strong>Nr indeksu:</strong> {{ foundStudent.albumId }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <BaseButton
                @click="generateToken"
                variant="primary"
                :disabled="isLoading || !foundStudent"
                class="w-full"
              >
                {{ isLoading ? 'Generowanie tokenu...' : 'Wygeneruj token' }}
              </BaseButton>

              <BaseButton
                @click="resetDevice"
                variant="primary"
                :disabled="isResetting || !foundStudent"
                class="w-full"
              >
                {{ isResetting ? 'Resetowanie urządzenia...' : 'Zresetuj urządzenie studenta' }}
              </BaseButton>
            </div>

            <div v-if="generatedToken" class="space-y-4">
              <div class="bg-green-50 border border-green-200 p-6 rounded-lg">
                <p class="text-sm font-semibold text-green-800 mb-2">Token wygenerowany:</p>
                <div
                  class="bg-white p-4 rounded border border-green-300 font-mono text-sm break-all"
                >
                  {{ generatedToken }}
                </div>
              </div>

              <BaseButton @click="copyToClipboard" variant="secondary" class="w-full">
                Skopiuj token
              </BaseButton>
            </div>

            <div class="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm text-gray-600">
              <strong>Jak to działa?</strong><br />
              <ol class="mt-2 ml-4 list-decimal list-outside">
                <li>Wpisujesz numer indeksu studenta</li>
                <li>Student został znaleziony w bazie</li>
                <li>Generujesz token lub zwalniasz urządzenie studenta</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
