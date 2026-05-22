```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialSchema1701000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users Table
        await queryRunner.createTable(new Table({
            name: "user",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "gen_random_uuid()"
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
                    name: "firstName",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "lastName",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "role",
                    type: "enum",
                    enum: ["admin", "member"],
                    default: "'member'",
                    isNullable: false
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()",
                    isNullable: false
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()",
                    onUpdate: "now()",
                    isNullable: false
                }
            ]
        }), true);

        // Projects Table
        await queryRunner.createTable(new Table({
            name: "project",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "gen_random_uuid()"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "ownerId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()",
                    isNullable: false
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()",
                    onUpdate: "now()",
                    isNullable: false
                }
            ]
        }), true);

        // Tasks Table
        await queryRunner.createTable(new Table({
            name: "task",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "gen_random_uuid()"
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["todo", "in-progress", "done", "archived"],
                    default: "'todo'",
                    isNullable: false
                },
                {
                    name: "priority",
                    type: "enum",
                    enum: ["low", "medium", "high"],
                    default: "'medium'",
                    isNullable: false
                },
                {
                    name: "dueDate",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "projectId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "assigneeId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()",
                    isNullable: false
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()",
                    onUpdate: "now()",
                    isNullable: false
                }
            ]
        }), true);

        // Comments Table
        await queryRunner.createTable(new Table({
            name: "comment",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "gen_random_uuid()"
                },
                {
                    name: "content",
                    type: "text",
                    isNullable: false
                },
                {
                    name: "userId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "taskId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "now()",
                    isNullable: false
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "now()",
                    onUpdate: "now()",
                    isNullable: false
                }
            ]
        }), true);

        // Add Foreign Keys
        await queryRunner.createForeignKey("project", new TableForeignKey({
            columnNames: ["ownerId"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("task", new TableForeignKey({
            columnNames: ["projectId"],
            referencedColumnNames: ["id"],
            referencedTableName: "project",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("task", new TableForeignKey({
            columnNames: ["assigneeId"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "SET NULL" // If assignee is deleted, set task assignee to null
        }));

        await queryRunner.createForeignKey("comment", new TableForeignKey({
            columnNames: ["userId"],
            referencedColumnNames: ["id"],
            referencedTableName: "user",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("comment", new TableForeignKey({
            columnNames: ["taskId"],
            referencedColumnNames: ["id"],
            referencedTableName: "task",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("comment", "FK_COMMENT_TASK");
        await queryRunner.dropForeignKey("comment", "FK_COMMENT_USER");
        await queryRunner.dropForeignKey("task", "FK_TASK_ASSIGNEE");
        await queryRunner.dropForeignKey("task", "FK_TASK_PROJECT");
        await queryRunner.dropForeignKey("project", "FK_PROJECT_OWNER");

        await queryRunner.dropTable("comment");
        await queryRunner.dropTable("task");
        await queryRunner.dropTable("project");
        await queryRunner.dropTable("user");
    }

}
```