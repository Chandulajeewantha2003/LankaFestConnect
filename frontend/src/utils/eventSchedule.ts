// Parse picker values explicitly; Android Hermes does not reliably parse display dates.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function parseEventDate(value: string): Date | null {
 const text = value.trim();
 const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
 const display = /^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
 if (!iso && !display) return null;
 const year = Number(iso ? iso[1] : display![3]);
 const month = iso ? Number(iso[2]) - 1 : MONTHS.indexOf(display![1].toLowerCase());
 const day = Number(iso ? iso[3] : display![2]);
 if (year < 100 || month < 0 || month > 11 || day < 1 || day > 31) return null;
 const date = new Date(year, month, day);
 return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}
export function parseEventDateTime(dateValue: string, timeValue: string): Date | null {
 const date = parseEventDate(dateValue);
 const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeValue.trim());
 if (!date || !match) return null;
 const hour = Number(match[1]), minute = Number(match[2]);
 if (hour < 1 || hour > 12 || minute > 59) return null;
 date.setHours(hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0), minute, 0, 0);
 return date;
}
