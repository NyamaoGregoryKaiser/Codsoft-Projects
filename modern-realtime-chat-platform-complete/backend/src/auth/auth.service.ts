import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { WinstonLogger } from '../common/logger/winston.logger';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly logger: WinstonLogger,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Validates user credentials.
   * @param username The user's username.
   * @param pass The user's password.
   * @returns The user object if valid, otherwise null.
   */
  async validateUser(username: string, pass: string): Promise<User | null> {
    this.logger.log(`Attempting to validate user: ${username}`);
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from the result
      this.logger.log(`User ${username} validated successfully.`);
      return result as User;
    }
    this.logger.warn(`Failed validation for user: ${username}`);
    return null;
  }

  /**
   * Generates a JWT token for a user.
   * @param user The user object to generate the token for.
   * @returns An object containing the access token.
   */
  async login(user: User) {
    this.logger.log(`Generating JWT for user: ${user.username}`);
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Registers a new user.
   * @param registerDto The DTO containing registration details.
   * @returns The newly created user (excluding password).
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    this.logger.log(`Attempting to register new user: ${registerDto.username}`);
    const existingUser = await this.usersService.findByUsername(registerDto.username);
    if (existingUser) {
      this.logger.warn(`Registration failed: Username ${registerDto.username} already exists.`);
      throw new UnauthorizedException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });
    this.logger.log(`User ${newUser.username} registered successfully with ID: ${newUser.id}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;
    return result;
  }
}