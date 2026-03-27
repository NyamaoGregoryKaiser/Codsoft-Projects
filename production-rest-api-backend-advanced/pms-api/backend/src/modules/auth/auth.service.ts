import { AppDataSource } from '../../db/data-source';
import { User, UserRole } from '../users/user.entity';
import { RegisterUserDto, LoginUserDto, AuthResponseDto } from './auth.dtos';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { ApiError } from '../../utils/apiError';
import logger from '../../config/logger';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(registerDto: RegisterUserDto): Promise<AuthResponseDto> {
    const { username, email, password, role } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) throw new ApiError(409, 'User with this email already exists.');
      if (existingUser.username === username) throw new ApiError(409, 'User with this username already exists.');
    }

    const hashedPassword = await hashPassword(password);

    const newUser = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: role || UserRole.MEMBER, // Default to member role
    });

    await this.userRepository.save(newUser);
    logger.info(`User registered: ${newUser.email}`);

    const accessToken = generateToken(newUser.id, newUser.role);

    return {
      accessToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async login(loginDto: LoginUserDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // Select password specifically as it's hidden by default
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials.');
    }

    const accessToken = generateToken(user.id, user.role);
    logger.info(`User logged in: ${user.email}`);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}