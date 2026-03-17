import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./data-source";
import { logger } from "./config/logger";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully.");

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
        });
    } catch (error) {
        logger.error("Failed to connect to database or start server:", error);
        process.exit(1);
    }
};

startServer();