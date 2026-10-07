import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto implements Partial<CreateEventDto> {
  title?: string;
  description?: string;
  category?: string;
  eventType?: string;
  audience?: string[];
  locationName?: string;
  locationAddress?: string;
  city?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  images?: string[];
  isPaid?: boolean;
  ticketPrice?: number;
  additionalInfo?: {
    foodAndBeverages?: boolean;
    wheelchairAccessible?: boolean;
    familyFriendly?: boolean;
  };
  status?: 'Published' | 'Upcoming' | 'Past' | 'Draft' | 'Cancelled';
  organizerId?: string;
}
