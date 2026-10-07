import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorityGuard } from './authority.guard';
import { AuthorityAlertsService } from './authority-alerts.service';
import { PublishAlertDto } from './authority.dto';
@Controller('authority/alerts') @UseGuards(AuthGuard, AuthorityGuard)
export class AuthorityAlertsController {
 constructor(private alerts: AuthorityAlertsService) {}
 @Get() list() { return this.alerts.list(); }
 @Post() @Throttle({ default: { limit: 10, ttl: 60000 } })
 publish(@Req() req: { user: { sub: string } }, @Body() body: PublishAlertDto) { return this.alerts.publish(req.user.sub, body); }
 @Patch(':id/withdraw') withdraw(@Param('id') id: string) { return this.alerts.withdraw(id); }
}
