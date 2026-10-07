import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsArray()
  audience?: string[];

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsNumber()
  ticketPrice?: number;

  @IsOptional()
  additionalInfo?: {
    foodAndBeverages?: boolean;
    wheelchairAccessible?: boolean;
    familyFriendly?: boolean;
  };

  @IsOptional()
  @IsString()
  status?: 'Published' | 'Upcoming' | 'Past' | 'Draft' | 'Cancelled';

  @IsOptional()
  @IsString()
  organizerId?: string;
}
