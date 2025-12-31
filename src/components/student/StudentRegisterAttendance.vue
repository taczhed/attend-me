<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import QrcodeVue from "qrcode.vue";
import { backend } from "@/services/backend";
import type { TokenResult } from "@/backend/ApiClientBase";

const showQr = ref(false);

const ticket = ref("");
const error = ref("");

let intervalId: number | null = null;

async function loadTicket() {
  error.value = "";

  try {
    const res: TokenResult = await backend.userAttendanceTicketGet();

    if (!res.token) {
      throw new Error("Brak tokenu");
    }

    ticket.value = res.token;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Nie udało się pobrać ticketu";
  }
}

function start() {
  showQr.value = true;
  loadTicket();
  intervalId = window.setInterval(loadTicket, 2000);
}

function stop() {
  showQr.value = false;
  ticket.value = "";
  error.value = "";
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

onMounted(() => {});

onBeforeUnmount(() => {
  if (intervalId !== null) window.clearInterval(intervalId);
});
</script>

<template>
  <div class="page">
    <h1>Rejestrowanie obecności</h1>

    <button class="btn" @click="showQr ? stop() : start()">
      {{ showQr ? "Zamknij QR" : "Pokaż QR" }}
    </button>

    <div v-if="showQr" class="card">
      <div v-if="error" class="alert error">{{ error }}</div>

      <div v-if="ticket" class="qrBox">
        <QrcodeVue :value="ticket" :size="280" />
        <div class="small">{{ ticket }}</div>
      </div>

      <div class="hint">
        Kod odświeża się automatycznie co 2 sekundy.
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 900px; margin: 30px auto; padding: 0 16px; }

.btn {
  margin: 10px 0 16px;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #0a7a2a;
  color: white;
  cursor: pointer;
}

.card { background: #fff; border: 1px solid #e6e6e6; border-radius: 10px; padding: 18px; }
.qrBox { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0 14px; }
.small { font-size: 12px; color: #666; word-break: break-all; }
.alert { border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
.alert.error { background: #ffe9e9; border: 1px solid #ffbcbc; }
.hint { margin-top: 12px; font-size: 12px; color: #777; }
</style>
