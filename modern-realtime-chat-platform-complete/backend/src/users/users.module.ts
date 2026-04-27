import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { WinstonLoggerModule } from '../common/logger/winston-logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), WinstonLoggerModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export UsersService so other modules (e.g., AuthModule) can use it
})
export class UsersModule {}