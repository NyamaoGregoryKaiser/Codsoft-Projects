```javascript
// backend/src/models/user.model.js
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     User:
   *       type: object
   *       required:
   *         - email
   *         - password
   *         - role
   *       properties:
   *         id:
   *           type: integer
   *           description: The auto-generated ID of the user.
   *           readOnly: true
   *         email:
   *           type: string
   *           format: email
   *           description: The user's email address (must be unique).
   *         password:
   *           type: string
   *           format: password
   *           description: The user's password (hashed).
   *           writeOnly: true
   *         role:
   *           type: string
   *           enum: [user, admin]
   *           default: user
   *           description: The role of the user.
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the user was created.
   *           readOnly: true
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: The date and time the user was last updated.
   *           readOnly: true
   *       example:
   *         id: 1
   *         email: test@example.com
   *         role: user
   *         createdAt: "2023-01-01T12:00:00Z"
   *         updatedAt: "2023-01-01T12:00:00Z"
   */
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  }, {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
    // Query optimization: Indexes
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  User.prototype.isValidPassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.associate = (models) => {
    User.hasMany(models.ScrapingJob, {
      foreignKey: 'userId',
      as: 'jobs',
    });
  };

  return User;
};
```