<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { backend } from '@/services/backend'
import type { DeviceRegisterDTO, TokenResult } from '@/backend/ApiClientBase'

const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.query.token ?? ''))

const deviceName = ref(
  (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'My device'
)

const isLoading = ref(false)
const ok = ref('')
const error = ref('')

function setDeviceToken(tokenValue: string) {
  localStorage.setItem('deviceToken', tokenValue)
  backend.deviceTokenResult = { token: tokenValue } as TokenResult
}

async function register() {
  ok.value = ''
  error.value = ''

  if (!token.value) {
    error.value = 'Brak tokenu w URL. Link powinien mieć parametr ?token=...'
    return
  }

  isLoading.value = true
  try {
    const dto = { deviceName: deviceName.value } as DeviceRegisterDTO
    const res = await backend.userDeviceRegisterWithToken(token.value, dto)

    const tokenValue =
      (typeof res === 'object' && res && 'token' in res && typeof (res as { token?: unknown }).token === 'string')
        ? (res as { token: string }).token
        : ''

    if (!tokenValue) {
      throw new Error('Backend nie zwrócił tokenu urządzenia.')
    }

    setDeviceToken(tokenValue)
    ok.value = 'Urządzenie zarejestrowane. Możesz wrócić do zajęć i generować QR.'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Nie udało się zarejestrować urządzenia'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="w-full max-w-3xl">
    <h1 class="text-3xl font-bold text-secondary-900 mb-2">Rejestracja urządzenia</h1>
    <p class="text-gray-600 mb-6">
      Otworzyłeś link od wykładowcy. Zarejestruj to urządzenie, żeby móc generować kody QR do obecności.
    </p>

    <div class="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div v-if="!token" class="alert error">
        Brak tokenu w URL. Link powinien mieć parametr <b>?token=...</b>
      </div>

      <label class="block">
        <span class="text-sm text-gray-700 font-medium">Nazwa urządzenia</span>
        <input
          v-model="deviceName"
          class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="np. iPhone / Laptop"
        />
      </label>

      <div class="flex gap-2">
        <button
          class="px-4 py-2 rounded-lg bg-green-700 text-white disabled:opacity-60"
          :disabled="isLoading || !token"
          @click="register"
        >
          {{ isLoading ? 'Rejestruję...' : 'Zarejestruj urządzenie' }}
        </button>

        <button class="px-4 py-2 rounded-lg bg-gray-900 text-white" @click="goBack">
          Wróć
        </button>
      </div>

      <div v-if="ok" class="alert ok">{{ ok }}</div>
      <div v-if="error" class="alert error">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
.alert {
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
}
.alert.error {
  background: #ffe9e9;
  border: 1px solid #ffbcbc;
}
.alert.ok {
  background: #eaffea;
  border: 1px solid #b6ffb6;
}
</style>
