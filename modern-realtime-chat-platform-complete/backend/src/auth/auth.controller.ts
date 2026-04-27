import { Body, Controller, Post, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard'; // Assuming you have a local auth guard
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../users/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiOkResponse({ description: 'User successfully registered.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Username already exists.' })
  async register(@Body() registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard) // This guard uses the LocalStrategy to validate user credentials
  @Post('login')
  @ApiOperation({ summary: 'Log in a user and get a JWT token' })
  @ApiBody({ type: LoginDto, description: 'User credentials' })
  @ApiOkResponse({ description: 'User successfully logged in.', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(@Request() req): Promise<{ access_token: string }> {
    // The user object is attached to the request by LocalAuthGuard
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access-token') // Reference the security definition from main.ts
  @ApiOperation({ summary: 'Get the profile of the currently authenticated user' })
  @ApiOkResponse({ description: 'User profile data.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token.' })
  getProfile(@Request() req): Omit<User, 'password'> {
    // The user object (from JWT payload) is attached to the request by JwtAuthGuard
    // In a real app, you might fetch the full user from DB here to ensure fresh data
    const { password, ...result } = req.user;
    return result;
  }
}