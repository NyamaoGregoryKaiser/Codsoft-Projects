import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AppLoggerModule } from '../shared/logger/app-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AppLoggerModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Export UsersService for AuthModule to use
})
export class UsersModule {}