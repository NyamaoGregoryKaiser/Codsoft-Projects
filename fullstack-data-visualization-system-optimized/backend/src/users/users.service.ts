```typescript
// backend/src/users/users.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists.');
    }
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existingUserByUsername) {
      throw new ConflictException('User with this username already exists.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: { id: true, email: true, username: true, role: true, createdAt: true }, // Avoid returning password
    });
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userExists = await this.prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Check for email/username conflict if they are being updated
    if (updateUserDto.email && updateUserDto.email !== userExists.email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: updateUserDto.email } });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists.');
      }
    }
    if (updateUserDto.username && updateUserDto.username !== userExists.username) {
      const existingUser = await this.prisma.user.findUnique({ where: { username: updateUserDto.username } });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this username already exists.');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: { id: true, email: true, username: true, role: true, updatedAt: true },
    });
    return updatedUser;
  }

  async remove(id: string) {
    const userExists = await this.prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User successfully deleted.' };
  }
}
```