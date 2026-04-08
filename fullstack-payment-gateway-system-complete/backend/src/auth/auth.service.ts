import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../database/entities/user.entity';
import { MerchantsService } from '../merchants/merchants.service';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private merchantsService: MerchantsService,
    private jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await argon2.verify(user.passwordHash, pass))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result as User;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`Attempting login for user: ${loginDto.email}`, AuthService.name);
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Failed login attempt for user: ${loginDto.email}`, AuthService.name);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      merchantId: user.merchantId,
    };
    this.logger.log(`User ${user.id} logged in successfully`, AuthService.name);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    this.logger.debug(`Attempting registration for user: ${registerDto.email}`, AuthService.name);

    if (registerDto.merchantId) {
      const merchantExists = await this.merchantsService.findOne(registerDto.merchantId);
      if (!merchantExists) {
        throw new UnauthorizedException('Merchant not found');
      }
    }

    const hashedPassword = await argon2.hash(registerDto.password);
    const user = await this.usersService.create({
      ...registerDto,
      passwordHash: hashedPassword,
    });
    this.logger.log(`User ${user.id} registered successfully`, AuthService.name);

    // After registration, log them in or just return success
    return this.login({ email: user.email, password: registerDto.password });
  }
}