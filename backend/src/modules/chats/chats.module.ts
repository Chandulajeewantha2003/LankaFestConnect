import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { Conversation, ConversationSchema, ChatMessage, ChatMessageSchema } from './chat.schema';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
@Module({ imports: [AuthModule, UsersModule, EventsModule, MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }, { name: ChatMessage.name, schema: ChatMessageSchema }])], providers: [ChatsService], controllers: [ChatsController] })
export class ChatsModule {}
