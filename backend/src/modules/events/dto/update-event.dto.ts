import { IsArray, IsUrl, Matches, MaxLength, IsBoolean, IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(2048)
  @Matches(/^https:\/\/(?:(?:www\.)?google\.com\/maps(?:[/?#]|$)|maps\.google\.com(?:[/?#]|$)|maps\.app\.goo\.gl\/[^\s]+|goo\.gl\/maps\/[^\s]+)/i)
  mapsUrl?: string;
  @IsOptional() @IsString() placeId?: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;

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
