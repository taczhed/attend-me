<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
}>()
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled"
    :class="{
      'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer':
        variant === 'primary' || !variant,
      'bg-secondary-200 text-secondary-800 hover:bg-secondary-300 cursor-pointer':
        variant === 'secondary',
      'border-2 border-primary-600 text-primary-600 hover:bg-primary-50': variant === 'outline',
    }"
    class="px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <slot />
  </button>
</template>
