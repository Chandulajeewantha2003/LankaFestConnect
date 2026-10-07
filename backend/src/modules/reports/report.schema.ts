import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// A report or complaint handled by tourism officers. Evidence photos are only loaded on the detail view.
export const REPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];
export const REPORT_CATEGORIES = ['INAPPROPRIATE_CONTENT', 'SAFETY_CONCERN', 'UNAUTHORIZED_EVENT', 'MISLEADING_INFORMATION', 'OTHER'] as const;
export type ReportCategory = typeof REPORT_CATEGORIES[number];
export const REPORT_PRIORITIES = ['NORMAL', 'HIGH', 'CRITICAL'] as const;
export type ReportPriority = typeof REPORT_PRIORITIES[number];
// PUBLIC is reserved for reports sent by event seekers; officers log the other sources.
export const REPORT_SOURCES = ['PUBLIC', 'FIELD_OFFICER', 'LOCAL_POLICE', 'PUBLIC_TIP'] as const;
export type ReportSource = typeof REPORT_SOURCES[number];
@Schema({ timestamps: true })
export class Report {
 @Prop({ type: String, default: null, index: true }) eventId!: string | null;
 @Prop({ default: '' }) eventTitle!: string;
 @Prop({ required: true }) reporterId!: string;
 @Prop({ type: String, enum: REPORT_SOURCES, required: true }) source!: ReportSource;
 @Prop({ type: String, enum: REPORT_CATEGORIES, required: true }) category!: ReportCategory;
 @Prop({ required: true, maxlength: 2000 }) description!: string;
 @Prop({ type: String, enum: REPORT_PRIORITIES, default: 'NORMAL' }) priority!: ReportPriority;
 @Prop({ type: String, enum: REPORT_STATUSES, default: 'OPEN', index: true }) status!: ReportStatus;
 @Prop({ type: [String], default: [], select: false }) evidence!: string[];
 @Prop({ default: 0 }) evidenceCount!: number;
 @Prop({ default: '', maxlength: 1000 }) resolutionNote!: string;
 @Prop({ type: String, default: null }) handledBy!: string | null;
}
export const ReportSchema = SchemaFactory.createForClass(Report);
