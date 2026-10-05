export type UserRole = 'SEEKER' | 'ORGANIZER' | 'AUTHORITY';

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
