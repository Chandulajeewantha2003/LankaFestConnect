import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { ChatsService } from './chats.service';
class OpenChatDto { @IsString() @Length(24,24) eventId!: string; }
class SendMessageDto { @IsString() @Length(1,2000) text!: string; @IsString() @Length(1,100) clientId!: string; }
type Request = { user: { sub: string } };
@Controller('chats') @UseGuards(AuthGuard)
export class ChatsController {
 constructor(private chats: ChatsService) {}
 @Post() open(@Req() req: Request, @Body() body: OpenChatDto) { return this.chats.open(req.user.sub, body.eventId); }
 @Get() list(@Req() req: Request) { return this.chats.list(req.user.sub); }
 @Get(':id/messages') history(@Req() req: Request, @Param('id') id: string, @Query('before') before?: string) { return this.chats.history(id,req.user.sub,before); }
 @Post(':id/messages') send(@Req() req: Request, @Param('id') id: string, @Body() body: SendMessageDto) { return this.chats.send(id,req.user.sub,body.text,body.clientId); }
}
