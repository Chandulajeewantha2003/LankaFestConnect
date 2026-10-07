import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsArray()
  audience?: string[];

  @IsString()
  locationName!: string;

  @IsString()
  locationAddress!: string;

  @IsString()
  city!: string;

  @IsString()
  startDate!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endDate!: string;

  @IsString()
  endTime!: string;

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
