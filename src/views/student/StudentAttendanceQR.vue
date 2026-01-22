<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import QRCode from 'qrcode'
import AppHeader from '@/components/AppHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()

const qrCode = ref('')
const qrCodeDataUrl = ref('')
const isLoading = ref(true)
const error = ref('')
const successMessage = ref('')
const attendanceRegistered = ref(false)

let refreshInterval: NodeJS.Timeout | null = null

async function fetchTicket() {
  try {
    const result = await ApiClient.userAttendanceTicketGet()
    const token = result?.token

    if (token) {
      qrCode.value = token
      qrCodeDataUrl.value = await QRCode.toDataURL(token, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
      })
    } else {
      error.value = 'Backend zwrócił pustą odpowiedź - brak tokenu'
    }
  } catch (err: unknown) {
    console.error('Failed to fetch token', err)
    error.value = 'Nie udało się pobrać tokenu.'
  } finally {
    isLoading.value = false
  }
}

function startRefreshing() {
  refreshInterval = setInterval(() => {
    if (!attendanceRegistered.value) {
      fetchTicket()
    }
  }, 2000)
}

function stopRefreshing() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  fetchTicket()
  startRefreshing()
})

onUnmounted(() => {
  stopRefreshing()
})
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
          <h1 class="text-3xl font-bold text-secondary-900 mb-6 text-center">
            Rejestracja obecności
          </h1>

          <div v-if="isLoading" class="text-center py-12 text-gray-500">Generowanie kodu QR...</div>

          <div
            v-else-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg"
          >
            {{ error }}
          </div>

          <div v-else class="space-y-6">
            <div
              v-if="successMessage"
              class="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-center"
            >
              <div class="text-4xl mb-2">✓</div>
              <p class="font-semibold text-lg">{{ successMessage }}</p>
            </div>

            <div v-if="!attendanceRegistered && qrCodeDataUrl" class="flex flex-col items-center">
              <div class="bg-white p-6 rounded-lg border-4 border-primary-600 shadow-lg mb-4">
                <img :src="qrCodeDataUrl" alt="QR Code" class="w-[220px] h-[220px]" />
              </div>

              <div class="text-center space-y-2">
                <p class="text-lg font-medium text-gray-800">Zbliż telefon do kamery wykładowcy</p>
                <p class="text-sm text-gray-600">Kod odświeża się automatycznie co 2 sekundy</p>
              </div>
            </div>
          </div>

          <div
            class="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg text-sm text-gray-600"
          >
            <strong>Jak to działa?</strong><br />
            <ol class="mt-2 ml-4 list-decimal list-outside">
              <li>Wykładowca otwiera ekran skanowania na swoim urządzeniu</li>
              <li>Zbliż swój telefon z wyświetlonym kodem QR do kamery</li>
              <li>Obecność zostanie automatycznie zarejestrowana</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
