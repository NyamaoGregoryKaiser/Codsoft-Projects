import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { AppLogger } from '../shared/logger/app-logger.service';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(TagsService.name);
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;
    const existingTag = await this.tagsRepository.findOne({ where: { name: name.toLowerCase() } });
    if (existingTag) {
      throw new ConflictException(`Tag with name "${name}" already exists.`);
    }

    const tag = this.tagsRepository.create({ ...createTagDto, name: name.toLowerCase() });
    this.logger.log(`Tag "${name}" created.`, 'create');
    return this.tagsRepository.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.tagsRepository.find();
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagsRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found.`);
    }
    return tag;
  }

  async findManyByIds(ids: string[]): Promise<Tag[]> {
    return this.tagsRepository.findBy({ id: In(ids) });
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagsRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found.`);
    }

    if (updateTagDto.name && updateTagDto.name.toLowerCase() !== tag.name) {
      const existingTag = await this.tagsRepository.findOne({ where: { name: updateTagDto.name.toLowerCase() } });
      if (existingTag && existingTag.id !== id) {
        throw new ConflictException(`Tag with name "${updateTagDto.name}" already exists.`);
      }
    }

    Object.assign(tag, { ...updateTagDto, name: updateTagDto.name ? updateTagDto.name.toLowerCase() : tag.name });
    this.logger.log(`Tag ${id} updated.`, 'update');
    return this.tagsRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tagsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Tag with ID ${id} not found.`);
    }
    this.logger.log(`Tag ${id} removed.`, 'remove');
  }
}