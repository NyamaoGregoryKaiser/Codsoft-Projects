import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Role } from '../shared/enums/roles.enum';
import { User } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes in this controller
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.Admin) // Only admins can create users via this endpoint (registration is public)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.', type: User })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { password, ...result } = user; // Exclude password from response
    return result;
  }

  @Get()
  @Roles(Role.Admin) // Only admins can view all users
  @ApiOperation({ summary: 'Retrieve all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users.', type: [User] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(({ password, ...user }) => user); // Exclude passwords
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile.', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      return { message: 'User not found' }; // Should not happen if authenticated
    }
    const { password, ...result } = user;
    return result;
  }

  @Get(':id')
  @Roles(Role.Admin) // Admins can view any user, regular users can view their own (handled by profile route or additional logic)
  @ApiOperation({ summary: 'Retrieve a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'The found user.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { message: 'User not found' };
    }
    const { password, ...result } = user;
    return result;
  }

  @Patch(':id')
  @Roles(Role.Admin) // Admins can update any user, regular users can update their own profile (add a separate endpoint for this)
  @ApiOperation({ summary: 'Update a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'The updated user.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    const { password, ...result } = user;
    return result;
  }

  @Delete(':id')
  @Roles(Role.Admin) // Only admins can delete users
  @ApiOperation({ summary: 'Delete a user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: `User with ID ${id} successfully deleted` };
  }
}