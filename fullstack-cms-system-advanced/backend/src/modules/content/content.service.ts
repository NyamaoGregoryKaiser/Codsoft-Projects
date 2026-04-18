import { Repository, In } from 'typeorm';
import { Content, ContentStatus } from '../../entities/Content';
import { Category } from '../../entities/Category';
import { Tag } from '../../entities/Tag';
import { User } from '../../entities/User';
import { AppDataSource } from '../../data-source';
import { CreateContentDto, UpdateContentDto } from './content.dtos';
import { ConflictException, NotFoundException, BadRequestException } from '../../middlewares/error.middleware';
import logger from '../../config/logger';

export class ContentService {
  private contentRepository: Repository<Content>;
  private categoryRepository: Repository<Category>;
  private tagRepository: Repository<Tag>;
  private userRepository: Repository<User>;

  constructor() {
    this.contentRepository = AppDataSource.getRepository(Content);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.tagRepository = AppDataSource.getRepository(Tag);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllContent(includeDrafts = false): Promise<Content[]> {
    const queryOptions: any = {
      relations: ['author', 'category', 'tags'],
      order: { createdAt: 'DESC' },
    };

    if (!includeDrafts) {
      queryOptions.where = { status: ContentStatus.PUBLISHED };
    }

    return this.contentRepository.find(queryOptions);
  }

  async getContentById(id: string, includeDraft = false): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id, ...(includeDraft ? {} : { status: ContentStatus.PUBLISHED }) },
      relations: ['author', 'category', 'tags'],
    });
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  async getContentBySlug(slug: string, includeDraft = false): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { slug, ...(includeDraft ? {} : { status: ContentStatus.PUBLISHED }) },
      relations: ['author', 'category', 'tags'],
    });
    if (!content) {
      throw new NotFoundException(`Content with slug '${slug}' not found`);
    }
    return content;
  }

  private generateSlug(title: string): string {
    return title.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  async createContent(createContentDto: CreateContentDto, authorId: string): Promise<Content> {
    const slug = createContentDto.slug || this.generateSlug(createContentDto.title);

    const existingContent = await this.contentRepository.findOneBy({ slug });
    if (existingContent) {
      throw new ConflictException(`Content with slug '${slug}' already exists`);
    }

    const author = await this.userRepository.findOneBy({ id: authorId });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    let category: Category | undefined;
    if (createContentDto.categoryId) {
      category = await this.categoryRepository.findOneBy({ id: createContentDto.categoryId });
      if (!category) {
        throw new BadRequestException(`Category with ID ${createContentDto.categoryId} not found`);
      }
    }

    let tags: Tag[] = [];
    if (createContentDto.tagIds && createContentDto.tagIds.length > 0) {
      tags = await this.tagRepository.findBy({ id: In(createContentDto.tagIds) });
      if (tags.length !== createContentDto.tagIds.length) {
        const foundIds = tags.map(tag => tag.id);
        const missingIds = createContentDto.tagIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Tags with IDs ${missingIds.join(', ')} not found`);
      }
    }

    const newContent = this.contentRepository.create({
      ...createContentDto,
      slug,
      author,
      category,
      tags,
      publishedAt: createContentDto.status === ContentStatus.PUBLISHED ? new Date() : undefined,
    });

    return this.contentRepository.save(newContent);
  }

  async updateContent(id: string, updateContentDto: UpdateContentDto): Promise<Content> {
    const content = await this.contentRepository.findOne({ where: { id }, relations: ['author', 'category', 'tags'] });
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    if (updateContentDto.title && updateContentDto.title !== content.title) {
      content.title = updateContentDto.title;
    }

    if (updateContentDto.slug && updateContentDto.slug !== content.slug) {
      const existingContent = await this.contentRepository.findOneBy({ slug: updateContentDto.slug });
      if (existingContent && existingContent.id !== id) {
        throw new ConflictException(`Content with slug '${updateContentDto.slug}' already exists`);
      }
      content.slug = updateContentDto.slug;
    } else if (updateContentDto.title && !updateContentDto.slug) {
      content.slug = this.generateSlug(updateContentDto.title);
    }

    if (updateContentDto.body) content.body = updateContentDto.body;

    if (updateContentDto.status && updateContentDto.status !== content.status) {
      content.status = updateContentDto.status;
      if (content.status === ContentStatus.PUBLISHED && !content.publishedAt) {
        content.publishedAt = new Date();
      } else if (content.status !== ContentStatus.PUBLISHED) {
        content.publishedAt = undefined; // Clear published date if no longer published
      }
    }

    if (updateContentDto.categoryId !== undefined) {
      if (updateContentDto.categoryId === null) {
        content.category = undefined; // Set category to null
      } else {
        const category = await this.categoryRepository.findOneBy({ id: updateContentDto.categoryId });
        if (!category) {
          throw new BadRequestException(`Category with ID ${updateContentDto.categoryId} not found`);
        }
        content.category = category;
      }
    }

    if (updateContentDto.tagIds !== undefined) {
      if (updateContentDto.tagIds.length === 0) {
        content.tags = []; // Clear all tags
      } else {
        const tags = await this.tagRepository.findBy({ id: In(updateContentDto.tagIds) });
        if (tags.length !== updateContentDto.tagIds.length) {
          const foundIds = tags.map(tag => tag.id);
          const missingIds = updateContentDto.tagIds.filter(id => !foundIds.includes(id));
          throw new BadRequestException(`Tags with IDs ${missingIds.join(', ')} not found`);
        }
        content.tags = tags;
      }
    }

    return this.contentRepository.save(content);
  }

  async deleteContent(id: string): Promise<void> {
    const content = await this.getContentById(id, true); // Allow deleting drafts too
    await this.contentRepository.remove(content);
    logger.info(`Content with ID ${id} deleted successfully.`);
  }
}