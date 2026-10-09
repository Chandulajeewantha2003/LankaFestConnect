import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsMongoId, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { REPORT_CATEGORIES, REPORT_PRIORITIES, REPORT_STATUSES, ReportCategory, ReportPriority, ReportSource, ReportStatus } from '../reports/report.schema';
import { ALERT_AUDIENCES, ALERT_CLASSIFICATIONS, ALERT_TYPES, AlertAudience, AlertClassification, AlertType } from '../alerts/alert.schema';
import { OFFICER_REGIONS, OfficerRegion } from './officer-profile.schema';
const OFFICER_SOURCES: ReportSource[] = ['FIELD_OFFICER', 'LOCAL_POLICE', 'PUBLIC_TIP'];
import { VERIFICATION_STATUSES, VerificationStatus } from '../verifications/verification.schema';
import { LISTING_STATUSES, ListingStatus } from './authority.service';
export class ListEventsQuery { @IsOptional() @IsIn(LISTING_STATUSES) status?: ListingStatus; }
export class ChecklistDto {
 @IsBoolean() organizer!: boolean;
 @IsBoolean() documents!: boolean;
 @IsBoolean() media!: boolean;
 @IsBoolean() safety!: boolean;
 @IsBoolean() cultural!: boolean;
}
export class DecisionDto {
 @IsIn(VERIFICATION_STATUSES) status!: VerificationStatus;
 @IsOptional() @IsString() @MaxLength(1000) note?: string;
 @IsObject() @ValidateNested() @Type(() => ChecklistDto) checklist!: ChecklistDto;
}
// Evidence photos are JPEG/PNG/WebP data URIs, already resized on the device.
export const EVIDENCE_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
export const MAX_EVIDENCE = 3;
export const MAX_EVIDENCE_LENGTH = 1500000;
export class ListReportsQuery { @IsOptional() @IsIn(REPORT_STATUSES) status?: ReportStatus; }
export class EvidenceQuery { @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number; }
export class CreateReportDto {
 @IsIn(REPORT_CATEGORIES) category!: ReportCategory;
 @IsIn(REPORT_PRIORITIES) priority!: ReportPriority;
 @IsIn(OFFICER_SOURCES) source!: ReportSource;
 @IsString() @MinLength(10) @MaxLength(2000) description!: string;
 @IsOptional() @IsMongoId() eventId?: string;
 @IsOptional() @IsArray() @ArrayMaxSize(MAX_EVIDENCE) @IsString({ each: true }) @MaxLength(MAX_EVIDENCE_LENGTH, { each: true }) @Matches(EVIDENCE_PATTERN, { each: true, message: 'Evidence must be JPEG, PNG or WebP images.' }) evidence?: string[];
}
export class UpdateReportStatusDto {
 @IsIn(REPORT_STATUSES) status!: ReportStatus;
 @IsOptional() @IsString() @MaxLength(1000) note?: string;
}
export class PublishAlertDto {
 @IsIn(ALERT_TYPES) type!: AlertType;
 @IsString() @MinLength(5) @MaxLength(100) title!: string;
 @IsString() @MinLength(10) @MaxLength(300) message!: string;
 @IsIn(ALERT_CLASSIFICATIONS) classification!: AlertClassification;
 @IsBoolean() urgent!: boolean;
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(ALERT_AUDIENCES.length) @IsIn(ALERT_AUDIENCES, { each: true }) audiences!: AlertAudience[];
}
export const PROFILE_PHOTO_LENGTH = 400000;
export class UpdateProfileDto {
 @IsOptional() @IsString() @MaxLength(60) designation?: string;
 @IsOptional() @IsIn(OFFICER_REGIONS) region?: OfficerRegion;
 @IsOptional() @IsString() @Matches(/^(\+?[0-9][0-9 ]{6,18})?$/, { message: 'Enter a valid phone number (digits, spaces and an optional leading +).' }) officePhone?: string;
}
export class ProfilePhotoDto {
 @IsString() @MaxLength(PROFILE_PHOTO_LENGTH, { message: 'That photo is too large. Please choose a smaller image.' }) @Matches(EVIDENCE_PATTERN, { message: 'Profile photo must be a JPEG, PNG or WebP image.' }) photo!: string;
}
