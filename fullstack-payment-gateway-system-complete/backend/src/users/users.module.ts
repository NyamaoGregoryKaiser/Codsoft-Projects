import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { UsersController } from './users.controller';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MerchantsModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}