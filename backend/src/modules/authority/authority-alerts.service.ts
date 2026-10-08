import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Alert, AlertAudience, AlertClassification, AlertType } from '../alerts/alert.schema';
import { publicAlert } from '../alerts/alerts.service';
export interface NewAlert { type: AlertType; title: string; message: string; classification: AlertClassification; urgent: boolean; audiences: AlertAudience[] }
@Injectable()
export class AuthorityAlertsService {
 constructor(@InjectModel(Alert.name) private alerts: Model<Alert>) {}
 async list() {
  const rows = await this.alerts.find().sort({ createdAt: -1 }).limit(50).lean().exec();
  return rows.map(publicAlert);
 }
 async publish(officerId: string, input: NewAlert) {
  const title = input.title.trim(), message = input.message.trim();
  if (title.length < 5) throw new BadRequestException('Enter an alert title of at least 5 characters.');
  if (message.length < 10) throw new BadRequestException('Enter a message of at least 10 characters.');
  const audiences = [...new Set(input.audiences)];
  if (!audiences.length) throw new BadRequestException('Choose at least one target audience.');
  const row = await this.alerts.create({ type: input.type, title, message, classification: input.classification, urgent: input.urgent, audiences, authorId: officerId, status: 'ACTIVE' });
  return publicAlert(row.toObject());
 }
 async withdraw(id: string) {
  if (!isValidObjectId(id)) throw new NotFoundException('Alert not found.');
  const row = await this.alerts.findOneAndUpdate({ _id: id, status: 'ACTIVE' }, { $set: { status: 'WITHDRAWN', withdrawnAt: new Date() } }, { new: true }).lean().exec();
  if (row) return publicAlert(row);
  const exists = await this.alerts.findById(id).select('_id').lean().exec();
  if (!exists) throw new NotFoundException('Alert not found.');
  throw new ConflictException('This alert has already been withdrawn.');
 }
}
