import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { Task } from './entities/task.entity';
import { TaskStatus } from '../shared/enums/task-status.enum';
import { HttpCacheInterceptor } from '../shared/interceptors/cache.interceptor';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task within a project' })
  @ApiResponse({ status: 201, description: 'Task created successfully.', type: Task })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., project/assignee/tag not found, validation failed).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., project not owned by user).' })
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  @UseInterceptors(HttpCacheInterceptor) // Cache this read-heavy endpoint
  @ApiOperation({ summary: 'Retrieve all tasks for the authenticated user, optionally filtered by project or status' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter tasks by project ID' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus, description: 'Filter tasks by status' })
  @ApiResponse({ status: 200, description: 'List of tasks.', type: [Task] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., trying to filter by a project not owned).' })
  async findAll(
    @Request() req,
    @Query('projectId') projectId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.tasksService.findAll(req.user.id, projectId, status);
  }

  @Get(':id')
  @UseInterceptors(HttpCacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a task by ID for the authenticated user' })
  @ApiResponse({ status: 200, description: 'The found task.', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (task not owned by user).' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiResponse({ status: 200, description: 'The updated task.', type: Task })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed, invalid assignee/tag).' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (task not owned by user).' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiResponse({ status: 200, description: 'Task successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (task not owned by user).' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.tasksService.remove(id, req.user.id);
    return { message: `Task with ID ${id} successfully deleted` };
  }
}