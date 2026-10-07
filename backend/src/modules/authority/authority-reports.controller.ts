import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorityGuard } from './authority.guard';
import { AuthorityReportsService } from './authority-reports.service';
import { CreateReportDto, EvidenceQuery, ListReportsQuery, UpdateReportStatusDto } from './authority.dto';
type Request = { user: { sub: string } };
@Controller('authority') @UseGuards(AuthGuard, AuthorityGuard)
export class AuthorityReportsController {
 constructor(private reports: AuthorityReportsService) {}
 @Get('reports') list(@Query() query: ListReportsQuery) { return this.reports.list(query.status ?? 'OPEN'); }
 @Get('reports/evidence') evidence(@Query() query: EvidenceQuery) { return this.reports.evidence(query.limit ?? 3); }
 @Get('reports/:id') get(@Param('id') id: string) { return this.reports.get(id); }
 @Post('reports') create(@Req() req: Request, @Body() body: CreateReportDto) { return this.reports.create(req.user.sub, body); }
 @Patch('reports/:id/status') status(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateReportStatusDto) { return this.reports.updateStatus(id, req.user.sub, body.status, body.note); }
 @Get('event-options') eventOptions() { return this.reports.eventOptions(); }
}
