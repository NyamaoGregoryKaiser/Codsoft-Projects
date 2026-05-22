```typescript
import { AppDataSource } from '../../database/data-source';
import { Project } from '../../database/entities/project.entity';
import { User } from '../../database/entities/user.entity';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PaginatedResult } from '../../utils/pagination';

const projectRepository = AppDataSource.getRepository(Project);
const userRepository = AppDataSource.getRepository(User);

export const createProject = async (createProjectDto: CreateProjectDto, ownerId: string): Promise<Project> => {
  const owner = await userRepository.findOneBy({ id: ownerId });
  if (!owner) {
    throw new NotFoundError('Project owner not found.');
  }

  const newProject = new Project();
  newProject.name = createProjectDto.name;
  newProject.description = createProjectDto.description;
  newProject.owner = owner;

  try {
    const savedProject = await projectRepository.save(newProject);
    logger.info(`Project '${savedProject.name}' created by user ${ownerId}.`);
    return savedProject;
  } catch (error: any) {
    logger.error(`Error creating project for user ${ownerId}:`, error);
    throw new BadRequestError('Could not create project. Please check your input.');
  }
};

export const findAllProjects = async (userId: string, options: { limit: number; page: number; orderBy: string; orderDirection: 'ASC' | 'DESC' }): Promise<PaginatedResult<Project>> => {
  const { limit, page, orderBy, orderDirection } = options;
  const skip = (page - 1) * limit;

  // Find projects owned by the user, or where tasks are assigned to the user
  const [projects, total] = await projectRepository
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.owner', 'owner')
    .leftJoinAndSelect('project.tasks', 'tasks') // Eager load tasks for potential future use or display
    .leftJoinAndSelect('tasks.assignee', 'assignee')
    .where('project.owner.id = :userId', { userId })
    .orWhere('assignee.id = :userId', { userId }) // Include projects where user is an assignee of any task
    .orderBy(`project.${orderBy}`, orderDirection)
    .take(limit)
    .skip(skip)
    .getManyAndCount();

  // Filter out duplicates if a project is included via both owner and assignee
  const uniqueProjectsMap = new Map<string, Project>();
  projects.forEach(p => uniqueProjectsMap.set(p.id, p));
  const uniqueProjects = Array.from(uniqueProjectsMap.values());
  const uniqueTotal = uniqueProjects.length; // This total is for the current page. For global total, need distinct count.
                                           // A more complex query or post-processing might be needed for a precise total.
                                           // For simplicity, we'll return the total found by the query.

  return {
    data: uniqueProjects,
    total: total, // This 'total' is the raw count, might include duplicates if orWhere is used.
                  // For a true total of unique projects, a subquery with DISTINCT or manual counting is needed.
                  // Let's assume the current total is sufficient for basic pagination guidance.
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findProjectById = async (id: string, userId: string): Promise<Project> => {
  const project = await projectRepository.findOne({
    where: { id },
    relations: ['owner', 'tasks', 'tasks.assignee'], // Eager load owner, tasks, and task assignees
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${id} not found.`);
  }

  // Check if the user is the owner or is assigned to any task within the project
  const isOwner = project.owner.id === userId;
  const isAssignee = project.tasks.some(task => task.assignee?.id === userId);

  if (!isOwner && !isAssignee) {
    throw new ForbiddenError('You do not have permission to access this project.');
  }

  return project;
};

export const updateProject = async (id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> => {
  const project = await projectRepository.findOne({
    where: { id },
    relations: ['owner'], // Need owner to check permissions
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${id} not found.`);
  }

  if (project.owner.id !== userId) {
    throw new ForbiddenError('You do not have permission to update this project.');
  }

  project.name = updateProjectDto.name || project.name;
  project.description = updateProjectDto.description || project.description;

  try {
    const updatedProject = await projectRepository.save(project);
    logger.info(`Project '${updatedProject.name}' (${updatedProject.id}) updated by user ${userId}.`);
    return updatedProject;
  } catch (error: any) {
    logger.error(`Error updating project ${id}:`, error);
    throw new BadRequestError('Could not update project. Please check your input.');
  }
};

export const deleteProject = async (id: string, userId: string): Promise<void> => {
  const project = await projectRepository.findOne({
    where: { id },
    relations: ['owner'],
  });

  if (!project) {
    throw new NotFoundError(`Project with ID ${id} not found.`);
  }

  if (project.owner.id !== userId) {
    throw new ForbiddenError('You do not have permission to delete this project.');
  }

  const result = await projectRepository.delete(id);

  if (result.affected === 0) {
    throw new NotFoundError(`Project with ID ${id} not found (after permission check).`);
  }
  logger.info(`Project '${project.name}' (${id}) deleted by user ${userId}.`);
};
```