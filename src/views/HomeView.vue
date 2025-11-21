<script setup lang="ts">
import { watchEffect } from 'vue'
import { ApiClient } from '@/backend/ApiClient.ts'

watchEffect(() => {
  ApiClient.userGet().then((user) => console.log(user))
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
    <h1 class="text-center text-3xl font-bold text-secondary-900 mb-8">Home</h1>
  </div>
</template>
