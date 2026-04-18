import { Repository } from 'typeorm';
import { User } from '../../entities/User';
import { AppDataSource } from '../../data-source';
import { LoginUserDto } from './auth.dtos';
import { UnauthorizedException } from '../../middlewares/error.middleware';
import { comparePassword, generateToken, generateRefreshToken } from '../../utils/auth';
import logger from '../../config/logger';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async login(loginUserDto: LoginUserDto): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
    const user = await this.userRepository.findOne({
      where: { email: loginUserDto.email },
      relations: ['role'],
    });

    if (!user || !(await comparePassword(loginUserDto.password, user.password))) {
      logger.warn(`Failed login attempt for email: ${loginUserDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user.id, role: user.role.name };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Remove password before sending user data
    const { password, ...userWithoutPassword } = user;

    logger.info(`User ${user.email} logged in successfully.`);
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  // A simple method to handle token refresh (could be more complex with token storage)
  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = generateRefreshToken(token); // Verify it's a refresh token
      const user = await this.userRepository.findOne({
        where: { id: payload.id },
        relations: ['role'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found for refresh token');
      }

      const newAccessToken = generateToken({ id: user.id, role: user.role.name });
      logger.info(`Access token refreshed for user ${user.email}.`);
      return { accessToken: newAccessToken };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}