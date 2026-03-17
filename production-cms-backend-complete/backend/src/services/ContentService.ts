import { Content, ContentStatus } from "../entities/Content";
import { ContentRepository } from "../repositories/ContentRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { CustomError } from "../middlewares/errorHandler";
import { CreateContentDto, UpdateContentDto } from "../utils/validation";
import { logger } from "../config/logger";

export class ContentService {
    private contentRepository = ContentRepository;
    private categoryRepository = CategoryRepository;

    async createContent(contentData: CreateContentDto, authorId: string): Promise<Content> {
        const category = await this.categoryRepository.findOneBy({ id: contentData.categoryId });
        if (!category) {
            throw new CustomError(400, "Category not found.");
        }

        const newContent = this.contentRepository.create({
            ...contentData,
            authorId,
            category,
            status: contentData.status as ContentStatus || ContentStatus.DRAFT,
        });

        await this.contentRepository.save(newContent);
        logger.info(`Content created by ${authorId}: ${newContent.title}`);
        return newContent;
    }

    async getContents(page: number = 1, limit: number = 10, status?: ContentStatus, search?: string): Promise<[Content[], number]> {
        const skip = (page - 1) * limit;
        const queryBuilder = this.contentRepository.createQueryBuilder("content")
            .leftJoinAndSelect("content.author", "author")
            .leftJoinAndSelect("content.category", "category")
            .orderBy("content.createdAt", "DESC")
            .skip(skip)
            .take(limit);

        if (status) {
            queryBuilder.andWhere("content.status = :status", { status });
        }
        if (search) {
            queryBuilder.andWhere("(LOWER(content.title) LIKE :search OR LOWER(content.body) LIKE :search)", { search: `%${search.toLowerCase()}%` });
        }

        return queryBuilder.getManyAndCount();
    }

    async getContentById(id: string): Promise<Content | null> {
        return this.contentRepository.findOneWithRelations(id);
    }

    async updateContent(id: string, updateData: UpdateContentDto, authorId: string, authorRole: string): Promise<Content | null> {
        const content = await this.contentRepository.findOneBy({ id });
        if (!content) {
            throw new CustomError(404, "Content not found.");
        }

        // Only author or admin can update
        if (content.authorId !== authorId && authorRole !== 'ADMIN') {
            throw new CustomError(403, "Not authorized to update this content.");
        }

        if (updateData.categoryId) {
            const category = await this.categoryRepository.findOneBy({ id: updateData.categoryId });
            if (!category) {
                throw new CustomError(400, "Category not found.");
            }
            content.category = category;
        }

        Object.assign(content, updateData);
        if (updateData.status) {
            content.status = updateData.status as ContentStatus;
        }
        await this.contentRepository.save(content);
        logger.info(`Content updated by ${authorId}: ${content.title}`);
        return content;
    }

    async deleteContent(id: string, authorId: string, authorRole: string): Promise<void> {
        const content = await this.contentRepository.findOneBy({ id });
        if (!content) {
            throw new CustomError(404, "Content not found.");
        }

        // Only author or admin can delete
        if (content.authorId !== authorId && authorRole !== 'ADMIN') {
            throw new CustomError(403, "Not authorized to delete this content.");
        }

        const result = await this.contentRepository.delete(id);
        if (result.affected === 0) {
            throw new CustomError(404, "Content not found after authorization check - unexpected.");
        }
        logger.info(`Content deleted by ${authorId}: ${id}`);
    }
}