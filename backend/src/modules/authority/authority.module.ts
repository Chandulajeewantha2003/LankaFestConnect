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
import { AuthorityProfileController } from './authority-profile.controller';
import { AuthorityProfileService } from './authority-profile.service';
import { OfficerProfile, OfficerProfileSchema } from './officer-profile.schema';
// Events are only read here; organizer-owned event data is never modified by this module.
@Module({
 imports: [AuthModule, UsersModule, VerificationsModule, ReportsModule, AlertsModule, MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }, { name: OfficerProfile.name, schema: OfficerProfileSchema }])],
 controllers: [AuthorityController, AuthorityReportsController, AuthorityAlertsController, AuthorityProfileController], providers: [AuthorityService, AuthorityReportsService, AuthorityAlertsService, AuthorityProfileService, AuthorityGuard],
})
export class AuthorityModule {}
