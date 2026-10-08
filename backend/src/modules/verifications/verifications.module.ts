import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Verification, VerificationSchema } from './verification.schema';
@Module({ imports: [MongooseModule.forFeature([{ name: Verification.name, schema: VerificationSchema }])], exports: [MongooseModule] })
export class VerificationsModule {}
