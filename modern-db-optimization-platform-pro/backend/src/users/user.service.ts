```typescript
import { AppDataSource } from '../data-source';
import { User } from './user.entity';
import bcrypt from 'bcrypt';
import { HttpError } from '../shared/http-error';
import { UserRole } from '../shared/enums';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async createUser(username: string, passwordPlain: string, role: UserRole): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({ username });
    if (existingUser) {
      throw new HttpError('User with this username already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const newUser = this.userRepository.create({ username, password: hashedPassword, role });
    await this.userRepository.save(newUser);
    return newUser;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username }, select: ['id', 'username', 'password', 'role'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, select: ['id', 'username', 'role'] });
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.find({ select: ['id', 'username', 'role', 'createdAt'] });
  }
}

export const userService = new UserService();
```