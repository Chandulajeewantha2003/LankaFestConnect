import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('events')
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get('events')
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('organizer/events')
  findOrganizerEvents(@Query('organizerId') organizerId?: string) {
    return this.eventsService.findOrganizerEvents(organizerId || 'organizer_host_1');
  }

  @Get('events/:id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get('events/:id/insights')
  getInsights(@Param('id') id: string) {
    return this.eventsService.getInsights(id);
  }

  @Patch('events/:id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete('events/:id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post('events/:id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.eventsService.duplicate(id);
  }
}
