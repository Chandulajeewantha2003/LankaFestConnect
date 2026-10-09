import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// Tourism officer details kept separate from the shared users collection.
export const OFFICER_REGIONS = [
 'Island-wide', 'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
] as const;
export type OfficerRegion = typeof OFFICER_REGIONS[number];
@Schema({ timestamps: true })
export class OfficerProfile {
 @Prop({ required: true, unique: true }) userId!: string;
 @Prop({ default: 'Tourism Officer', maxlength: 60 }) designation!: string;
 @Prop({ type: String, enum: OFFICER_REGIONS, default: 'Island-wide' }) region!: OfficerRegion;
 @Prop({ default: '', maxlength: 20 }) officePhone!: string;
 @Prop({ type: String, default: null }) photo!: string | null;
}
export const OfficerProfileSchema = SchemaFactory.createForClass(OfficerProfile);
