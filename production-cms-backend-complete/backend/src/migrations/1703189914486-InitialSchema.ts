import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialSchema1703189914486 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users Table
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "email",
                    type: "varchar",
                    length: "255",
                    isUnique: true,
                    isNullable: false
                },
                {
                    name: "password",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "role",
                    type: "enum",
                    enum: ["ADMIN", "EDITOR", "VIEWER"],
                    default: "'VIEWER'",
                    isNullable: false
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true,
                    isNullable: false
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Categories Table
        await queryRunner.createTable(new Table({
            name: "categories",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "50",
                    isUnique: true,
                    isNullable: false
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Content Table
        await queryRunner.createTable(new Table({
            name: "contents",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255",
                    isUnique: true,
                    isNullable: false
                },
                {
                    name: "body",
                    type: "text",
                    isNullable: false
                },
                {
                    name: "thumbnailUrl",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
                    default: "'DRAFT'",
                    isNullable: false
                },
                {
                    name: "isFeatured",
                    type: "boolean",
                    default: false,
                    isNullable: false
                },
                {
                    name: "authorId",
                    type: "uuid",
                    isNullable: true // Can be null if author is deleted
                },
                {
                    name: "categoryId",
                    type: "uuid",
                    isNullable: true // Can be null if category is deleted
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Foreign Keys for Content Table
        await queryRunner.createForeignKey("contents", new TableForeignKey({
            columnNames: ["authorId"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "SET NULL"
        }));

        await queryRunner.createForeignKey("contents", new TableForeignKey({
            columnNames: ["categoryId"],
            referencedColumnNames: ["id"],
            referencedTableName: "categories",
            onDelete: "SET NULL"
        }));

        // Enable uuid-ossp extension for UUID generation if not already enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("contents");
        await queryRunner.dropTable("categories");
        await queryRunner.dropTable("users");
    }

}