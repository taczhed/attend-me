<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { backend } from '@/services/backend'
import { DeviceRegisterDTO } from '@/backend/ApiClientBase'

const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.query.token ?? ''))

const studentName = ref('')
const studentSurname = ref('')
const albumIdNumber = ref('')

const deviceName = ref(
  typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'My device'
)

const isLoading = ref(false)
const ok = ref('')
const error = ref('')

function normalize(s: string) {
  return s.trim()
}

function parseErrorMessage(e: unknown) {
  if (e instanceof Error) {
    try {
      const parsed = JSON.parse(e.message) as { title?: string; detail?: string; type?: string }
      if (parsed?.type === 'device_user_data_mismatch') {
        return 'Dane (imię/nazwisko) nie pasują do użytkownika przypisanego do tego linku. Skopiuj link rejestracji dla właściwego studenta lub wpisz dane dokładnie jak w systemie.'
      }
      if (parsed?.detail) return parsed.detail
      if (parsed?.title) return parsed.title
    } catch {
      return e.message
    }
    return e.message
  }
  return 'Nie udało się zarejestrować urządzenia'
}

async function register() {
  ok.value = ''
  error.value = ''

  const t = normalize(token.value)
  const dn = normalize(deviceName.value)
  const sn = normalize(studentName.value)
  const ss = normalize(studentSurname.value)
  const albumRaw = normalize(albumIdNumber.value)

  if (!t) {
    error.value = 'Brak tokenu w URL. Link powinien mieć parametr ?token=...'
    return
  }
  if (!sn || !ss) {
    error.value = 'Podaj imię i nazwisko.'
    return
  }
  if (!dn) {
    error.value = 'Podaj nazwę urządzenia.'
    return
  }

  let album: number | undefined = undefined
  if (albumRaw) {
    const n = Number(albumRaw)
    if (!Number.isFinite(n) || n <= 0) {
      error.value = 'Numer albumu musi być liczbą.'
      return
    }
    album = n
  }

  isLoading.value = true
  try {
    const dto = new DeviceRegisterDTO({
      deviceName: dn,
      studentName: sn,
      studentSurname: ss,
      albumIdNumber: album,
    })

    const res = await backend.userDeviceRegisterWithToken(t, dto)

    const tokenValue = res?.token ?? ''
    if (!tokenValue) throw new Error('Backend nie zwrócił tokenu urządzenia.')

    ok.value = 'Urządzenie zarejestrowane. Możesz wrócić do zajęć i generować QR.'
  } catch (e: unknown) {
    error.value = parseErrorMessage(e)
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm text-gray-700 font-medium">Imię</span>
          <input
            v-model="studentName"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="np. Jan"
          />
        </label>

        <label class="block">
          <span class="text-sm text-gray-700 font-medium">Nazwisko</span>
          <input
            v-model="studentSurname"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="np. Kowalski"
          />
        </label>

        <label class="block">
          <span class="text-sm text-gray-700 font-medium">Numer albumu (opcjonalnie)</span>
          <input
            v-model="albumIdNumber"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="np. 15186"
          />
        </label>

        <label class="block">
          <span class="text-sm text-gray-700 font-medium">Nazwa urządzenia</span>
          <input
            v-model="deviceName"
            class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="np. iPhone / Laptop"
          />
        </label>
      </div>

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
