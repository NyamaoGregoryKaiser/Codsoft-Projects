```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import { UserRole } from '../shared/enums'; // Adjust path as needed

export class InitialSchema1701799200000 implements MigrationInterface {
  name = 'InitialSchema1701799200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('${UserRole.ADMIN}', '${UserRole.USER}');
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT '${UserRole.USER}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
        CONSTRAINT "PK_a3ffb1c0c8416c14115160be1c6" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "database_connections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "host" character varying NOT NULL,
        "port" integer NOT NULL,
        "dbName" character varying NOT NULL,
        "dbUser" character varying NOT NULL,
        "dbPasswordEncrypted" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_85b7b9f8f2b7a9f7e7f7f7f7f7f7f7f7" PRIMARY KEY ("id"),
        CONSTRAINT "FK_userId_on_connections" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);
    // Add unique constraint for (userId, name) for database_connections table
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_connections_userId_name" ON "database_connections" ("userId", "name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_connections_userId_name";`);
    await queryRunner.query(`ALTER TABLE "database_connections" DROP CONSTRAINT "FK_userId_on_connections";`);
    await queryRunner.query(`DROP TABLE "database_connections";`);
    await queryRunner.query(`DROP TABLE "users";`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum";`);
  }
}
```