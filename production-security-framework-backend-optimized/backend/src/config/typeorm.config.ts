```typescript
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    return {
      type: 'postgres',
      host: configService.get<string>('DATABASE_HOST'),
      port: configService.get<number>('DATABASE_PORT'),
      username: configService.get<string>('DATABASE_USERNAME'),
      password: configService.get<string>('DATABASE_PASSWORD'),
      database: configService.get<string>('DATABASE_NAME'),
      entities: [User, Project, Task], // Register all your entities here
      synchronize: false, // Set to false in production. Use migrations instead.
      migrationsRun: false, // Migrations are run manually or via script
      logging: ['error'], // Log only errors to the console
      migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
      cli: {
        migrationsDir: 'src/database/migrations',
      },
    };
  },
};
```