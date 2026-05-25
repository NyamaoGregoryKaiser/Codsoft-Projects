import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialMigration1700000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        unique: true,
                        isNullable: false
                    },
                    {
                        name: "password",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "first_name",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "last_name",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        await queryRunner.createTable(
            new Table({
                name: "datasets",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()"
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "name",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "file_path", // Path to the uploaded file (e.g., S3 URL or local path)
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "file_size_bytes",
                        type: "bigint",
                        isNullable: true
                    },
                    {
                        name: "mime_type",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "uploaded_at",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        await queryRunner.createForeignKey(
            "datasets",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("datasets", "FK_datasets_userId"); // Note: TypeORM might create a different name, adjust if needed
        await queryRunner.dropTable("datasets");
        await queryRunner.dropTable("users");
    }

}