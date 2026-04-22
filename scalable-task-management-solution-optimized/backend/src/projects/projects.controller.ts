import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { Project } from './entities/project.entity';
import { HttpCacheInterceptor } from '../shared/interceptors/cache.interceptor';

@ApiTags('Projects')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully.', type: Project })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @UseInterceptors(HttpCacheInterceptor) // Cache this read-heavy endpoint
  @ApiOperation({ summary: 'Retrieve all projects for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of projects.', type: [Project] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Request() req) {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  @UseInterceptors(HttpCacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a project by ID for the authenticated user' })
  @ApiResponse({ status: 200, description: 'The found project.', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found or not owned by user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiResponse({ status: 200, description: 'The updated project.', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found or not owned by user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project by ID' })
  @ApiResponse({ status: 200, description: 'Project successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Project not found or not owned by user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.projectsService.remove(id, req.user.id);
    return { message: `Project with ID ${id} successfully deleted` };
  }
}