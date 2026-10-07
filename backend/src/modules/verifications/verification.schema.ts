import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// A tourism officer's decision on one event. Events without a record are pending review.
export const VERIFICATION_STATUSES = ['VERIFIED', 'REJECTED', 'FLAGGED'] as const;
export type VerificationStatus = typeof VERIFICATION_STATUSES[number];
export const CHECKLIST_ITEMS = ['organizer', 'documents', 'media', 'safety', 'cultural'] as const;
export type ChecklistItem = typeof CHECKLIST_ITEMS[number];
export type Checklist = Record<ChecklistItem, boolean>;
@Schema({ timestamps: true })
export class Verification {
 @Prop({ required: true, unique: true }) eventId!: string;
 @Prop({ type: String, enum: VERIFICATION_STATUSES, required: true }) status!: VerificationStatus;
 @Prop({ default: '', maxlength: 1000 }) note!: string;
 @Prop({ required: true }) reviewerId!: string;
 @Prop({
  type: { organizer: { type: Boolean, default: false }, documents: { type: Boolean, default: false }, media: { type: Boolean, default: false }, safety: { type: Boolean, default: false }, cultural: { type: Boolean, default: false } },
  default: { organizer: false, documents: false, media: false, safety: false, cultural: false },
 })
 checklist!: Checklist;
}
export const VerificationSchema = SchemaFactory.createForClass(Verification);
