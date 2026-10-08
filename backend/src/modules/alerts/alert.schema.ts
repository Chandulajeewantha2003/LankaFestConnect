import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// A public safety alert or general notice published by a tourism officer.
export const ALERT_TYPES = ['SAFETY_ALERT', 'GENERAL_NOTICE'] as const;
export type AlertType = typeof ALERT_TYPES[number];
export const ALERT_CLASSIFICATIONS = ['SAFETY', 'ROUTE', 'WEATHER', 'GENERAL'] as const;
export type AlertClassification = typeof ALERT_CLASSIFICATIONS[number];
export const ALERT_AUDIENCES = ['ALL_USERS', 'TOURISTS', 'ORGANIZERS', 'GUIDES'] as const;
export type AlertAudience = typeof ALERT_AUDIENCES[number];
export const ALERT_STATUSES = ['ACTIVE', 'WITHDRAWN'] as const;
export type AlertStatus = typeof ALERT_STATUSES[number];
@Schema({ timestamps: true })
export class Alert {
 @Prop({ type: String, enum: ALERT_TYPES, required: true }) type!: AlertType;
 @Prop({ required: true, maxlength: 100 }) title!: string;
 @Prop({ required: true, maxlength: 300 }) message!: string;
 @Prop({ type: String, enum: ALERT_CLASSIFICATIONS, required: true }) classification!: AlertClassification;
 @Prop({ default: false }) urgent!: boolean;
 @Prop({ type: [{ type: String, enum: ALERT_AUDIENCES }], required: true }) audiences!: AlertAudience[];
 @Prop({ type: String, enum: ALERT_STATUSES, default: 'ACTIVE', index: true }) status!: AlertStatus;
 @Prop({ required: true }) authorId!: string;
 @Prop({ type: Date, default: null }) withdrawnAt!: Date | null;
}
export const AlertSchema = SchemaFactory.createForClass(Alert);
// Which audiences each account role belongs to when reading the alert feed.
export const ROLE_AUDIENCES: Record<string, AlertAudience[]> = {
 SEEKER: ['ALL_USERS', 'TOURISTS'],
 ORGANIZER: ['ALL_USERS', 'ORGANIZERS'],
 AUTHORITY: ['ALL_USERS', 'TOURISTS', 'ORGANIZERS', 'GUIDES'],
};
