import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto, RegisterUserDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AppLogger } from '../shared/logger/app-logger.service';
import { Role } from '../shared/enums/roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password'>> {
    const { username, email, password } = registerUserDto;

    // Check if user already exists
    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUserByUsername = await this.usersService.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await this.usersService.create({
      username,
      email,
      password: hashedPassword,
      roles: [Role.User], // Default role for new users
    });

    this.logger.log(`User registered: ${newUser.email}`, 'Registration');
    const { password: _, ...result } = newUser; // Omit password from response
    return result;
  }

  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, password } = loginUserDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      this.logger.warn(`Failed login attempt for email: ${email}`, 'Login');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { username: user.username, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User logged in: ${user.email}`, 'Login');
    return { accessToken };
  }

  // Method to validate JWT payload
  async validateUser(payload: any): Promise<User | null> {
    const user = await this.usersService.findById(payload.sub);
    if (user) {
      return user;
    }
    return null;
  }
}