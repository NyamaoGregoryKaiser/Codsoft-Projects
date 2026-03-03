import { AppDataSource } from '../../database';
import { User } from '../../database/entities/User';
import { RegisterUserDto } from './dtos/RegisterUser.dto';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { generateToken } from '../../shared/utils/jwt';
import { UnauthorizedError, ConflictError } from '../../shared/errors';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(registerData: RegisterUserDto) {
    const { email, password, firstName, lastName } = registerData;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    await this.userRepository.save(user);

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id, user.role);

    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // Explicitly select password
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id, user.role);

    return { user: userWithoutPassword, token };
  }
}