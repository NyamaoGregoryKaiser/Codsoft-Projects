```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto'; // Used for internal admin-driven creation, not exposed via /auth/register
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { User } from './entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { LoggerService } from '../common/logger/logger.service';

@ApiTags('Users')
@ApiBearerAuth('accessToken') // Specify that this controller requires Bearer token authentication
@Controller('users')
@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to all routes in this controller
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: LoggerService,
  ) {}

  // This endpoint would typically be for admin to create users,
  // regular users register via auth/register
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully created.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with email already exists.' })
  @Roles(UserRole.Admin) // Only Admin can create users directly
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Admin creating new user: ${createUserDto.email}`, UsersController.name);
    return this.usersService.create(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all users.' })
  @Roles(UserRole.Admin) // Only Admin can view all users
  @UseInterceptors(CacheInterceptor)
  @CacheKey('all_users')
  @CacheTTL(60) // Cache for 60 seconds
  async findAll() {
    this.logger.log('Fetching all users', UsersController.name);
    return this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by ID (Admin or self)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User details.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    // A user can view their own profile, or an admin can view any profile
    if (req.user.id !== id && !req.user.roles.includes(UserRole.Admin)) {
      this.logger.warn(`Unauthorized attempt to view user ${id} by user ${req.user.id}`, UsersController.name);
      // Explicitly checking for forbidden access, even if underlying service would return not found
      // This is a subtle authorization check: the user is authenticated, but not authorized for *this* resource.
      throw new HttpStatus(HttpStatus.FORBIDDEN, 'You do not have permission to view this user.');
    }
    this.logger.log(`Fetching user ${id}`, UsersController.name);
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user by ID (Admin or self)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    // A user can update their own profile, or an admin can update any profile
    if (req.user.id !== id && !req.user.roles.includes(UserRole.Admin)) {
      this.logger.warn(`Unauthorized attempt to update user ${id} by user ${req.user.id}`, UsersController.name);
      throw new HttpStatus(HttpStatus.FORBIDDEN, 'You do not have permission to update this user.');
    }

    // Prevent non-admins from changing roles
    if (updateUserDto.roles && !req.user.roles.includes(UserRole.Admin)) {
      this.logger.warn(`User ${req.user.id} attempted to change roles for ${id}`, UsersController.name);
      throw new HttpStatus(HttpStatus.FORBIDDEN, 'You do not have permission to change user roles.');
    }

    this.logger.log(`Updating user ${id}`, UsersController.name);
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @Roles(UserRole.Admin) // Only Admin can delete users
  async remove(@Param('id') id: string) {
    this.logger.log(`Admin deleting user ${id}`, UsersController.name);
    await this.usersService.remove(id);
    return;
  }
}
```