import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { Tag } from './entities/tag.entity';
import { AppLoggerModule } from '../shared/logger/app-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag]),
    AppLoggerModule,
  ],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TagsService], // Export TagsService for TasksModule to use
})
export class TagsModule {}