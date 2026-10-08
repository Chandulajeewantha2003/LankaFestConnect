import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { User } from '../users/user.schema';
// Runs after AuthGuard; the role is read from the database so a stale token cannot keep access.
@Injectable()
export class AuthorityGuard implements CanActivate {
 constructor(@InjectModel(User.name) private users: Model<User>) {}
 async canActivate(context: ExecutionContext) {
  const id = context.switchToHttp().getRequest().user?.sub;
  const user = isValidObjectId(id) ? await this.users.findById(id).select('role').exec() : null;
  if (user?.role !== 'AUTHORITY') throw new ForbiddenException('Tourism officer account required.');
  return true;
 }
}
