import { Repository } from 'typeorm';
import { Category } from '../../entities/Category';
import { AppDataSource } from '../../data-source';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dtos';
import { ConflictException, NotFoundException } from '../../middlewares/error.middleware';
import logger from '../../config/logger';

export class CategoryService {
  private categoryRepository: Repository<Category>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return this.categoryRepository.findOneBy({ slug });
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug = createCategoryDto.slug || this.generateSlug(createCategoryDto.name);

    let existingCategory = await this.getCategoryBySlug(slug);
    if (existingCategory) {
      throw new ConflictException(`Category with slug '${slug}' already exists`);
    }

    if (createCategoryDto.name) {
      existingCategory = await this.categoryRepository.findOneBy({ name: createCategoryDto.name });
      if (existingCategory) {
        throw new ConflictException(`Category with name '${createCategoryDto.name}' already exists`);
      }
    }

    const newCategory = this.categoryRepository.create({
      ...createCategoryDto,
      slug,
    });
    return this.categoryRepository.save(newCategory);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.getCategoryById(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOneBy({ name: updateCategoryDto.name });
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(`Category with name '${updateCategoryDto.name}' already exists`);
      }
      category.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.getCategoryBySlug(updateCategoryDto.slug);
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(`Category with slug '${updateCategoryDto.slug}' already exists`);
      }
      category.slug = updateCategoryDto.slug;
    } else if (updateCategoryDto.name && !updateCategoryDto.slug) {
      // If name is updated but slug is not provided, regenerate slug
      category.slug = this.generateSlug(updateCategoryDto.name);
    }

    if (updateCategoryDto.description) category.description = updateCategoryDto.description;

    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.getCategoryById(id);
    await this.categoryRepository.remove(category);
    logger.info(`Category with ID ${id} deleted successfully.`);
  }
}