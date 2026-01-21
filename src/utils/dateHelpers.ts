export interface DateRange {
  dateStart?: Date
  dateEnd?: Date
}

export function formatDatePL(date: Date | undefined): string {
  if (!date) {
    return ''
  }
  return new Date(date).toLocaleDateString('pl-PL')
}

export function formatTimePL(date: Date | undefined): string {
  if (!date) {
    return ''
  }
  return new Date(date).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getDateRange(filter: string): DateRange {
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
