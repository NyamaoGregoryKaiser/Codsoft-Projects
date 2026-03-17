import { Category } from "../entities/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { CustomError } from "../middlewares/errorHandler";
import { CreateCategoryDto, UpdateCategoryDto } from "../utils/validation";
import { logger } from "../config/logger";

export class CategoryService {
    private categoryRepository = CategoryRepository;

    async createCategory(categoryData: CreateCategoryDto): Promise<Category> {
        const newCategory = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(newCategory);
        logger.info(`Category created: ${newCategory.name}`);
        return newCategory;
    }

    async getCategories(page: number = 1, limit: number = 10): Promise<[Category[], number]> {
        const skip = (page - 1) * limit;
        return this.categoryRepository.findAndCount({
            skip,
            take: limit,
            order: { name: "ASC" }
        });
    }

    async getCategoryById(id: string): Promise<Category | null> {
        return this.categoryRepository.findOneBy({ id });
    }

    async updateCategory(id: string, updateData: UpdateCategoryDto): Promise<Category | null> {
        const category = await this.categoryRepository.findOneBy({ id });
        if (!category) {
            throw new CustomError(404, "Category not found.");
        }

        Object.assign(category, updateData);
        await this.categoryRepository.save(category);
        logger.info(`Category updated: ${category.name}`);
        return category;
    }

    async deleteCategory(id: string): Promise<void> {
        const result = await this.categoryRepository.delete(id);
        if (result.affected === 0) {
            throw new CustomError(404, "Category not found.");
        }
        logger.info(`Category deleted: ${id}`);
    }
}