import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User } from '../users/user.schema';
import { Alert, ROLE_AUDIENCES } from './alert.schema';
export function publicAlert(row: any) {
 return { id: String(row._id), type: row.type, title: row.title, message: row.message, classification: row.classification, urgent: !!row.urgent, audiences: row.audiences ?? [], status: row.status, createdAt: row.createdAt, withdrawnAt: row.withdrawnAt ?? null };
}
// Read-only alert feed for any signed-in account, filtered to the alerts aimed at its role.
@Injectable()
export class AlertsService {
 constructor(@InjectModel(Alert.name) private alerts: Model<Alert>, @InjectModel(User.name) private users: Model<User>) {}
 async feed(userId: string) {
  const user: any = isValidObjectId(userId) ? await this.users.findById(userId).select('role').lean().exec() : null;
  const audiences = user?.role ? ROLE_AUDIENCES[user.role] : undefined;
  if (!audiences) throw new ForbiddenException('Choose a role to view alerts.');
  const rows = await this.alerts.find({ status: 'ACTIVE', audiences: { $in: audiences } }).sort({ urgent: -1, createdAt: -1 }).limit(50).lean().exec();
  return rows.map(publicAlert);
 }
}
