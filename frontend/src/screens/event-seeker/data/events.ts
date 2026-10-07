import { ImageSourcePropType } from 'react-native';
import { EventItem } from '../../../types';
export type Category = 'All' | 'Cultural' | 'Music' | 'Food' | 'Religious' | 'Arts & Festival' | 'Sports' | 'Community';
export interface SeekerEvent {
 id: string; title: string; category: Category; city: string; date: string; venue: string;
 price: number; rating: string; reviews: string; badge: string; image: ImageSourcePropType; description: string;
 images: ImageSourcePropType[]; organizerName: string; publishedAt?: string;
 startTime: string; endTime: string; address: string; organizerId?: string; startDate: string; endDate: string;
}
export function toSeekerEvent(event: EventItem): SeekerEvent {
 const images = event.images?.length ? event.images.map(uri => ({ uri })) : [require('../../../../assets/logo.png')];
 return { images, organizerName: event.organizer?.fullName ?? 'Organizer unavailable', publishedAt: event.createdAt, id: event.id || event._id!, title: event.title, category: (event.category === 'Food & Drink' ? 'Food' : event.category) as Category,
 city: event.city, date: event.startDate + (event.endDate !== event.startDate ? ' – ' + event.endDate : ''), startDate: event.startDate, endDate: event.endDate,
 venue: event.locationName, price: event.isPaid ? event.ticketPrice ?? 0 : 0, rating: '', reviews: '', badge: event.status,
 image: event.images?.[0] ? { uri: event.images[0] } : require('../../../../assets/logo.png'), description: event.description,
 startTime: event.startTime, endTime: event.endTime, address: event.locationAddress, organizerId: event.organizerId };
}
