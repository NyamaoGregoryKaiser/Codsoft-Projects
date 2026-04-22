import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Role } from '../shared/enums/roles.enum';
import { Tag } from './entities/tag.entity';
import { HttpCacheInterceptor } from '../shared/interceptors/cache.interceptor';

@ApiTags('Tags')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Roles(Role.Admin) // Only admins can create tags
  @ApiOperation({ summary: 'Create a new tag (Admin only)' })
  @ApiResponse({ status: 201, description: 'Tag created successfully.', type: Tag })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed).' })
  @ApiResponse({ status: 409, description: 'Conflict (tag name already exists).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @UseInterceptors(HttpCacheInterceptor)
  @ApiOperation({ summary: 'Retrieve all tags (Admin only, or public for common tags)' })
  @ApiResponse({ status: 200, description: 'List of tags.', type: [Tag] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @UseInterceptors(HttpCacheInterceptor)
  @ApiOperation({ summary: 'Retrieve a tag by ID' })
  @ApiResponse({ status: 200, description: 'The found tag.', type: Tag })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin) // Only admins can update tags
  @ApiOperation({ summary: 'Update a tag by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'The updated tag.', type: Tag })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  @ApiResponse({ status: 409, description: 'Conflict (tag name already exists).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @Roles(Role.Admin) // Only admins can delete tags
  @ApiOperation({ summary: 'Delete a tag by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tag successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Param('id') id: string) {
    await this.tagsService.remove(id);
    return { message: `Tag with ID ${id} successfully deleted` };
  }
}