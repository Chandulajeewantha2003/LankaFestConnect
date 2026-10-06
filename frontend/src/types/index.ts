export type UserRole = 'SEEKER' | 'ORGANIZER' | 'AUTHORITY' | 'GUIDE';

export interface EventSummary {
  id: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  startAt: string;
  endAt?: string;
  priceLabel?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';
  imageUrl?: string;
}

export interface EventItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  eventType: 'Physical Event' | 'Online Event' | string;
  audience: string[];
  locationName: string;
  locationAddress: string;
  city: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  images: string[];
  isPaid: boolean;
  ticketPrice?: number;
  additionalInfo: {
    foodAndBeverages: boolean;
    wheelchairAccessible: boolean;
    familyFriendly: boolean;
  };
  status: 'Published' | 'Upcoming' | 'Past' | 'Draft' | 'Cancelled';
  viewsCount?: number;
  interestedCount?: number;
  goingCount?: number;
  organizerId?: string;
  createdAt?: string;
}

export type CreateEventDTO = Omit<EventItem, 'id' | '_id' | 'createdAt'>;
