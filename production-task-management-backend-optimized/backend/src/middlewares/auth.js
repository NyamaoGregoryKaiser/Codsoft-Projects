```javascript
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');

const auth = (...requiredRoles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token missing');
    }

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    // Check if user has required roles
    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
    }

    req.user = user; // Attach user object to request
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
    }
    next(error);
  }
};

// Middleware to check if the user is the owner of a resource (e.g., project, task)
const isOwnerOrAdmin = (resourceType, paramName = 'id') => async (req, res, next) => {
  try {
    const resourceId = req.params[paramName];
    if (!resourceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Resource ID (${paramName}) missing in parameters`);
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admins always have access
    }

    let resource;
    switch (resourceType) {
      case 'project':
        resource = await prisma.project.findUnique({ where: { id: resourceId } });
        if (!resource || resource.ownerId !== req.user.id) {
          throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this project');
        }
        break;
      case 'task':
        resource = await prisma.task.findUnique({ where: { id: resourceId } });
        if (!resource) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
        }
        // Check if user is the task creator or project owner
        const project = await prisma.project.findUnique({ where: { id: resource.projectId } });
        if (!project || (resource.creatorId !== req.user.id && project.ownerId !== req.user.id)) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to manage this task');
        }
        break;
      case 'userProfile': // For managing own profile
        if (resourceId !== req.user.id) {
          throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to manage this user profile');
        }
        break;
      default:
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Invalid resource type for ownership check');
    }

    req.resource = resource; // Optionally attach the resource
    next();
  } catch (error) {
    next(error);
  }
};


module.exports = {
  auth,
  isOwnerOrAdmin,
};
```