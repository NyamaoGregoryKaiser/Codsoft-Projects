```typescript
import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { Conversation } from '@prisma/client';
import { ConversationWithParticipantsAndMessages } from './types/conversation.types';

@ApiTags('Conversations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation (private or group)' })
  @ApiResponse({ status: 201, description: 'Conversation successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationWithParticipantsAndMessages> {
    return this.conversationService.createConversation(userId, createConversationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for the current user' })
  @ApiResponse({ status: 200, description: 'Return a list of conversations.' })
  findAll(@CurrentUser('id') userId: string): Promise<ConversationWithParticipantsAndMessages[]> {
    return this.conversationService.getUserConversations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single conversation by ID' })
  @ApiResponse({ status: 200, description: 'Return the conversation data.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  findOne(@Param('id') id: string): Promise<ConversationWithParticipantsAndMessages> {
    return this.conversationService.getConversationById(id);
  }

  @Patch(':id/add-member')
  @ApiOperation({ summary: 'Add a participant to a group conversation' })
  @ApiResponse({ status: 200, description: 'Participant successfully added.' })
  @ApiResponse({ status: 400, description: 'Bad Request or not a group chat.' })
  @ApiResponse({ status: 404, description: 'Conversation or user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  addParticipant(
    @Param('id') conversationId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser('id') currentUserId: string,
  ): Promise<Conversation> {
    return this.conversationService.addParticipant(conversationId, addMemberDto, currentUserId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/remove-member/:userId')
  @ApiOperation({ summary: 'Remove a participant from a group conversation' })
  @ApiResponse({ status: 204, description: 'Participant successfully removed.' })
  @ApiResponse({ status: 400, description: 'Bad Request or not a group chat.' })
  @ApiResponse({ status: 404, description: 'Conversation or user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  removeParticipant(
    @Param('id') conversationId: string,
    @Param('userId') userIdToRemove: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<Conversation> {
    return this.conversationService.removeParticipant(conversationId, userIdToRemove, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation (only if you are a participant)' })
  @ApiResponse({ status: 204, description: 'Conversation successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Conversation not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  deleteConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<Conversation> {
    return this.conversationService.deleteConversation(conversationId, currentUserId);
  }
}
```