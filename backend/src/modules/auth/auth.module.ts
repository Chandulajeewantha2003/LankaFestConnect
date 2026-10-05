import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
@Module({
 imports: [UsersModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret || secret.length < 32 || secret.startsWith('replace-')) throw new Error('Set JWT_SECRET to a random secret of at least 32 characters.');
  return { secret, signOptions: { expiresIn: '7d' } };
 } })],
 controllers: [AuthController], providers: [AuthService, AuthGuard], exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
