import { numPad as pad } from './numPad';

export function getISOStringWithTimezone(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHour = pad(Math.floor(absOffsetMinutes / 60));
  const offsetMinute = pad(absOffsetMinutes % 60);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}${sign}${offsetHour}:${offsetMinute}`;
}
