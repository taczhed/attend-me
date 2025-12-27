<script setup lang="ts">
interface SelectOption {
  value: string
  label: string
}

defineProps<{
  options: SelectOption[]
  label?: string
  error?: string
}>()

const value = defineModel<string>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-secondary-700">
      {{ label }}
    </label>
    <select
      v-model="value"
      :class="error ? 'border-red-500' : 'border-secondary-300'"
      class="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
  </div>
</template>
