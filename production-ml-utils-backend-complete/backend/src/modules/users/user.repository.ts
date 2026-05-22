```typescript
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AppDataSource } from '../../database';
import { AppError } from '../../utils/appError';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email }, select: ['id', 'name', 'email', 'password', 'role'] }); // Select password for auth
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.repository.create(user);
    if (newUser.password) {
      await newUser.hashPassword(); // Hash password before saving
    }
    return this.repository.save(newUser);
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.repository.findOneBy({ id });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    Object.assign(user, updates);
    if (updates.password) {
      await user.hashPassword(); // Hash new password if provided
    }
    return this.repository.save(user);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new AppError('User not found', 404);
    }
  }
}
```