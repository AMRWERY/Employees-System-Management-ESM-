import { useNow } from '@vueuse/core';
import { computed } from 'vue';

export function useAttendanceDateFormat() {
  const now = useNow();
  
  const formatFullDate = (locales: string) => {
    return computed(() => {
      const date = now.value;
      return new Intl.DateTimeFormat(locales, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long'
      }).format(date);
    });
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  };

  const formatDateForTooltip = (dateStr: string, locale: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long'
    }).format(date);
  };

  return {
    now,
    formatFullDate,
    formatTime,
    formatDuration,
    formatDateForTooltip
  };
}
