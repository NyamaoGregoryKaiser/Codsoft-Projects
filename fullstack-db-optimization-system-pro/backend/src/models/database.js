```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Database = sequelize.define('Database', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dbName: { // Actual database name on the server
      type: DataTypes.STRING,
      allowNull: false,
    },
    dialect: {
      type: DataTypes.ENUM('postgres', 'mysql', 'mssql', 'sqlite'), // Extend as needed
      allowNull: false,
      defaultValue: 'postgres',
    },
    host: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: { // Store encrypted in production
      type: DataTypes.STRING,
      allowNull: true, // Allow empty for some setups, though generally required
      set(value) {
        // In a production setup, encrypt this password before storing.
        // For simplicity here, storing as-is, but strongly recommend encryption.
        this.setDataValue('password', value);
      }
    },
    ssl: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'databases',
    timestamps: true,
  });

  Database.associate = (models) => {
    Database.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Database.hasMany(models.SlowQuery, { foreignKey: 'databaseId', as: 'slowQueries' });
  };

  return Database;
};
```