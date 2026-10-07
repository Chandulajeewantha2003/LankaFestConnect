import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User } from '../users/user.schema';
import { Event, EventDocument } from './schemas/event.schema';
import { parseEventDateTime } from './event-schedule';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
@Injectable()
export class EventsService {
 constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>, @InjectModel(User.name) private readonly users?: Model<User>) {}
 private normalize(doc: any) { const obj = doc.toObject(); const { viewerIds, savedByIds, ...publicEvent } = obj; return { ...publicEvent, viewsCount: viewerIds ? viewerIds.length : obj.viewsCount ?? 0, interestedCount: savedByIds ? savedByIds.length : obj.interestedCount ?? 0, id: String(obj._id), _id: String(obj._id) }; }
 private validate(data: any) {
  for (const field of ['title','description','category','locationName','locationAddress','city','startDate','startTime','endDate','endTime']) {
   if (typeof data[field] !== 'string' || !data[field].trim()) throw new BadRequestException(field + ' is required.');
  }
  const start = parseEventDateTime(data.startDate, data.startTime), end = parseEventDateTime(data.endDate, data.endTime);
  if (!start || !end || end <= start) throw new BadRequestException('Choose a valid schedule with the end after the start.');
  if (data.isPaid && (!Number.isFinite(data.ticketPrice) || data.ticketPrice <= 0)) throw new BadRequestException('Enter a ticket price greater than zero.');
  if (!['Published','Upcoming','Past','Draft','Cancelled'].includes(data.status ?? 'Published')) throw new BadRequestException('Invalid event status.');
 }
 async create(data: CreateEventDto, organizerId: string) {
  this.validate(data);
  return this.normalize(await new this.eventModel({ ...data, organizerId, viewsCount: 0, interestedCount: 0, goingCount: 0 }).save());
 }
 private async publisher(event: any) {
  const user = this.users && isValidObjectId(event.organizerId) ? await this.users.findById(event.organizerId).select('fullName').exec() : null;
  return { ...event, organizer: user ? { id: String(user._id), fullName: user.fullName } : null };
 }
 async findAll() { return Promise.all((await this.eventModel.find({ status: { $in: ['Published','Upcoming','Past'] } }).select('+viewerIds +savedByIds').sort({ createdAt: -1 }).exec()).map(d => this.publisher(this.normalize(d)))); }
 async findOrganizerEvents(organizerId: string) { return (await this.eventModel.find({ organizerId }).sort({ createdAt: -1 }).exec()).map(d => this.normalize(d)); }
 async findOne(id: string, organizerId?: string) {
  if (!isValidObjectId(id)) throw new NotFoundException('Event not found.');
  const doc = await this.eventModel.findOne(organizerId ? { _id: id, organizerId } : { _id: id, status: { $in: ['Published','Upcoming','Past'] } }).select('+viewerIds +savedByIds').exec();
  if (!doc) throw new NotFoundException('Event not found.');
  return this.publisher(this.normalize(doc));
 }
 async update(id: string, data: UpdateEventDto, organizerId: string) {
  const existing = await this.findOne(id, organizerId);
  this.validate({ ...existing, ...data });
  const doc = await this.eventModel.findOneAndUpdate({ _id: id, organizerId }, { ...data, organizerId }, { new: true, runValidators: true }).exec();
  if (!doc) throw new NotFoundException('Event not found.');
  return this.normalize(doc);
 }
 async remove(id: string, organizerId: string) { await this.findOne(id, organizerId); await this.eventModel.deleteOne({ _id: id, organizerId }).exec(); return { success: true }; }
 async duplicate(id: string, organizerId: string) { const { id: ignored, _id, createdAt, updatedAt, __v, ...data } = await this.findOne(id, organizerId); return this.create({ ...data, title: data.title + ' (Copy)', status: 'Draft' }, organizerId); }
 async recordView(id: string, seekerId: string) {
  if (!isValidObjectId(id)) throw new NotFoundException('Event not found.');
  const doc = await this.eventModel.findOneAndUpdate({ _id: id, status: { $in: ['Published','Upcoming','Past'] } }, { $addToSet: { viewerIds: seekerId } }, { new: true }).select('+viewerIds +savedByIds').exec();
  if (!doc) throw new NotFoundException('Event not found.');
  return { viewsCount: this.normalize(doc).viewsCount };
 }
 async setSaved(id: string, seekerId: string, saved: boolean) {
  if (!isValidObjectId(id)) throw new NotFoundException('Event not found.');
  const doc = await this.eventModel.findOneAndUpdate({ _id: id, ...(saved ? { status: { $in: ['Published','Upcoming','Past'] } } : {}) }, saved ? { $addToSet: { savedByIds: seekerId } } : { $pull: { savedByIds: seekerId } }, { new: true }).select('+viewerIds +savedByIds').exec();
  if (!doc) throw new NotFoundException('Event not found.');
  return { saved, interestedCount: this.normalize(doc).interestedCount };
 }
 async savedIds(seekerId: string) { const docs = await this.eventModel.find({ savedByIds: seekerId }).select('_id').exec(); return docs.map(doc => String(doc._id)); }
 async getInsights(id: string, organizerId: string) { const event = await this.findOne(id, organizerId); return { eventSummary: event, viewsCount: event.viewsCount ?? 0, interestedCount: event.interestedCount ?? 0, goingCount: event.goingCount ?? 0, interestOverTime: [], recentMessages: [] }; }
}
