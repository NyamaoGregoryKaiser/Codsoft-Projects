```typescript
import { Controller, Post, Body, Get, Param, UseGuards, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Message } from '@prisma/client';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message to a conversation' })
  @ApiResponse({ status: 201, description: 'Message successfully sent.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @CurrentUser('id') senderId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    return this.messageService.sendMessage(senderId, sendMessageDto);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get all messages for a specific conversation' })
  @ApiResponse({ status: 200, description: 'Return a list of messages.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAllInConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<Message[]> {
    return this.messageService.getMessages(conversationId, userId);
  }

  @Patch(':messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a message as read by the current user' })
  @ApiResponse({ status: 200, description: 'Message marked as read.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  markAsRead(@Param('messageId') messageId: string, @CurrentUser('id') userId: string): Promise<Message> {
    return this.messageService.markMessageAsRead(messageId, userId);
  }
}
```