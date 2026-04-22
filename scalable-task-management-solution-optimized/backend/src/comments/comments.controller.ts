import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { Comment } from './entities/comment.entity';

@ApiTags('Comments')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new comment to a task' })
  @ApiResponse({ status: 201, description: 'Comment created successfully.', type: Comment })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., task not found or not accessible).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(createCommentDto, req.user.id);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Retrieve all comments for a specific task' })
  @ApiResponse({ status: 200, description: 'List of comments for the task.', type: [Comment] })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., task not found or not accessible).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findCommentsByTask(@Param('taskId') taskId: string, @Request() req) {
    return this.commentsService.findCommentsByTask(taskId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single comment by ID' })
  @ApiResponse({ status: 200, description: 'The found comment.', type: Comment })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (comment not accessible).' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.commentsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment by ID' })
  @ApiResponse({ status: 200, description: 'The updated comment.', type: Comment })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (user is not the author).' })
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto, @Request() req) {
    return this.commentsService.update(id, updateCommentDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (user is not the author or project owner).' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.commentsService.remove(id, req.user.id);
    return { message: `Comment with ID ${id} successfully deleted` };
  }
}