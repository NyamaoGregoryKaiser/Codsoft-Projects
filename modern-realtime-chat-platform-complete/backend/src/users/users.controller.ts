import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './user.entity';

@ApiBearerAuth('access-token')
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Note: Registration handled by AuthController, CreateUserDto is for internal use or admin
  // @Post()
  // @ApiOperation({ summary: 'Create a new user (admin only perhaps)' })
  // @ApiCreatedResponse({ description: 'The user has been successfully created.', type: UserResponseDto })
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.usersService.create(createUserDto);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'List of all users.', type: [UserResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized if JWT is missing or invalid.' })
  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersService.findAll();
    return users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ description: 'The user with the given ID.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized if JWT is missing or invalid.' })
  async findOne(@Param('id') id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiOkResponse({ description: 'The updated user.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized if JWT is missing or invalid.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.update(id, updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiOkResponse({ description: 'User successfully deleted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized if JWT is missing or invalid.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}