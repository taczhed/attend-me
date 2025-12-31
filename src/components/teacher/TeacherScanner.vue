<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import { backend, setScannerTokenFromUrl } from '@/services/backend'

const showScanner = ref(false)

const info = ref('Zbliż telefon z kodem QR do kamery.')
const result = ref('')
const error = ref('')

const hasScannerToken = ref(false)

let busy = false
let clearTimer: number | null = null

function clearMessagesLater() {
  if (clearTimer) window.clearTimeout(clearTimer)
  clearTimer = window.setTimeout(() => {
    result.value = ''
    error.value = ''
  }, 3500)
}

type DetectPayload = { rawValue?: string }

async function onDetect(decoded: DetectPayload[] | string) {
  if (busy) return

  const token = typeof decoded === 'string' ? decoded : decoded?.[0]?.rawValue ?? ''
  if (!token) return

  busy = true
  error.value = ''
  result.value = ''

  try {
    const user = await backend.courseSessionAttendanceRegister(token)

    const name = [user?.name, user?.surname].filter(Boolean).join(' ')
    const album = user?.student?.albumIdNumber
    result.value = `Zarejestrowano: ${name}${album ? ` (${album})` : ''}`

    clearMessagesLater()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Nie udało się zarejestrować obecności'
    clearMessagesLater()
  } finally {
    window.setTimeout(() => {
      busy = false
    }, 1200)
  }
}

onMounted(() => {
  const t = setScannerTokenFromUrl()
  hasScannerToken.value = !!t

  if (!t) {
    info.value = 'Brakuje tokenu skanera w URL. Otwórz link wygenerowany dla skanera obecności.'
  }
})

onBeforeUnmount(() => {
  if (clearTimer) window.clearTimeout(clearTimer)
})
</script>

<template>
  <div class="page">
    <h1>Skaner obecności</h1>
    <p class="desc">{{ info }}</p>

    <button class="btn" @click="showScanner = !showScanner">
      {{ showScanner ? 'Zamknij skaner' : 'Uruchom skaner' }}
    </button>

    <div v-if="showScanner" class="card">
      <div v-if="!hasScannerToken" class="alert error">
        Brak tokenu skanera w URL. Link powinien mieć parametr <b>?token=...</b>
      </div>

      <QrcodeStream v-if="hasScannerToken" @detect="onDetect" @error="(e) => (error = String(e))" />

      <div v-if="result" class="alert ok">{{ result }}</div>
      <div v-if="error" class="alert error">{{ error }}</div>

      <div class="hint">Jeśli kamera nie działa na HTTP, uruchom na HTTPS albo testuj na demo.</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 16px;
}
.desc {
  color: #555;
  margin-bottom: 16px;
}
.btn {
  margin-bottom: 16px;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #0a7a2a;
  color: white;
  cursor: pointer;
}
.card {
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  padding: 18px;
}
.alert {
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 12px;
}
.alert.error {
  background: #ffe9e9;
  border: 1px solid #ffbcbc;
}
.alert.ok {
  background: #eaffea;
  border: 1px solid #b6ffb6;
}
.hint {
  margin-top: 12px;
  font-size: 12px;
  color: #777;
}
</style>
