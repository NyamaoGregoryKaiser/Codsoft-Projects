```javascript
/**
 * @file Defines the User model.
 * @module models/userModel
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: {
                    args: [3, 30],
                    msg: 'Username must be between 3 and 30 characters.',
                },
                isAlphanumeric: {
                    msg: 'Username can only contain letters and numbers.',
                },
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Invalid email address.',
                },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [6, 255], // Password length validation before hashing
                    msg: 'Password must be at least 6 characters long.',
                },
            },
        },
        status: {
            type: DataTypes.ENUM('online', 'offline', 'away'),
            defaultValue: 'offline',
            allowNull: false,
        },
        lastSeen: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: true,
        indexes: [
            { unique: true, fields: ['username'] },
            { unique: true, fields: ['email'] },
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
        defaultScope: {
            attributes: { exclude: ['password'] } // Exclude password by default
        },
        scopes: {
            withPassword: {
                attributes: { include: ['password'] } // Include password when explicitly requested
            }
        }
    });

    /**
     * Compares a given password with the hashed password in the database.
     * @param {string} candidatePassword - The password to compare.
     * @returns {Promise<boolean>} - True if passwords match, false otherwise.
     */
    User.prototype.comparePassword = async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    };

    return User;
};
```