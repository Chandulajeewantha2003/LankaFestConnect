import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: true })
export class Conversation {
 @Prop({ required: true }) seekerId!: string;
 @Prop({ required: true }) organizerId!: string;
 @Prop({ default: '' }) lastMessage!: string;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ seekerId: 1, organizerId: 1 }, { unique: true });
@Schema({ timestamps: true })
export class ChatMessage {
 @Prop({ required: true, index: true }) conversationId!: string;
 @Prop({ required: true }) senderId!: string;
 @Prop({ required: true, maxlength: 2000 }) text!: string;
 @Prop({ required: true }) clientId!: string;
}
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ conversationId: 1, senderId: 1, clientId: 1 }, { unique: true });
