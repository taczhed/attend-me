// https://github.com/true-vue/attend-me-client-demo/blob/main/src/helpers/JsonHelpers.ts

const DATE_PATTERN =
  /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T(2[0-3]|[01][0-9]):[0-5][0-9]/

/**
 * Provides custom json reviver that evaluates date strings as Date objects.
 * https://weblog.west-wind.com/posts/2014/jan/06/javascript-json-date-parsing-and-real-dates
 * @param {string} key - the serialized property key.
 * @param {object} value - the serialized proprty value.
 */
export function dateReviver(key: string, value: unknown) {
  if (typeof value === 'string' && DATE_PATTERN.test(value)) {
    return new Date(value)
  }
  return value
}

// Get the timezone offset in minutes and convert it to hours and minutes
const offset = -new Date().getTimezoneOffset()
const offsetHours = Math.floor(Math.abs(offset) / 60)
const offsetMinutes = Math.abs(offset) % 60
const offsetSign = offset >= 0 ? '+' : '-'

// Format the timezone part to "+HH:MM" or "-HH:MM"
const formattedTimezone = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`

/**
 * Enables ISO8601 format for Date object serialization. See implementation remarks.
 */
export function enableDateISO8601Serialization() {
  /*****************************************/
  // CAUTION Date.prototype.toJSON OVERRIDE!
  // This may influence other solutions operating same enviroment (html dom or backend not capable for ISO formated dates processing)
  /*****************************************/

  // Override default Date object default parser to supply date format with timezone.
  Date.prototype.toJSON = function () {
    // Convert date to ISO string (in UTC)
    const isoString = getLocalIsoString(this) // "YYYY-MM-DDTHH:mm:ss.sssZ"

    // Remove milliseconds and 'Z', then append the formatted timezone
    return isoString.slice(0, 19) + formattedTimezone
  }
}

function getLocalIsoString(date: Date) {
  const adjustedDate = new Date(date.getTime() + offset * 60 * 1000)
  return adjustedDate.toISOString().slice(0, 19)
}
