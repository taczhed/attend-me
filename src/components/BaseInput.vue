<!-- https://vuejs.org/guide/components/v-model -->
<script setup lang="ts">
defineProps<{
  type?: string
  placeholder?: string
  label?: string
  error?: string
}>()

const value = defineModel()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-secondary-700">
      {{ label }}
    </label>
    <input
      :type="type || 'text'"
      :placeholder="placeholder"
      :class="error ? 'border-red-500' : 'border-secondary-300'"
      v-model="value"
      class="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
    />
    <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
  </div>
</template>
