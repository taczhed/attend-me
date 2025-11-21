<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/BaseInput.vue'
import BaseButton from '@/components/BaseButton.vue'
import { ApiClient } from '@/backend/ApiClient.ts'

const login = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await ApiClient.userLogin(login.value, password.value)
    await router.push('/')
  } catch {
    error.value = 'Błąd logowania. Spróbój ponownie!'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
    <div class="w-full max-w-[420px] bg-white rounded-2xl shadow-lg px-8 py-12">
      <h1 class="text-center text-3xl font-bold text-secondary-900 mb-8">Zaloguj się</h1>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <BaseInput v-model="login" type="login" label="Login" placeholder="Wpisz login" />
        <BaseInput v-model="password" type="password" label="Hasło" placeholder="Wpisz hasło" />

        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <BaseButton type="submit" variant="primary" :disabled="loading" class="w-full">
          {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
        </BaseButton>
      </form>
    </div>
  </div>
</template>
