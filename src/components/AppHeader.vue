<script setup lang="ts">
import type { User } from '@/backend/ApiClientBase.ts'

defineProps<{
  user?: User | null
}>()

defineEmits<{
  (e: 'logout'): void
}>()
</script>

<template>
  <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
    <div class="text-2xl font-bold text-secondary-900">AttendMe</div>
    <div v-if="user" class="flex items-center gap-4">
      <div class="text-right hidden sm:block">
        <div class="font-medium text-gray-900">
          {{ user.isStudent ? user.name : `${user.name} ${user.surname}` }}
        </div>
        <div class="text-xs text-gray-500 uppercase tracking-wider">
          {{ user.isTeacher ? 'Wykładowca' : user.isStudent ? 'Student' : 'Użytkownik' }}
        </div>
      </div>
      <button
        @click="$emit('logout')"
        class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
      >
        Wyloguj
      </button>
    </div>
  </header>
</template>
