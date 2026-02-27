```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, Query, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ProjectOwnerGuard } from '../projects/guards/project-owner.guard'; // Re-use project ownership check for task creation/viewing within a project
import { TaskOwnerOrAssigneeGuard } from './guards/task-owner-or-assignee.guard';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { LoggerService } from '../common/logger/logger.service';

@ApiTags('Tasks')
@ApiBearerAuth('accessToken')
@Controller('tasks')
@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to all routes in this controller
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task for a project (Project owner or Admin)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Task successfully created.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project or Assignee not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @UseGuards(ProjectOwnerGuard) // Ensure the user owns the project or is an Admin
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: { user: User }) {
    this.logger.log(`User ${req.user.id} creating task for project ${createTaskDto.projectId}: ${createTaskDto.title}`, TasksController.name);
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all tasks (Admin) or tasks for a specific project (Owner/Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of tasks.' })
  @ApiQuery({ name: 'projectId', required: false, type: String, description: 'Optional project ID to filter tasks.' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  async findAll(@Req() req: { user: User }, @Query('projectId') projectId?: string) {
    if (projectId) {
      // If projectId is provided, ensure user has access to that project
      // For simplicity, we'll let the service handle project not found or access for admin
      // A more robust solution might involve a separate guard like ProjectOwnerGuard here if we want to return 403 explicitly for unauthorized project access
      // For now, if the user isn't admin and doesn't own the project, ProjectOwnerGuard will block.
      // If we are here, it means the check passed for specific project-level operations.
      // But for a generic /tasks?projectId=X, we need to apply logic.
      if (!req.user.roles.includes(UserRole.Admin)) {
        // A non-admin user can only view tasks of projects they own
        const project = await this.tasksService['projectsService'].findOne(projectId); // Access projectsService from tasksService
        if (project.owner.id !== req.user.id) {
          throw new HttpStatus(HttpStatus.FORBIDDEN, 'You do not have permission to view tasks for this project.');
        }
      }
      this.logger.log(`User ${req.user.id} fetching tasks for project ${projectId}`, TasksController.name);
      return this.tasksService.findAll(projectId);
    } else if (req.user.roles.includes(UserRole.Admin)) {
      this.logger.log(`Admin fetching all tasks`, TasksController.name);
      return this.tasksService.findAll(); // Admin gets all tasks across all projects
    } else {
      this.logger.warn(`User ${req.user.id} attempted to fetch all tasks without project filter and is not an Admin.`, TasksController.name);
      throw new HttpStatus(HttpStatus.FORBIDDEN, 'Regular users must specify a projectId to view tasks.');
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a task by ID (Task owner/assignee or Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task details.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @UseGuards(TaskOwnerOrAssigneeGuard) // Ensure user is owner, assignee, or admin
  @UseInterceptors(CacheInterceptor)
  @CacheKey('task_by_id')
  @CacheTTL(300)
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching task ${id}`, TasksController.name);
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a task by ID (Task owner/assignee or Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Task successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @UseGuards(TaskOwnerOrAssigneeGuard) // Ensure user is owner, assignee, or admin
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: { user: User }) {
    this.logger.log(`User ${req.user.id} updating task ${id}`, TasksController.name);
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task by ID (Task owner or Admin)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Task successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Task not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  // For deletion, we might want stricter rules: only project owner or admin can delete
  // Assignee can update, but maybe not delete. Reusing TaskOwnerOrAssigneeGuard with modifications
  // or a separate guard for deletion is an option. For now, assuming ProjectOwnerGuard or Admin.
  @UseGuards(TaskOwnerOrAssigneeGuard) // This guard is configured to check if user is project owner or admin for deletion
  async remove(@Param('id') id: string, @Req() req: { user: User }) {
    this.logger.log(`User ${req.user.id} deleting task ${id}`, TasksController.name);
    await this.tasksService.remove(id);
    return;
  }
}
```