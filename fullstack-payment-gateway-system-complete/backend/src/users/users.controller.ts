import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { Request } from 'express';
import { PaginatedResponseDto } from '../common/dto/base-response.dto';
import { User } from '../database/entities/user.entity';

class UserPaginatedResponseDto extends PaginatedResponseDto<User> {}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER) // Merchant users can create users within their merchant
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.', type: User })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 403, description: 'Forbidden (not authorized).' })
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    if (req.user['role'] === UserRole.MERCHANT_USER && createUserDto.merchantId !== req.user['merchantId']) {
        // Merchant user can only create users for their own merchant
        throw new ForbiddenException('Merchant users can only create users for their own merchant.');
    }
    if (req.user['role'] === UserRole.MERCHANT_USER && !createUserDto.merchantId) {
        // Automatically assign merchantId if not provided by a merchant user
        createUserDto.merchantId = req.user['merchantId'];
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Retrieve all users or users by merchant' })
  @ApiQuery({ name: 'merchantId', required: false, description: 'Filter users by merchant ID (Admin only or auto-filtered for Merchant user)' })
  @ApiResponse({ status: 200, description: 'List of users.', type: [User] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll(@Req() req: Request, @Query('merchantId') merchantId?: string) {
    const userRole = req.user['role'];
    const userMerchantId = req.user['merchantId'];

    if (userRole === UserRole.MERCHANT_USER) {
      // Merchant users can only see users from their own merchant
      return this.usersService.findAll(userMerchantId);
    } else if (userRole === UserRole.ADMIN) {
      // Admins can filter by merchantId or see all users
      return this.usersService.findAll(merchantId);
    }
    return []; // Should not happen due to roles guard
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiResponse({ status: 200, description: 'The found user.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (req.user['role'] === UserRole.MERCHANT_USER && user.merchantId !== req.user['merchantId']) {
      throw new ForbiddenException('Access denied to user of another merchant.');
    }
    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.findById(id);
    if (req.user['role'] === UserRole.MERCHANT_USER && user.merchantId !== req.user['merchantId']) {
      throw new ForbiddenException('Access denied to update user of another merchant.');
    }
    // Merchant users cannot change roles or merchantId of users
    if (req.user['role'] === UserRole.MERCHANT_USER) {
        if (updateUserDto.role && updateUserDto.role !== user.role) {
            throw new ForbiddenException('Merchant users cannot change user roles.');
        }
        if (updateUserDto.merchantId && updateUserDto.merchantId !== user.merchantId) {
            throw new ForbiddenException('Merchant users cannot change a user\'s merchant.');
        }
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MERCHANT_USER)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (req.user['role'] === UserRole.MERCHANT_USER && user.merchantId !== req.user['merchantId']) {
      throw new ForbiddenException('Access denied to delete user of another merchant.');
    }
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}