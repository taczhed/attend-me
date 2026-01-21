<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ApiClient } from '@/backend/ApiClient.ts'
import {
  type User,
  CourseSessionListFiltersPagedListParams,
  CourseSessionListFilters,
  type CourseSessionListItem,
} from '@/backend/ApiClientBase.ts'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { getDateRange, formatDatePL, formatTimePL } from '@/utils/dateHelpers'

defineProps<{
  user: User
}>()

const studentSessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)
const searchText = ref('')
const dateFilter = ref('today')

async function fetchStudentSessions() {
  isLoading.value = true

  const dateRange = getDateRange(dateFilter.value)
  const filters = new CourseSessionListFilters({
    search: searchText.value,
    dateStart: dateRange.dateStart,
    dateEnd: dateRange.dateEnd,
  })

  const params = new CourseSessionListFiltersPagedListParams({
    pageNumber: 1,
    pageSize: 20,
    filters: filters,
  })

  try {
    const result = await ApiClient.courseStudentSessionsGet(params)
    studentSessions.value = result.items
  } catch (err) {
    console.error('Failed to fetch sessions', err)
  } finally {
    isLoading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
watch([searchText, dateFilter], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchStudentSessions()
  }, 300)
})

onMounted(() => {
  fetchStudentSessions()
})
</script>

<template>
  <div class="w-full max-w-5xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-secondary-900">Panel Studenta</h1>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-6 text-gray-800">Twoje nadchodzące zajęcia</h2>

      <div class="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
        <div class="flex-1">
          <BaseInput v-model="searchText" placeholder="Szukaj zajęć..." />
        </div>
        <div class="w-full md:w-64">
          <BaseSelect
            v-model="dateFilter"
            :options="[
              { value: 'today', label: 'Aktualne (dziś)' },
              { value: 'tomorrow', label: 'Jutro' },
              { value: 'next-week', label: 'Następny tydzień' },
              { value: 'past', label: 'Minione' },
              { value: 'all', label: 'Wszystkie' },
            ]"
          />
        </div>
      </div>

      <div v-if="isLoading" class="text-center py-8 text-gray-500">Ładowanie zajęć...</div>
      <div v-else-if="studentSessions.length > 0" class="space-y-4">
        <div
          v-for="session in studentSessions"
          :key="session.courseSessionId"
          class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
        >
          <router-link
            :to="{ name: 'student-session-details', params: { groupId: session.courseGroupId } }"
            class="flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer"
          >
            <div class="flex-1">
              <h3 class="font-bold text-lg text-secondary-900">{{ session.courseName }}</h3>
              <p class="text-secondary-600 font-medium">{{ session.courseGroupName }}</p>
              <div class="mt-1 text-sm text-gray-500 flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                {{ session.locationName }}
              </div>
            </div>
            <div class="text-left md:text-right">
              <div class="font-medium text-gray-900">
                {{ formatDatePL(session.dateStart) }}
              </div>
              <div class="text-sm text-gray-500">
                {{ formatTimePL(session.dateStart) }}
                -
                {{ formatTimePL(session.dateEnd) }}
              </div>
            </div>
          </router-link>
        </div>
      </div>
      <div
        v-else
        class="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"
      >
        Brak nadchodzących zajęć.
      </div>
    </div>
  </div>
</template>
