import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { VerificationsModule } from '../verifications/verifications.module';
import { ReportsModule } from '../reports/reports.module';
import { AlertsModule } from '../alerts/alerts.module';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { AuthorityController } from './authority.controller';
import { AuthorityGuard } from './authority.guard';
import { AuthorityService } from './authority.service';
import { AuthorityReportsController } from './authority-reports.controller';
import { AuthorityReportsService } from './authority-reports.service';
import { AuthorityAlertsController } from './authority-alerts.controller';
import { AuthorityAlertsService } from './authority-alerts.service';
// Events are only read here; organizer-owned event data is never modified by this module.
@Module({
 imports: [AuthModule, UsersModule, VerificationsModule, ReportsModule, AlertsModule, MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }])],
 controllers: [AuthorityController, AuthorityReportsController, AuthorityAlertsController], providers: [AuthorityService, AuthorityReportsService, AuthorityAlertsService, AuthorityGuard],
})
export class AuthorityModule {}
