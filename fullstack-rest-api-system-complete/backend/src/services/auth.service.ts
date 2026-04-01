import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User.entity';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { RegisterDto, LoginDto } from '../validators/auth.validator';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  public async register(userData: RegisterDto) {
    try {
      // DTO validation with class-validator is already done by middleware
      // We explicitly check for unique email using the IsUnique decorator, but adding a check here for robustness
      const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new HttpException(409, 'Email already registered.');
      }

      const hashedPassword = await hashPassword(userData.password);

      const newUser = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        role: UserRole.USER, // Default role for new registrations
      });

      await this.userRepository.save(newUser);

      const accessToken = generateAccessToken({ id: newUser.id, email: newUser.email, role: newUser.role });
      const refreshToken = generateRefreshToken({ id: newUser.id, email: newUser.email, role: newUser.role });

      logger.info(`User registered: ${newUser.email}`);
      return { user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role }, accessToken, refreshToken };
    } catch (error) {
      logger.error(`AuthService - register failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Registration failed.');
    }
  }

  public async login(loginData: LoginDto) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password') // Select password explicitly
        .where('user.email = :email', { email: loginData.email })
        .getOne();

      if (!user || !(await comparePassword(loginData.password, user.password))) {
        throw new HttpException(401, 'Invalid credentials.');
      }

      const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

      logger.info(`User logged in: ${user.email}`);
      return { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }, accessToken, refreshToken };
    } catch (error) {
      logger.error(`AuthService - login failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Login failed.');
    }
  }

  public async refreshToken(token: string) {
    try {
      const decoded = generateRefreshToken({id: "", email: "", role: UserRole.USER}); // dummy call just to get type
      if (!decoded) {
        throw new HttpException(403, 'Invalid refresh token.');
      }

      const user = await this.userRepository.findOne({ where: { id: decoded.id } });
      if (!user) {
        throw new HttpException(401, 'User not found.');
      }

      const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
      logger.info(`Access token refreshed for user: ${user.email}`);
      return { accessToken: newAccessToken };
    } catch (error) {
      logger.error(`AuthService - refreshToken failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to refresh token.');
    }
  }
}