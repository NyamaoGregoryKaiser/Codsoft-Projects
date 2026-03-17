import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/CategoryService';
import { CustomError } from '../middlewares/errorHandler';
import { CreateCategoryDto, UpdateCategoryDto } from '../utils/validation';

export class CategoryController {
    private categoryService = new CategoryService();

    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryData: CreateCategoryDto = req.body;
            const newCategory = await this.categoryService.createCategory(categoryData);
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: newCategory,
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const [categories, total] = await this.categoryService.getCategories(page, limit);
            res.status(200).json({
                success: true,
                data: categories,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getCategoryById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const category = await this.categoryService.getCategoryById(id);
            if (!category) {
                return next(new CustomError(404, 'Category not found.'));
            }
            res.status(200).json({
                success: true,
                data: category,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData: UpdateCategoryDto = req.body;
            const updatedCategory = await this.categoryService.updateCategory(id, updateData);
            if (!updatedCategory) {
                return next(new CustomError(404, 'Category not found.'));
            }
            res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: updatedCategory,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await this.categoryService.deleteCategory(id);
            res.status(204).json({
                success: true,
                message: 'Category deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}