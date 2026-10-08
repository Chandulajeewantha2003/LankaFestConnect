import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorityGuard } from './authority.guard';
import { AuthorityService } from './authority.service';
import { DecisionDto, ListEventsQuery } from './authority.dto';
type Request = { user: { sub: string } };
@Controller('authority') @UseGuards(AuthGuard, AuthorityGuard)
export class AuthorityController {
 constructor(private authority: AuthorityService) {}
 @Get('dashboard') dashboard() { return this.authority.dashboard(); }
 @Get('events') events(@Query() query: ListEventsQuery) { return this.authority.listEvents(query.status ?? 'PENDING'); }
 @Get('events/:id') event(@Param('id') id: string) { return this.authority.getEvent(id); }
 @Put('events/:id/verification') decide(@Req() req: Request, @Param('id') id: string, @Body() body: DecisionDto) { return this.authority.decide(id, req.user.sub, body); }
 @Delete('events/:id/verification') reset(@Param('id') id: string) { return this.authority.resetDecision(id); }
}
