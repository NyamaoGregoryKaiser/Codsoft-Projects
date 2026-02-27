```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ProjectOwnerGuard } from './guards/project-owner.guard';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { LoggerService } from '../common/logger/logger.service';

@ApiTags('Projects')
@ApiBearerAuth('accessToken')
@Controller('projects')
@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to all routes in this controller
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Project successfully created.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input.' })
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req: { user: User }) {
    this.logger.log(`User ${req.user.id} creating project: ${createProjectDto.title}`, ProjectsController.name);
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all projects (Admin) or user-specific projects (User)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of projects.' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // Cache for 60 seconds
  async findAll(@Req() req: { user: User }) {
    if (req.user.roles.includes(UserRole.Admin)) {
      this.logger.log(`Admin fetching all projects`, ProjectsController.name);
      return this.projectsService.findAll(); // Admin gets all projects
    } else {
      this.logger.log(`User ${req.user.id} fetching their projects`, ProjectsController.name);
      // Cache key dynamically based on user ID for user-specific caching
      return this.projectsService.findAll(req.user.id); // Regular user gets only their projects
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a project by ID (Owner or Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project details.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @UseGuards(ProjectOwnerGuard) // Ensure user is owner or admin
  @UseInterceptors(CacheInterceptor)
  @CacheKey('project_by_id') // Cache key for individual project
  @CacheTTL(300) // Cache for 5 minutes
  async findOne(@Param('id') id: string) {
    this.logger.log(`Fetching project ${id}`, ProjectsController.name);
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a project by ID (Owner or Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @UseGuards(ProjectOwnerGuard) // Ensure user is owner or admin
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: { user: User }) {
    this.logger.log(`User ${req.user.id} updating project ${id}`, ProjectsController.name);
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project by ID (Owner or Admin)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Project successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  @UseGuards(ProjectOwnerGuard) // Ensure user is owner or admin
  async remove(@Param('id') id: string, @Req() req: { user: User }) {
    this.logger.log(`User ${req.user.id} deleting project ${id}`, ProjectsController.name);
    await this.projectsService.remove(id);
    return;
  }
}
```