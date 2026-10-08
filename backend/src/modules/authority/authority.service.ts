import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Event } from '../events/schemas/event.schema';
import { User } from '../users/user.schema';
import { CHECKLIST_ITEMS, Checklist, Verification, VerificationStatus } from '../verifications/verification.schema';
import { Report } from '../reports/report.schema';
// Events organizers have made public and that are not finished or cancelled.
const ACTIVE_STATUSES: Event['status'][] = ['Published', 'Upcoming'];
const DAY_MS = 24 * 60 * 60 * 1000;
export const LISTING_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type ListingStatus = typeof LISTING_STATUSES[number];
@Injectable()
export class AuthorityService {
 constructor(@InjectModel(Event.name) private events: Model<Event>, @InjectModel(Verification.name) private verifications: Model<Verification>, @InjectModel(Report.name) private reports: Model<Report>, @InjectModel(User.name) private users: Model<User>) {}
 async dashboard() {
  const [events, decisions, openReports] = await Promise.all([
   this.events.find({ status: { $in: ACTIVE_STATUSES } }).select('_id createdAt').lean().exec(),
   this.verifications.find().select('eventId status').lean().exec(),
   this.reports.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }).exec(),
  ]);
  const statusByEvent = new Map(decisions.map(row => [row.eventId, row.status]));
  const since = Date.now() - DAY_MS;
  const counts = { pendingReview: 0, newPendingToday: 0, verifiedActive: 0, flagged: 0 };
  for (const event of events as any[]) {
   const status = statusByEvent.get(String(event._id));
   if (!status) { counts.pendingReview++; if (new Date(event.createdAt).getTime() >= since) counts.newPendingToday++; }
   else if (status === 'VERIFIED') counts.verifiedActive++;
   else if (status === 'FLAGGED') counts.flagged++;
  }
  return { ...counts, openReports, generatedAt: new Date().toISOString() };
 }
 async listEvents(status: ListingStatus) {
  const decisions = await this.verifications.find().select('eventId status note updatedAt').lean().exec();
  const decisionByEvent = new Map(decisions.map(row => [row.eventId, row]));
  const idsWith = (value?: string) => decisions.filter(row => !value || row.status === value).map(row => row.eventId).filter(id => isValidObjectId(id));
  const active = { status: { $in: ACTIVE_STATUSES } };
  const filters: Record<ListingStatus, object> = {
   PENDING: { ...active, _id: { $nin: idsWith() } },
   VERIFIED: { ...active, _id: { $in: idsWith('VERIFIED') } },
   REJECTED: { ...active, _id: { $in: idsWith('REJECTED') } },
  };
  // Only the cover image is returned; full image sets stay on the detail view.
  const [pending, verified, rejected, rows] = await Promise.all([
   this.events.countDocuments(filters.PENDING).exec(),
   this.events.countDocuments(filters.VERIFIED).exec(),
   this.events.countDocuments(filters.REJECTED).exec(),
   this.events.find(filters[status]).select({ images: { $slice: 1 } }).sort({ createdAt: -1 }).lean().exec(),
  ]);
  const organizerIds = [...new Set((rows as any[]).map(row => row.organizerId).filter(id => isValidObjectId(id)))];
  const organizers = organizerIds.length ? await this.users.find({ _id: { $in: organizerIds } }).select('fullName').lean().exec() : [];
  const organizerName = new Map((organizers as any[]).map(user => [String(user._id), user.fullName]));
  const events = (rows as any[]).map(row => {
   const id = String(row._id), decision: any = decisionByEvent.get(id);
   return {
    id, title: row.title, description: row.description, category: row.category, city: row.city,
    locationName: row.locationName, locationAddress: row.locationAddress,
    startDate: row.startDate, startTime: row.startTime, endDate: row.endDate, endTime: row.endTime,
    coverImage: row.images?.[0] ?? null, isPaid: !!row.isPaid, ticketPrice: row.ticketPrice ?? 0,
    eventStatus: row.status, createdAt: row.createdAt,
    organizer: organizerName.has(row.organizerId) ? { id: row.organizerId, fullName: organizerName.get(row.organizerId) } : null,
    verification: { status: decision?.status ?? 'PENDING', note: decision?.note ?? '', decidedAt: decision?.updatedAt ?? null },
   };
  });
  return { status, counts: { PENDING: pending, VERIFIED: verified, REJECTED: rejected }, events };
 }
 private async activeEvent(id: string) {
  const event: any = isValidObjectId(id) ? await this.events.findOne({ _id: id, status: { $in: ACTIVE_STATUSES } }).lean().exec() : null;
  if (!event) throw new NotFoundException('Event not found or no longer open for review.');
  return event;
 }
 private publicDecision(decision: any) {
  return {
   status: decision?.status ?? 'PENDING', note: decision?.note ?? '', decidedAt: decision?.updatedAt ?? null,
   checklist: Object.fromEntries(CHECKLIST_ITEMS.map(item => [item, !!decision?.checklist?.[item]])) as Checklist,
  };
 }
 async getEvent(id: string) {
  const event = await this.activeEvent(id);
  const [decision, organizer]: any[] = await Promise.all([
   this.verifications.findOne({ eventId: String(event._id) }).lean().exec(),
   isValidObjectId(event.organizerId) ? this.users.findById(event.organizerId).select('fullName').lean().exec() : null,
  ]);
  return {
   id: String(event._id), title: event.title, description: event.description, category: event.category, eventType: event.eventType,
   audience: event.audience ?? [], city: event.city, locationName: event.locationName, locationAddress: event.locationAddress,
   startDate: event.startDate, startTime: event.startTime, endDate: event.endDate, endTime: event.endTime,
   images: event.images ?? [], isPaid: !!event.isPaid, ticketPrice: event.ticketPrice ?? 0, additionalInfo: event.additionalInfo ?? {},
   eventStatus: event.status, createdAt: event.createdAt,
   organizer: organizer ? { id: String(organizer._id), fullName: organizer.fullName } : null,
   verification: this.publicDecision(decision),
  };
 }
 async decide(id: string, reviewerId: string, input: { status: VerificationStatus; note?: string; checklist: Checklist }) {
  const event = await this.activeEvent(id);
  const note = (input.note ?? '').trim();
  const checklist = Object.fromEntries(CHECKLIST_ITEMS.map(item => [item, input.checklist[item] === true])) as Checklist;
  if (input.status === 'VERIFIED' && !CHECKLIST_ITEMS.every(item => checklist[item])) throw new BadRequestException('Complete every evidence checklist item before approving clearance.');
  if (input.status !== 'VERIFIED' && note.length < 5) throw new BadRequestException('Add a reason in the officer inspection notes (at least 5 characters).');
  const eventId = String(event._id);
  const update = { $set: { status: input.status, note, checklist, reviewerId }, $setOnInsert: { eventId } };
  let decision;
  try { decision = await this.verifications.findOneAndUpdate({ eventId }, update, { upsert: true, new: true, runValidators: true }).lean().exec(); }
  catch (err: any) { if (err?.code !== 11000) throw err; decision = await this.verifications.findOneAndUpdate({ eventId }, update, { new: true, runValidators: true }).lean().exec(); }
  return { eventId, verification: this.publicDecision(decision) };
 }
 async resetDecision(id: string) {
  const event = await this.activeEvent(id);
  await this.verifications.deleteOne({ eventId: String(event._id) }).exec();
  return { eventId: String(event._id), verification: this.publicDecision(null) };
 }
}
