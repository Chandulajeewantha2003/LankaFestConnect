import { Body, Controller, Delete, Get, Patch, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorityGuard } from './authority.guard';
import { AuthorityProfileService } from './authority-profile.service';
import { ProfilePhotoDto, UpdateProfileDto } from './authority.dto';
type Request = { user: { sub: string } };
// Every route works on the signed-in officer's own profile only.
@Controller('authority/profile') @UseGuards(AuthGuard, AuthorityGuard)
export class AuthorityProfileController {
 constructor(private profiles: AuthorityProfileService) {}
 @Get() get(@Req() req: Request) { return this.profiles.get(req.user.sub); }
 @Patch() update(@Req() req: Request, @Body() body: UpdateProfileDto) { return this.profiles.update(req.user.sub, body); }
 @Put('photo') photo(@Req() req: Request, @Body() body: ProfilePhotoDto) { return this.profiles.setPhoto(req.user.sub, body.photo); }
 @Delete('photo') removePhoto(@Req() req: Request) { return this.profiles.setPhoto(req.user.sub, null); }
}
