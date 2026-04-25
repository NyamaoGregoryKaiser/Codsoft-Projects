```typescript
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../middlewares/errorHandler';
import { RegisterDto } from '../utils/validationSchemas';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async registerUser(userData: RegisterDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userRepository.findOneBy({ email: userData.email });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const newUser = this.userRepository.create(userData);
    await this.userRepository.save(newUser);

    // Return user without password
    const { password, ...result } = newUser;
    return result;
  }

  async loginUser(email: string, passwordPlain: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(passwordPlain);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Return user without password
    const { password, ...result } = user;
    return result;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['projects', 'tasks'], // Load related projects and tasks
      select: ['id', 'username', 'email'], // Explicitly select columns to omit password
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    return user;
  }
}
```