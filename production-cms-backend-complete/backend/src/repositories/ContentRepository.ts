import { Repository } from "typeorm";
import { Content, ContentStatus } from "../entities/Content";
import { AppDataSource } from "../data-source";

export const ContentRepository = AppDataSource.getRepository(Content).extend({
    async findPublishedContent(page: number = 1, limit: number = 10): Promise<[Content[], number]> {
        const skip = (page - 1) * limit;
        return this.findAndCount({
            where: { status: ContentStatus.PUBLISHED },
            relations: ["author", "category"],
            order: { createdAt: "DESC" },
            skip,
            take: limit,
        });
    },

    async findOneWithRelations(id: string): Promise<Content | null> {
        return this.findOne({
            where: { id },
            relations: ["author", "category"],
        });
    },
    // Add any other specific content queries here
});