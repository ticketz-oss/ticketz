import { format, isToday, isYesterday, differenceInCalendarDays } from "date-fns";
import { de, enUS, es, fr, id, it, pt } from "date-fns/locale";
import { i18n } from "../translate/i18n";

const availableLocales = { en: enUS, es, pt, id, fr, it, de };

export default function pastRelativeDate(date) {
  const now = new Date();
  const diffDays = differenceInCalendarDays(now, date);
  const locale = availableLocales[localStorage.getItem('language')?.substring(0,2) || "en"] || enUS;

  if (isToday(date)) {
    return format(date, 'HH:mm', { locale });
  }

  if (isYesterday(date)) {
    return i18n.t('date.yesterday');
  }

  if (diffDays > 1 && diffDays <= 7) {
    return format(date, 'EEEE', { locale });
  }

  return format(date, 'PP', { locale });
}
