import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { User, UserDocument, UserRole } from '../users/user.schema';
import { RegisterDto, LoginDto } from './auth.dto';
@Injectable()
export class AuthService implements OnModuleInit {
 constructor(@InjectModel(User.name) private users: Model<User>, private jwt: JwtService) {}
 async onModuleInit() {
  // Merge legacy guide accounts without granting privileged authority access.
  await this.users.collection.updateMany({ role: 'GUIDE' }, { $set: { role: 'AUTHORITY', authorityApproved: false } });
 }
 private publicUser(user: UserDocument) {
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role, authorityApproved: user.authorityApproved };
 }
 private session(user: UserDocument) { return { token: this.jwt.sign({ sub: user.id }), user: this.publicUser(user) }; }
 async register(dto: RegisterDto) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = salt + ':' + scryptSync(dto.password, salt, 64).toString('hex');
  try { return this.session(await this.users.create({ fullName: dto.fullName.trim(), email: dto.email.trim().toLowerCase(), passwordHash })); }
  catch (error) {
   if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new ConflictException('An account already exists for this email. Please log in.');
   throw error;
  }
 }
 async login(dto: LoginDto) {
  const user = await this.users.findOne({ email: dto.email.trim().toLowerCase() }).select('+passwordHash');
  const [salt, hash] = (user?.passwordHash ?? 'invalid:' + '0'.repeat(128)).split(':');
  const actual = scryptSync(dto.password, salt, 64);
  if (!user || !timingSafeEqual(Buffer.from(hash, 'hex'), actual)) throw new UnauthorizedException('Email or password is incorrect.');
  return this.session(user);
 }
 async current(id: string) {
  const user = await this.users.findById(id);
  if (!user) throw new UnauthorizedException();
  return this.publicUser(user);
 }
 async selectRole(id: string, role: UserRole) {
  const user = await this.users.findOneAndUpdate({ _id: id, role: null }, { $set: { role } }, { new: true });
  if (!user) throw new ConflictException('Your role is already set. Contact support to change it.');
  return this.session(user);
 }
}
