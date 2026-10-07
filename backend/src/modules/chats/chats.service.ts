import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Conversation, ChatMessage } from './chat.schema';
import { User } from '../users/user.schema';
import { EventsService } from '../events/events.service';
@Injectable()
export class ChatsService {
 constructor(@InjectModel(Conversation.name) private conversations: Model<Conversation>, @InjectModel(ChatMessage.name) private messages: Model<ChatMessage>, @InjectModel(User.name) private users: Model<User>, private events: EventsService) {}
 async open(seekerId: string, eventId: string) {
  const seeker = await this.users.findById(seekerId).exec();
  if (seeker?.role !== 'SEEKER') throw new ForbiddenException('A seeker account is required.');
  const event = await this.events.findOne(eventId);
  const organizer = isValidObjectId(event.organizerId) ? await this.users.findById(event.organizerId).exec() : null;
  if (!organizer || organizer.role !== 'ORGANIZER') throw new NotFoundException('This organizer is unavailable.');
  const pair = { seekerId, organizerId: String(organizer._id) };
  let chat;
  try { chat = await this.conversations.findOneAndUpdate(pair, { $setOnInsert: pair }, { upsert: true, new: true }).exec(); }
  catch (err: any) { if (err.code !== 11000) throw err; chat = await this.conversations.findOne(pair).exec(); }
  return { id: String(chat!._id), other: { id: String(organizer._id), fullName: organizer.fullName }, lastMessage: chat!.lastMessage };
 }
 async list(userId: string) {
  const chats = await this.conversations.find({ $or: [{ seekerId: userId }, { organizerId: userId }] }).sort({ updatedAt: -1 }).exec();
  return Promise.all(chats.map(async chat => { const otherId = chat.seekerId === userId ? chat.organizerId : chat.seekerId; const other = await this.users.findById(otherId).select('fullName').exec(); return { id: String(chat._id), other: { id: otherId, fullName: other?.fullName ?? 'Unavailable account' }, lastMessage: chat.lastMessage }; }));
 }
 private async owned(id: string, userId: string) {
  if (!isValidObjectId(id)) throw new NotFoundException('Conversation not found.');
  const chat = await this.conversations.findOne({ _id: id, $or: [{ seekerId: userId }, { organizerId: userId }] }).exec();
  if (!chat) throw new NotFoundException('Conversation not found.');
  return chat;
 }
 async history(id: string, userId: string, before?: string) {
  await this.owned(id,userId);
  if (before && !isValidObjectId(before)) throw new BadRequestException('Invalid message cursor.');
  const rows = await this.messages.find({ conversationId: id, ...(before ? { _id: { $lt: before } } : {}) }).sort({ _id: -1 }).limit(50).exec();
  return rows.reverse().map(row => ({ id: String(row._id), senderId: row.senderId, text: row.text, createdAt: (row as any).createdAt }));
 }
 async send(id: string, userId: string, text: string, clientId: string) {
  await this.owned(id,userId);
  const clean = text.trim();
  if (!clean || clean.length > 2000) throw new BadRequestException('Enter a message of 1–2000 characters.');
  const message = await this.messages.findOneAndUpdate({ conversationId: id, senderId: userId, clientId }, { $setOnInsert: { conversationId: id, senderId: userId, clientId, text: clean } }, { upsert: true, new: true }).exec();
  await this.conversations.updateOne({ _id: id }, { $set: { lastMessage: message!.text } }).exec();
  return { id: String(message!._id), senderId: message!.senderId, text: message!.text, createdAt: (message as any).createdAt };
 }
}
