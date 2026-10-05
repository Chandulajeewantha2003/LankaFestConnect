import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export const ROLES = ['SEEKER', 'ORGANIZER', 'AUTHORITY'] as const;
export type UserRole = typeof ROLES[number];
export type UserDocument = HydratedDocument<User>;
@Schema({ timestamps: true })
export class User {
 @Prop({ required: true, trim: true }) fullName!: string;
 @Prop({ required: true, unique: true, lowercase: true, trim: true }) email!: string;
 @Prop({ required: true, select: false }) passwordHash!: string;
 @Prop({ type: String, enum: ROLES, default: null }) role!: UserRole | null;
 @Prop({ default: false }) authorityApproved!: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
