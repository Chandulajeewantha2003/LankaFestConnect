import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RoleDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
@Controller('auth')
export class AuthController {
 constructor(private auth: AuthService) {}
 @Post('register') @Throttle({ default: { limit: 5, ttl: 60000 } })
 register(@Body() body: RegisterDto) { return this.auth.register(body); }
 @Post('login') @Throttle({ default: { limit: 10, ttl: 60000 } })
 login(@Body() body: LoginDto) { return this.auth.login(body); }
 @Get('me') @UseGuards(AuthGuard)
 me(@Req() request: { user: { sub: string } }) { return this.auth.current(request.user.sub); }
 @Patch('role') @UseGuards(AuthGuard)
 role(@Req() request: { user: { sub: string } }, @Body() body: RoleDto) { return this.auth.selectRole(request.user.sub, body.role); }
}
