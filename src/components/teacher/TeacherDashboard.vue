<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ApiClient } from '@/backend/ApiClient.ts'
import {
  type User,
  CourseSessionListFiltersPagedListParams,
  CourseSessionListFilters,
  type CourseSessionListItem,
} from '@/backend/ApiClientBase.ts'
import BaseInput from '@/components/BaseInput.vue'

defineProps<{
  user: User
}>()

const teacherSessions = ref<CourseSessionListItem[]>([])
const isLoading = ref(true)
const searchText = ref('')
const dateFilter = ref('today')

function getDateRange(filter: string): { dateStart?: Date; dateEnd?: Date } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (filter === 'today') {
    return { dateStart: todayStart, dateEnd: todayEnd }
  }
  if (filter === 'tomorrow') {
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const tomorrowEnd = new Date(todayEnd)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
    return { dateStart: tomorrowStart, dateEnd: tomorrowEnd }
  }
  if (filter === 'next-week') {
    const daysUntilNextMonday = (1 + 7 - todayStart.getDay()) % 7 || 7
    const nextMonday = new Date(todayStart)
    nextMonday.setDate(todayStart.getDate() + daysUntilNextMonday)
    const nextSunday = new Date(nextMonday)
    nextSunday.setDate(nextMonday.getDate() + 6)
    nextSunday.setHours(23, 59, 59, 999)
    return { dateStart: nextMonday, dateEnd: nextSunday }
  }
  if (filter === 'past') {
    return { dateEnd: new Date(todayStart.getTime() - 1) }
  }
  return {}
}

function fetchTeacherSessions() {
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

  ApiClient.courseTeacherSessionsGet(params)
    .then((result) => {
      teacherSessions.value = result.items
    })
    .catch((err) => console.error('Failed to fetch sessions', err))
    .finally(() => {
      isLoading.value = false
    })
}

let searchTimeout: ReturnType<typeof setTimeout>
watch([searchText, dateFilter], () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchTeacherSessions()
  }, 300)
})

onMounted(() => {
  fetchTeacherSessions()
})
</script>

<template>
  <div class="w-full max-w-5xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-secondary-900">Panel Wykładowcy</h1>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-6 text-gray-800">Twoje zajęcia</h2>

      <div class="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
        <div class="flex-1">
          <BaseInput v-model="searchText" placeholder="Szukaj zajęć..." />
        </div>
        <div class="w-full md:w-64">
          <select
            v-model="dateFilter"
            class="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white"
          >
            <option value="today">Aktualne (dziś)</option>
            <option value="tomorrow">Jutro</option>
            <option value="next-week">Następny tydzień</option>
            <option value="past">Minione</option>
            <option value="all">Wszystkie</option>
          </select>
        </div>
      </div>

      <div v-if="isLoading" class="text-center py-8 text-gray-500">Ładowanie zajęć...</div>
      <div v-else-if="teacherSessions.length > 0" class="space-y-4">
        <div
          v-for="session in teacherSessions"
          :key="session.courseSessionId"
          class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
        >
          <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 class="font-bold text-lg text-secondary-900">{{ session.courseName }}</h3>
              <p class="text-secondary-600 font-medium">{{ session.courseGroupName }}</p>
              <div class="mt-1 text-sm text-gray-500 flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                {{ session.locationName }}
              </div>
            </div>
            <div class="text-left md:text-right">
              <div class="font-medium text-gray-900">
                {{ session.dateStart ? new Date(session.dateStart).toLocaleDateString() : '' }}
              </div>
              <div class="text-sm text-gray-500">
                {{
                  session.dateStart
                    ? new Date(session.dateStart).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                }}
                -
                {{
                  session.dateEnd
                    ? new Date(session.dateEnd).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"
      >
        Brak zaplanowanych zajęć.
      </div>
    </div>
  </div>
</template>
