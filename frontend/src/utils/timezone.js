export const UGANDA_TIMEZONE = 'Africa/Kampala';

export function getUgandaTime(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: UGANDA_TIMEZONE }));
}

export function getUgandaHour(date = new Date()) {
  const ugandaTime = getUgandaTime(date);
  return ugandaTime.getHours();
}

export function getUgandaOffsetMs() {
  return 3 * 60 * 60 * 1000;
}

export function formatTimestampUganda(date) {
  if (!date) return "";
  const ugandaTime = getUgandaTime(date);
  return ugandaTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UGANDA_TIMEZONE
  }).replace(',', ',');
}

export function formatDateForStorageUganda(date) {
  if (!date) return "";
  const ugandaTime = getUgandaTime(date);
  return ugandaTime.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UGANDA_TIMEZONE
  });
}