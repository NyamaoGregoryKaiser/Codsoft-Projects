```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(
    private projectsService: ProjectsService,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user; // Authenticated user
    const projectId = request.params.id; // Project ID from route params

    if (!projectId) {
      this.logger.warn(`ProjectOwnerGuard: Missing projectId in request params.`, ProjectOwnerGuard.name);
      throw new NotFoundException('Project ID not provided.');
    }

    try {
      const project = await this.projectsService.findOne(projectId);

      // Admin users have full access
      if (user.roles.includes(UserRole.Admin)) {
        this.logger.debug(`ProjectOwnerGuard: Admin user ${user.id} granted access to project ${projectId}.`, ProjectOwnerGuard.name);
        return true;
      }

      // Regular users must be the owner of the project
      if (project.owner.id === user.id) {
        this.logger.debug(`ProjectOwnerGuard: User ${user.id} is owner of project ${projectId}. Access granted.`, ProjectOwnerGuard.name);
        return true;
      }

      this.logger.warn(`ProjectOwnerGuard: User ${user.id} is not authorized to access project ${projectId}.`, ProjectOwnerGuard.name);
      throw new ForbiddenException('You do not have permission to access this project.');
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`ProjectOwnerGuard: Project ${projectId} not found.`, ProjectOwnerGuard.name);
        throw error; // Re-throw NotFoundException
      }
      this.logger.error(`ProjectOwnerGuard: Error checking project ownership for project ${projectId}. Error: ${error.message}`, error.stack, ProjectOwnerGuard.name);
      throw new ForbiddenException('You do not have permission to access this project.');
    }
  }
}
```