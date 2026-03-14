```javascript
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { Role, Permission } = require('../db/models');

/**
 * Middleware to check if the authenticated user has the required permissions.
 * @param {string[]} requiredPermissions - An array of permission slugs (e.g., ['create_content', 'read_users']).
 * @returns {function} Express middleware.
 */
const permissionMiddleware = (requiredPermissions) => async (req, res, next) => {
  if (!req.user || !req.user.roleId) {
    logger.warn(`Permission check failed: User not authenticated or role not found for user ID: ${req.user ? req.user.id : 'N/A'}`);
    return next(createError(401, 'Not authorized to access this resource.'));
  }

  try {
    const userRole = await Role.findByPk(req.user.roleId, {
      include: [{ model: Permission, as: 'Permissions' }]
    });

    if (!userRole) {
      logger.warn(`Permission check failed: Role not found for role ID: ${req.user.roleId}`);
      return next(createError(403, 'Forbidden: User role not found.'));
    }

    const userPermissions = userRole.Permissions.map(p => p.slug);

    const hasAllRequiredPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (hasAllRequiredPermissions) {
      next();
    } else {
      logger.warn(`Permission check failed for user ${req.user.id}. Missing permissions: ${requiredPermissions.filter(p => !userPermissions.includes(p)).join(', ')}`);
      next(createError(403, 'Forbidden: You do not have the necessary permissions to perform this action.'));
    }
  } catch (error) {
    logger.error(`Error during permission check for user ${req.user.id}: ${error.message}`, { error });
    next(createError(500, 'Internal server error during permission check.'));
  }
};

module.exports = permissionMiddleware;
```