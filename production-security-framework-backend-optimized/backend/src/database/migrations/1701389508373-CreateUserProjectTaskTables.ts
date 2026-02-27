```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserProjectTaskTables1701389508373 implements MigrationInterface {
    name = 'CreateUserProjectTaskTables1701389508373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."users_roles_enum" AS ENUM('user', 'admin');
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying NOT NULL,
                "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{user}',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416c141151677c7bd" PRIMARY KEY ("id")
            );
            CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email");
            
            CREATE TABLE "projects" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(100) NOT NULL,
                "description" text,
                "ownerId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6271c77f5979f456793e2b405d1" PRIMARY KEY ("id")
            );
            CREATE UNIQUE INDEX "IDX_a67272782b1c4e7232247b9605" ON "projects" ("title", "ownerId");
            
            CREATE TYPE "public"."tasks_status_enum" AS ENUM('open', 'in_progress', 'review', 'done', 'closed');
            CREATE TABLE "tasks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(100) NOT NULL,
                "description" text,
                "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'open',
                "dueDate" TIMESTAMP WITH TIME ZONE,
                "projectId" uuid NOT NULL,
                "assigneeId" uuid,
                "creatorId" uuid,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8d12ff38fcc629ec2371703fd91" PRIMARY KEY ("id")
            );
            CREATE INDEX "IDX_c11c13d9692994406a0c0a316c" ON "tasks" ("title", "projectId");
            
            ALTER TABLE "projects" ADD CONSTRAINT "FK_560183186d061765a0c3029f649" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
            ALTER TABLE "tasks" ADD CONSTRAINT "FK_382337e69c701389280145c3924" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
            ALTER TABLE "tasks" ADD CONSTRAINT "FK_c923d2427f7a70196720d5792d7" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
            ALTER TABLE "tasks" ADD CONSTRAINT "FK_2862076043940173426162394ae" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tasks" DROP CONSTRAINT "FK_2862076043940173426162394ae";
            ALTER TABLE "tasks" DROP CONSTRAINT "FK_c923d2427f7a70196720d5792d7";
            ALTER TABLE "tasks" DROP CONSTRAINT "FK_382337e69c701389280145c3924";
            ALTER TABLE "projects" DROP CONSTRAINT "FK_560183186d061765a0c3029f649";
            DROP INDEX "public"."IDX_c11c13d9692994406a0c0a316c";
            DROP TABLE "tasks";
            DROP TYPE "public"."tasks_status_enum";
            DROP INDEX "public"."IDX_a67272782b1c4e7232247b9605";
            DROP TABLE "projects";
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be";
            DROP TABLE "users";
            DROP TYPE "public"."users_roles_enum";
        `);
    }

}
```