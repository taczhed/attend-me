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
const scannerToken = ref('')
const isLoading = ref(true)
const error = ref('')
const successMessage = ref('')
const cameraError = ref('')

const cameraErrorMessages = {
  NotAllowedError: 'Brak uprawnień do kamery. Zezwól na dostęp w ustawieniach przeglądarki.',
  NotFoundError: 'Nie znaleziono kamery na tym urządzeniu.',
  NotSupportedError: 'Wymagane bezpieczne połączenie (HTTPS).',
  NotReadableError: 'Kamera jest używana przez inną aplikację.',
  OverconstrainedError: 'Kamera nie spełnia wymagań.',
}

async function initializeScanner() {
  isLoading.value = true
  error.value = ''

  try {
    const tokenResult = await ApiClient.courseSessionAttendanceScannerTokenGet(sessionId)
    scannerToken.value = tokenResult.token || ''
  } catch (err) {
    console.error('Failed to get scanner token', err)
    error.value = 'Nie udało się zainicjalizować skanera'
  } finally {
    isLoading.value = false
  }
}

async function onDecode() {
  if (!scannerToken.value) return

  try {
    await ApiClient.courseSessionAttendanceRegister(scannerToken.value)
    successMessage.value = 'Obecność zarejestrowana pomyślnie!'

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    console.error('Failed to register attendance', err)
    error.value = 'Nie udało się zarejestrować obecności'

    setTimeout(() => {
      error.value = ''
    }, 3000)
  }
}

function onInit(promise: Promise<any>) {
  promise.catch((err) => {
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
  initializeScanner()
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
              ✓ {{ successMessage }}
            </div>

            <div
              v-if="error"
              class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6"
            >
              ✗ {{ error }}
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
                <qrcode-stream @decode="onDecode" @init="onInit" />
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
