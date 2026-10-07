import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: [String], default: [], select: false }) viewerIds!: string[];
  @Prop({ type: [String], default: [], select: false }) savedByIds!: string[];
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ default: 'Physical Event' })
  eventType!: string;

  @Prop({ type: [String], default: ['All Ages'] })
  audience!: string[];

  @Prop({ required: true })
  locationName!: string;

  @Prop({ required: true })
  locationAddress!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  startDate!: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endDate!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ default: false })
  isPaid!: boolean;

  @Prop({ default: 0 })
  ticketPrice!: number;

  @Prop({
    type: {
      foodAndBeverages: { type: Boolean, default: false },
      wheelchairAccessible: { type: Boolean, default: false },
      familyFriendly: { type: Boolean, default: false },
    },
    default: {
      foodAndBeverages: false,
      wheelchairAccessible: false,
      familyFriendly: false,
    },
  })
  additionalInfo!: {
    foodAndBeverages: boolean;
    wheelchairAccessible: boolean;
    familyFriendly: boolean;
  };

  @Prop({ default: 'Published' })
  status!: 'Published' | 'Upcoming' | 'Past' | 'Draft' | 'Cancelled';

  @Prop({ default: 0 })
  viewsCount!: number;

  @Prop({ default: 0 })
  interestedCount!: number;

  @Prop({ default: 0 })
  goingCount!: number;

  @Prop({ required: true, index: true })
  organizerId!: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
