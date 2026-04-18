import { Repository } from 'typeorm';
import { Tag } from '../../entities/Tag';
import { AppDataSource } from '../../data-source';
import { CreateTagDto, UpdateTagDto } from './tag.dtos';
import { ConflictException, NotFoundException } from '../../middlewares/error.middleware';
import logger from '../../config/logger';

export class TagService {
  private tagRepository: Repository<Tag>;

  constructor() {
    this.tagRepository = AppDataSource.getRepository(Tag);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.tagRepository.find();
  }

  async getTagById(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOneBy({ id });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    return this.tagRepository.findOneBy({ slug });
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  async createTag(createTagDto: CreateTagDto): Promise<Tag> {
    const slug = createTagDto.slug || this.generateSlug(createTagDto.name);

    let existingTag = await this.getTagBySlug(slug);
    if (existingTag) {
      throw new ConflictException(`Tag with slug '${slug}' already exists`);
    }

    if (createTagDto.name) {
      existingTag = await this.tagRepository.findOneBy({ name: createTagDto.name });
      if (existingTag) {
        throw new ConflictException(`Tag with name '${createTagDto.name}' already exists`);
      }
    }

    const newTag = this.tagRepository.create({
      ...createTagDto,
      slug,
    });
    return this.tagRepository.save(newTag);
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.getTagById(id);

    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existingTag = await this.tagRepository.findOneBy({ name: updateTagDto.name });
      if (existingTag && existingTag.id !== id) {
        throw new ConflictException(`Tag with name '${updateTagDto.name}' already exists`);
      }
      tag.name = updateTagDto.name;
    }

    if (updateTagDto.slug && updateTagDto.slug !== tag.slug) {
      const existingTag = await this.getTagBySlug(updateTagDto.slug);
      if (existingTag && existingTag.id !== id) {
        throw new ConflictException(`Tag with slug '${updateTagDto.slug}' already exists`);
      }
      tag.slug = updateTagDto.slug;
    } else if (updateTagDto.name && !updateTagDto.slug) {
      tag.slug = this.generateSlug(updateTagDto.name);
    }

    Object.assign(tag, updateTagDto);
    return this.tagRepository.save(tag);
  }

  async deleteTag(id: string): Promise<void> {
    const tag = await this.getTagById(id);
    await this.tagRepository.remove(tag);
    logger.info(`Tag with ID ${id} deleted successfully.`);
  }
}