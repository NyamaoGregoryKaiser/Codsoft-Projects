import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import path from "path";
import { User } from "./entities/User";
import { Content } from "./entities/Content";
import { Category } from "./entities/Category";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "cmsdb",
    synchronize: false, // Set to false in production. Use migrations.
    logging: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
    entities: [User, Content, Category],
    migrations: [path.join(__dirname, "migrations/**/*.ts")],
    subscribers: [],
});