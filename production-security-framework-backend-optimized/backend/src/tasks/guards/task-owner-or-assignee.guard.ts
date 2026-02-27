```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from '../tasks.service';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class TaskOwnerOrAssigneeGuard implements CanActivate {
  constructor(
    private tasksService: TasksService,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user; // Authenticated user
    const taskId = request.params.id; // Task ID from route params
    const httpMethod = request.method;

    if (!taskId) {
      this.logger.warn(`TaskOwnerOrAssigneeGuard: Missing taskId in request params.`, TaskOwnerOrAssigneeGuard.name);
      throw new NotFoundException('Task ID not provided.');
    }

    try {
      const task = await this.tasksService.findOne(taskId);

      // Admin users have full access
      if (user.roles.includes(UserRole.Admin)) {
        this.logger.debug(`TaskOwnerOrAssigneeGuard: Admin user ${user.id} granted access to task ${taskId}.`, TaskOwnerOrAssigneeGuard.name);
        return true;
      }

      // Owner of the project associated with the task can perform CRUD
      if (task.project.owner.id === user.id) {
        this.logger.debug(`TaskOwnerOrAssigneeGuard: Project owner ${user.id} granted access to task ${taskId}.`, TaskOwnerOrAssigneeGuard.name);
        return true;
      }

      // For PUT/PATCH (update) and GET (read), the assignee also has access
      if (['GET', 'PATCH', 'PUT'].includes(httpMethod.toUpperCase()) && task.assignee?.id === user.id) {
        this.logger.debug(`TaskOwnerOrAssigneeGuard: Assignee ${user.id} granted access to task ${taskId} for ${httpMethod}.`, TaskOwnerOrAssigneeGuard.name);
        return true;
      }

      this.logger.warn(`TaskOwnerOrAssigneeGuard: User ${user.id} is not authorized to access task ${taskId} (method: ${httpMethod}).`, TaskOwnerOrAssigneeGuard.name);
      throw new ForbiddenException('You do not have permission to access this task.');
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`TaskOwnerOrAssigneeGuard: Task ${taskId} not found.`, TaskOwnerOrAssigneeGuard.name);
        throw error; // Re-throw NotFoundException
      }
      this.logger.error(`TaskOwnerOrAssigneeGuard: Error checking task ownership/assignment for task ${taskId}. Error: ${error.message}`, error.stack, TaskOwnerOrAssigneeGuard.name);
      throw new ForbiddenException('You do not have permission to access this task.');
    }
  }
}
```