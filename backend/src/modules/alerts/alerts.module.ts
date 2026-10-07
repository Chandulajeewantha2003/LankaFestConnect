import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Alert, AlertSchema } from './alert.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
@Module({
 imports: [AuthModule, UsersModule, MongooseModule.forFeature([{ name: Alert.name, schema: AlertSchema }])],
 controllers: [AlertsController], providers: [AlertsService], exports: [MongooseModule],
})
export class AlertsModule {}
