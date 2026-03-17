import { Repository } from "typeorm";
import { Category } from "../entities/Category";
import { AppDataSource } from "../data-source";

export const CategoryRepository = AppDataSource.getRepository(Category).extend({
    async findByName(name: string): Promise<Category | null> {
        return this.findOne({ where: { name } });
    },
    // Add any other specific category queries here
});