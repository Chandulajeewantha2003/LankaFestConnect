import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
@Module({
 imports: [ConfigModule.forRoot({ isGlobal: true }),
  MongooseModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI') }) }),
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), AuthModule],
 providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
