<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import { QrcodeStream } from 'vue-qrcode-reader'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const route = useRoute()
const router = useRouter()

const sessionId = Number(route.params.id)
const isLoading = ref(true)
const error = ref('')
const successMessage = ref('')
const cameraError = ref('')

const cameraErrorMessages: Record<string, string> = {
  NotAllowedError: 'Brak uprawnień do kamery. Zezwól na dostęp w ustawieniach przeglądarki.',
  NotFoundError: 'Nie znaleziono kamery na tym urządzeniu.',
  NotSupportedError: 'Wymagane bezpieczne połączenie (HTTPS).',
  NotReadableError: 'Kamera jest używana przez inną aplikację.',
  OverconstrainedError: 'Kamera nie spełnia wymagań.',
}

async function initializeScannerToken() {
  try {
    const result = await ApiClient.courseSessionAttendanceScannerTokenGet(sessionId)
    if (result?.token) {
      ApiClient.deviceTokenResult = result
    } else {
      error.value = 'Nie udało się uzyskać tokenu skanera'
    }
  } catch (err) {
    console.error('Failed to initialize scanner token', err)
    error.value = 'Błąd inicjalizacji skanera'
  } finally {
    isLoading.value = false
  }
}

interface DetectedBarcode {
  rawValue: string
  format: string
  boundingBox?: DOMRectReadOnly
  cornerPoints?: { x: number; y: number }[]
}

async function onDetect(detectedCodes: DetectedBarcode[]) {
  if (!detectedCodes || detectedCodes.length === 0) return

  const firstCode = detectedCodes[0]
  if (!firstCode) return

  const decodedString = firstCode.rawValue
  if (!decodedString) return

  try {
    await ApiClient.courseSessionAttendanceRegister(decodedString)
    successMessage.value = 'Obecność zarejestrowana pomyślnie!'

    setTimeout(() => {
      successMessage.value = ''
      router.push({ name: 'teacher-session-details', params: { id: sessionId } })
    }, 5000)
  } catch (err: unknown) {
    console.error('Failed to register attendance - full error:', err)
    if (err instanceof Error) {
      error.value = `Błąd: ${err.message}`
    } else {
      error.value = 'Nie udało się zarejestrować obecności'
    }

    setTimeout(() => {
      error.value = ''
    }, 5000)
  }
}

function onInit(promise: Promise<MediaStream>) {
  promise.catch((err: Error) => {
    const errorMessage = cameraErrorMessages[err.name]
    if (errorMessage) {
      cameraError.value = errorMessage
    } else {
      cameraError.value = `Błąd inicjalizacji kamery: ${err.message}`
    }
  })
}

function goBack() {
  router.push({ name: 'teacher-session-details', params: { id: sessionId } })
}

onMounted(() => {
  initializeScannerToken()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-secondary-50">
    <AppHeader />

    <main class="flex-grow flex flex-col items-center pt-8 px-4 pb-8">
      <div class="w-full max-w-3xl">
        <div class="mb-6">
          <BaseButton @click="goBack" variant="secondary">Powrót</BaseButton>
        </div>

        <div class="bg-white p-8 rounded-lg shadow-md">
          <h1 class="text-3xl font-bold text-secondary-900 mb-6 text-center">Skanuj kod QR</h1>

          <div v-if="isLoading" class="text-center py-12 text-gray-500">
            Inicjalizowanie skanera...
          </div>

          <div
            v-else-if="error && !cameraError"
            class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6"
          >
            {{ error }}
          </div>

          <div v-else>
            <div
              v-if="successMessage"
              class="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6"
            >
              {{ successMessage }}
            </div>

            <div
              v-if="error"
              class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6"
            >
              {{ error }}
            </div>

            <div
              v-if="cameraError"
              class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg mb-6"
            >
              <p class="font-semibold mb-2">Problem z kamerą:</p>
              <p>{{ cameraError }}</p>
            </div>

            <div v-else class="space-y-4">
              <div
                class="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden border-4 border-primary-600"
              >
                <qrcode-stream @detect="onDetect" @init="onInit" />
              </div>

              <div class="text-center text-gray-600">
                <p class="text-lg font-medium mb-2">Zbliż kod QR studenta do kamery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
