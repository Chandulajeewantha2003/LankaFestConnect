import { parseEventDate } from '../../../utils/eventSchedule';
import { SeekerEvent } from './events';
export type DateFilter = 'Anytime' | 'Today' | 'This Week' | 'This Month' | 'Custom';
export interface SearchFilters { date: DateFilter; customDate: string; categories: string[]; prices: string[]; location: string; languages: string[]; }
export function defaultFilters(): SearchFilters { return { date: 'Anytime', customDate: '', categories: [], prices: [], location: 'All Locations', languages: [] }; }

export function isValidDate(value: string) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const parsed = new Date(value + 'T00:00:00');
 return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === Number(value.slice(0, 4)) && parsed.getMonth() + 1 === Number(value.slice(5, 7)) && parsed.getDate() === Number(value.slice(8, 10));
}
export function filterCount(filters: SearchFilters) { return Number(filters.date !== 'Anytime') + filters.categories.length + filters.prices.length + Number(filters.location !== 'All Locations') + filters.languages.length; }
export function matchesFilters(event: SeekerEvent, filters: SearchFilters, now = new Date()) {
 const parsed = parseEventDate(event.startDate);
 const date = parsed !== null ? [parsed.getFullYear(), String(parsed.getMonth() + 1).padStart(2, '0'), String(parsed.getDate()).padStart(2, '0')].join('-') : '';
 const meta = { date, languages: [] as string[] };
 if (filters.categories.length && !filters.categories.includes(event.category === 'Food' ? 'Food & Beverage' : event.category)) return false;
 if (filters.location !== 'All Locations' && event.city !== filters.location) return false;
 if (filters.languages.length && !filters.languages.some(language => meta?.languages.includes(language))) return false;
 if (filters.prices.length && !filters.prices.some(price => price === 'Free' ? event.price === 0 : price === 'LKR 1 – 1,000' ? event.price > 0 && event.price <= 1000 : price === 'LKR 1,000 – 5,000' ? event.price > 1000 && event.price <= 5000 : event.price > 5000)) return false;
 if (filters.date === 'Anytime') return true;
 if (!meta) return false;
 const eventDate = new Date(meta.date + 'T00:00:00');
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 if (filters.date === 'Custom') return isValidDate(filters.customDate) && meta.date === filters.customDate;
 if (filters.date === 'Today') return eventDate.getTime() === today.getTime();
 if (filters.date === 'This Month') return eventDate.getFullYear() === today.getFullYear() && eventDate.getMonth() === today.getMonth();
 const start = new Date(today); start.setDate(start.getDate() - (start.getDay() + 6) % 7);
 const end = new Date(start); end.setDate(end.getDate() + 7);
 return eventDate >= start && eventDate < end;
}
