import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AlertsService } from './alerts.service';
@Controller('alerts') @UseGuards(AuthGuard)
export class AlertsController {
 constructor(private alerts: AlertsService) {}
 @Get() feed(@Req() req: { user: { sub: string } }) { return this.alerts.feed(req.user.sub); }
}
