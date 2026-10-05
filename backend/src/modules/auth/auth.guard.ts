import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthGuard implements CanActivate {
 constructor(private jwt: JwtService) {}
 canActivate(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest();
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException();
  try { request.user = this.jwt.verify(authorization.slice(7)); return true; }
  catch { throw new UnauthorizedException('Session expired. Please log in again.'); }
 }
}
