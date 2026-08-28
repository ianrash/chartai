export const UGANDA_TIMEZONE = 'Africa/Kampala';
const UGANDA_OFFSET_MS = 3 * 60 * 60 * 1000;

export function getUgandaTime(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + UGANDA_OFFSET_MS);
}

export function getUgandaHour(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: UGANDA_TIMEZONE
  }).format(date);
}

export function getUgandaOffsetMs() {
  return UGANDA_OFFSET_MS;
}

export function formatTimestampUganda(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UGANDA_TIMEZONE
  }).format(date);
}

export function formatDateForStorageUganda(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UGANDA_TIMEZONE
  }).format(date);
}