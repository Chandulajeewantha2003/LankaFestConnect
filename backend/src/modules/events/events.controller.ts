import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
class SaveEventDto { @IsBoolean() saved!: boolean; }
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
type Request = { user: { sub: string } };
@Controller()
export class EventsController {
 constructor(private readonly eventsService: EventsService, private readonly auth: AuthService) {}
 private async owner(req: Request) { const user = await this.auth.current(req.user.sub); if (user.role !== 'ORGANIZER') throw new ForbiddenException('Organizer account required.'); return req.user.sub; }
 private async seeker(req: Request) { const user = await this.auth.current(req.user.sub); if (user.role !== 'SEEKER') throw new ForbiddenException('Seeker account required.'); return req.user.sub; }
 @Get('seeker/saved-events') @UseGuards(AuthGuard)
 async saved(@Req() req: Request) { return this.eventsService.savedIds(await this.seeker(req)); }
 @Post('events/:id/view') @UseGuards(AuthGuard)
 async view(@Req() req: Request, @Param('id') id: string) { return this.eventsService.recordView(id, await this.seeker(req)); }
 @Patch('events/:id/saved') @UseGuards(AuthGuard)
 async save(@Req() req: Request, @Param('id') id: string, @Body() body: SaveEventDto) { return this.eventsService.setSaved(id, await this.seeker(req), body.saved); }
 @Post('events') @UseGuards(AuthGuard)
 async create(@Req() req: Request, @Body() data: CreateEventDto) { return this.eventsService.create(data, await this.owner(req)); }
 @Get('events') findAll() { return this.eventsService.findAll(); }
 @Get('organizer/events') @UseGuards(AuthGuard)
 async mine(@Req() req: Request) { return this.eventsService.findOrganizerEvents(await this.owner(req)); }
 @Get('organizer/events/:id') @UseGuards(AuthGuard)
 async owned(@Req() req: Request, @Param('id') id: string) { return this.eventsService.findOne(id, await this.owner(req)); }
 @Get('events/:id') findOne(@Param('id') id: string) { return this.eventsService.findOne(id); }
 @Get('events/:id/insights') @UseGuards(AuthGuard)
 async insights(@Req() req: Request, @Param('id') id: string) { return this.eventsService.getInsights(id, await this.owner(req)); }
 @Patch('events/:id') @UseGuards(AuthGuard)
 async update(@Req() req: Request, @Param('id') id: string, @Body() data: UpdateEventDto) { return this.eventsService.update(id, data, await this.owner(req)); }
 @Delete('events/:id') @UseGuards(AuthGuard)
 async remove(@Req() req: Request, @Param('id') id: string) { return this.eventsService.remove(id, await this.owner(req)); }
 @Post('events/:id/duplicate') @UseGuards(AuthGuard)
 async duplicate(@Req() req: Request, @Param('id') id: string) { return this.eventsService.duplicate(id, await this.owner(req)); }
}
