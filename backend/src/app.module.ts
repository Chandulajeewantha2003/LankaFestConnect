import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ChatsModule } from './modules/chats/chats.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorityModule } from './modules/authority/authority.module';
@Module({
 imports: [ConfigModule.forRoot({ isGlobal: true }),
  MongooseModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI') }) }),
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), AuthModule, EventsModule, ChatsModule, AuthorityModule],
 providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
