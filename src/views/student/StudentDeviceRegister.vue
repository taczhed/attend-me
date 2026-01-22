<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiClient } from '@/backend/ApiClient'
import { DeviceRegisterDTO } from '@/backend/ApiClientBase'
import AppHeader from '@/components/AppHeader.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { parseAlbumId, isValidAlbumId } from '@/utils/numberHelpers'

const router = useRouter()

const registrationToken = ref('')
const deviceName = ref('')
const studentName = ref('')
const studentSurname = ref('')
const albumIdNumber = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''

  if (!registrationToken.value.trim()) {
    error.value = 'Wpisz token rejestracyjny'
    return
  }

  if (!deviceName.value.trim()) {
    error.value = 'Wpisz nazwę urządzenia'
    return
  }

  if (!studentName.value.trim()) {
    error.value = 'Wpisz swoje imię'
    return
  }

  if (!studentSurname.value.trim()) {
    error.value = 'Wpisz swoje nazwisko'
    return
  }

  if (!albumIdNumber.value.trim()) {
    error.value = 'Wpisz swój numer indeksu'
    return
  }

  const albumId = parseAlbumId(albumIdNumber.value)
  if (!isValidAlbumId(albumId)) {
    error.value = 'Numer indeksu musi być liczbą większą od 0'
    return
  }

  loading.value = true

  try {
    const deviceData = new DeviceRegisterDTO({
      deviceName: deviceName.value,
      studentName: studentName.value,
      studentSurname: studentSurname.value,
      albumIdNumber: Number(albumId),
    })

    await ApiClient.userDeviceRegisterWithToken(registrationToken.value, deviceData)

    await router.replace('/')
  } catch (err) {
    console.error('Device registration failed', err)
    error.value =
      'Nieprawidłowy token rejestracyjny lub inne urządzenie zostało przypisane do tego konta. Skontaktuj się z administratorem.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-secondary-50">
    <AppHeader />

    <main class="flex-grow flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-12">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-secondary-900 mb-2">Rejestracja urządzenia</h1>
          <p class="text-gray-600">To urządzenie nie jest zarejestrowane w systemie</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <BaseInput v-model="studentName" label="Imię" placeholder="Jan" />

          <BaseInput v-model="studentSurname" label="Nazwisko" placeholder="Kowalski" />

          <BaseInput
            v-model="albumIdNumber"
            label="Numer indeksu"
            placeholder="12345"
            type="text"
          />

          <BaseInput v-model="deviceName" label="Nazwa urządzenia" placeholder="np. Mój telefon" />

          <BaseInput
            v-model="registrationToken"
            label="Token"
            placeholder="Wpisz token otrzymany od wykładowcy"
          />

          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {{ error }}
          </div>

          <BaseButton type="submit" variant="primary" :disabled="loading" class="w-full">
            {{ loading ? 'Rejestrowanie...' : 'Zarejestruj urządzenie' }}
          </BaseButton>
        </form>

        <div
          class="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800"
        >
          <strong>Jak uzyskać token rejestracyjny?</strong><br />
          <ol class="mt-2 ml-4 list-decimal list-outside">
            <li>Podaj wykładowcy swój numer indeksu</li>
            <li>Wykładowca wygeneruje token w systemie</li>
            <li>Wpisz otrzymany token w formularzu</li>
            <li>Po rejestracji będziesz mógł się zalogować</li>
          </ol>
        </div>
      </div>
    </main>
  </div>
</template>
