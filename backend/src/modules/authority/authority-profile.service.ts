import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User } from '../users/user.schema';
import { Event } from '../events/schemas/event.schema';
import { Verification } from '../verifications/verification.schema';
import { Report } from '../reports/report.schema';
import { Alert } from '../alerts/alert.schema';
import { OfficerProfile, OfficerRegion } from './officer-profile.schema';
export interface ProfileChanges { designation?: string; region?: OfficerRegion; officePhone?: string }
const DEFAULTS = { designation: 'Tourism Officer', region: 'Island-wide' as OfficerRegion, officePhone: '', photo: null as string | null };
@Injectable()
export class AuthorityProfileService {
 constructor(
  @InjectModel(OfficerProfile.name) private profiles: Model<OfficerProfile>,
  @InjectModel(User.name) private users: Model<User>,
  @InjectModel(Event.name) private events: Model<Event>,
  @InjectModel(Verification.name) private verifications: Model<Verification>,
  @InjectModel(Report.name) private reports: Model<Report>,
  @InjectModel(Alert.name) private alerts: Model<Alert>,
 ) {}
 private details(row: any) {
  return { designation: row?.designation ?? DEFAULTS.designation, region: row?.region ?? DEFAULTS.region, officePhone: row?.officePhone ?? DEFAULTS.officePhone, photo: row?.photo ?? DEFAULTS.photo };
 }
 async get(userId: string) {
  const user: any = isValidObjectId(userId) ? await this.users.findById(userId).select('fullName email role authorityApproved createdAt').lean().exec() : null;
  if (!user) throw new NotFoundException('Account not found.');
  const mine = { reviewerId: userId };
  const [profile, verified, rejected, flagged, reportsFiled, reportsResolved, alertsPublished, alertsActive, recent] = await Promise.all([
   this.profiles.findOne({ userId }).lean().exec(),
   this.verifications.countDocuments({ ...mine, status: 'VERIFIED' }).exec(),
   this.verifications.countDocuments({ ...mine, status: 'REJECTED' }).exec(),
   this.verifications.countDocuments({ ...mine, status: 'FLAGGED' }).exec(),
   this.reports.countDocuments({ reporterId: userId, source: { $ne: 'PUBLIC' } }).exec(),
   this.reports.countDocuments({ handledBy: userId, status: 'RESOLVED' }).exec(),
   this.alerts.countDocuments({ authorId: userId }).exec(),
   this.alerts.countDocuments({ authorId: userId, status: 'ACTIVE' }).exec(),
   this.verifications.find(mine).select('eventId status updatedAt').sort({ updatedAt: -1 }).limit(5).lean().exec(),
  ]);
  const ids = (recent as any[]).map(row => row.eventId).filter(id => isValidObjectId(id));
  const titles = ids.length ? await this.events.find({ _id: { $in: ids } }).select('title').lean().exec() : [];
  const titleById = new Map((titles as any[]).map(row => [String(row._id), row.title]));
  return {
   account: { id: String(user._id), fullName: user.fullName, email: user.email, authorityApproved: !!user.authorityApproved, memberSince: user.createdAt ?? null },
   profile: this.details(profile),
   activity: { eventsVerified: verified, eventsRejected: rejected, eventsFlagged: flagged, reportsFiled, reportsResolved, alertsPublished, alertsActive },
   recentDecisions: (recent as any[]).map(row => ({ eventId: row.eventId, eventTitle: titleById.get(row.eventId) ?? 'Event no longer available', status: row.status, decidedAt: row.updatedAt })),
  };
 }
 private async save(userId: string, set: Record<string, unknown>) {
  const update = { $set: set, $setOnInsert: { userId } };
  try { return await this.profiles.findOneAndUpdate({ userId }, update, { upsert: true, new: true, runValidators: true }).lean().exec(); }
  catch (err: any) { if (err?.code !== 11000) throw err; return this.profiles.findOneAndUpdate({ userId }, update, { new: true, runValidators: true }).lean().exec(); }
 }
 async update(userId: string, changes: ProfileChanges) {
  const set: Record<string, unknown> = {};
  if (changes.designation !== undefined) set.designation = changes.designation.trim() || DEFAULTS.designation;
  if (changes.region !== undefined) set.region = changes.region;
  if (changes.officePhone !== undefined) set.officePhone = changes.officePhone.trim().replace(/\s+/g, ' ');
  return this.details(await this.save(userId, set));
 }
 async setPhoto(userId: string, photo: string | null) {
  return this.details(await this.save(userId, { photo }));
 }
}
