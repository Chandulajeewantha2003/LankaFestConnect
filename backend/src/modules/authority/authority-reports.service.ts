import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Event } from '../events/schemas/event.schema';
import { Report, REPORT_STATUSES, ReportCategory, ReportPriority, ReportSource, ReportStatus } from '../reports/report.schema';
const UNRESOLVED: ReportStatus[] = ['OPEN', 'IN_PROGRESS'];
const ACTIVE_EVENT_STATUSES: Event['status'][] = ['Published', 'Upcoming'];
// Which statuses a report may move to from each status.
const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
 OPEN: ['IN_PROGRESS', 'RESOLVED', 'ARCHIVED'],
 IN_PROGRESS: ['OPEN', 'RESOLVED', 'ARCHIVED'],
 RESOLVED: ['OPEN', 'ARCHIVED'],
 ARCHIVED: ['OPEN'],
};
const SOURCE_LABELS: Record<ReportSource, string> = { PUBLIC: 'User', FIELD_OFFICER: 'Field Officer', LOCAL_POLICE: 'Local Police', PUBLIC_TIP: 'Public Tip-off' };
export interface NewReport { category: ReportCategory; priority: ReportPriority; source: ReportSource; description: string; eventId?: string; evidence?: string[] }
@Injectable()
export class AuthorityReportsService {
 constructor(@InjectModel(Report.name) private reports: Model<Report>, @InjectModel(Event.name) private events: Model<Event>) {}
 private summary(row: any) {
  const id = String(row._id);
  return {
   id, ref: '#' + id.slice(-6).toUpperCase(), category: row.category, description: row.description, priority: row.priority, status: row.status,
   source: row.source, reporterLabel: row.source === 'PUBLIC' ? `User #${String(row.reporterId).slice(-4).toUpperCase()}` : SOURCE_LABELS[row.source as ReportSource] ?? 'Unknown',
   eventId: row.eventId ?? null, eventTitle: row.eventTitle ?? '', evidenceCount: row.evidenceCount ?? 0, resolutionNote: row.resolutionNote ?? '',
   createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
 }
 async list(status: ReportStatus) {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const critical = { status: { $in: UNRESOLVED }, priority: 'CRITICAL' as ReportPriority };
  const [counts, criticalUnresolved, criticalToday, rows] = await Promise.all([
   Promise.all(REPORT_STATUSES.map(value => this.reports.countDocuments({ status: value }).exec())),
   this.reports.countDocuments(critical).exec(),
   this.reports.countDocuments({ ...critical, createdAt: { $gte: startOfToday } }).exec(),
   this.reports.find({ status }).sort({ createdAt: -1 }).lean().exec(),
  ]);
  const byStatus = Object.fromEntries(REPORT_STATUSES.map((value, i) => [value, counts[i]])) as Record<ReportStatus, number>;
  return { status, counts: byStatus, pendingActions: byStatus.OPEN + byStatus.IN_PROGRESS, critical: { unresolved: criticalUnresolved, today: criticalToday }, reports: rows.map(row => this.summary(row)) };
 }
 async evidence(limit: number) {
  const match = { evidenceCount: { $gt: 0 }, status: { $ne: 'ARCHIVED' as ReportStatus } };
  const [totals, rows] = await Promise.all([
   this.reports.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$evidenceCount' } } }]).exec(),
   this.reports.find(match).select('+evidence').sort({ createdAt: -1 }).limit(limit).lean().exec(),
  ]);
  const items = (rows as any[]).flatMap(row => (row.evidence ?? []).map((image: string, index: number) => ({ reportId: String(row._id), ref: '#' + String(row._id).slice(-6).toUpperCase(), index, image }))).slice(0, limit);
  return { total: totals[0]?.total ?? 0, items };
 }
 async get(id: string) {
  const row: any = isValidObjectId(id) ? await this.reports.findById(id).select('+evidence').lean().exec() : null;
  if (!row) throw new NotFoundException('Report not found.');
  return { ...this.summary(row), evidence: row.evidence ?? [] };
 }
 async create(officerId: string, input: NewReport) {
  const description = input.description.trim();
  if (description.length < 10) throw new BadRequestException('Describe the issue in at least 10 characters.');
  let eventTitle = '';
  if (input.eventId) {
   const event: any = isValidObjectId(input.eventId) ? await this.events.findById(input.eventId).select('title').lean().exec() : null;
   if (!event) throw new BadRequestException('The selected event no longer exists.');
   eventTitle = event.title;
  }
  const evidence = input.evidence ?? [];
  const row = await this.reports.create({ eventId: input.eventId || null, eventTitle, reporterId: officerId, source: input.source, category: input.category, description, priority: input.priority, status: 'OPEN', evidence, evidenceCount: evidence.length });
  return this.summary(row.toObject());
 }
 async updateStatus(id: string, officerId: string, status: ReportStatus, note?: string) {
  if (!isValidObjectId(id)) throw new NotFoundException('Report not found.');
  const resolution = (note ?? '').trim();
  if (status === 'RESOLVED' && resolution.length < 5) throw new BadRequestException('Add a resolution note (at least 5 characters) before resolving.');
  const allowedFrom = REPORT_STATUSES.filter(from => TRANSITIONS[from].includes(status));
  const set: Record<string, unknown> = { status, handledBy: officerId };
  if (resolution) set.resolutionNote = resolution;
  // The status condition makes the change atomic, so two officers cannot apply conflicting updates.
  const row = await this.reports.findOneAndUpdate({ _id: id, status: { $in: allowedFrom } }, { $set: set }, { new: true, runValidators: true }).lean().exec();
  if (row) return this.summary(row);
  const current: any = await this.reports.findById(id).select('status').lean().exec();
  if (!current) throw new NotFoundException('Report not found.');
  throw new ConflictException(current.status === status ? 'This report already has that status.' : `A report that is ${String(current.status).replace('_', ' ').toLowerCase()} cannot be moved to ${status.replace('_', ' ').toLowerCase()}.`);
 }
 async eventOptions() {
  const rows = await this.events.find({ status: { $in: ACTIVE_EVENT_STATUSES } }).select('title city').sort({ createdAt: -1 }).limit(100).lean().exec();
  return (rows as any[]).map(row => ({ id: String(row._id), title: row.title, city: row.city }));
 }
}
