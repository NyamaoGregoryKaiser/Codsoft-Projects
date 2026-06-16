```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SlowQuery = sequelize.define('SlowQuery', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    databaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'databases',
        key: 'id',
      },
    },
    queryText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    queryHash: { // Unique hash to identify the query
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'unique_query_per_db' // Composite unique index
    },
    estimatedCost: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    callCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    avgDurationMs: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'slow_queries',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['databaseId', 'queryHash'],
        name: 'unique_query_per_db_idx'
      },
      { fields: ['databaseId'] },
      { fields: ['lastSeen'] },
      { fields: ['avgDurationMs'] }
    ]
  });

  SlowQuery.associate = (models) => {
    SlowQuery.belongsTo(models.Database, { foreignKey: 'databaseId', as: 'Database' });
    SlowQuery.hasOne(models.QueryPlan, { foreignKey: 'slowQueryId', as: 'queryPlan' });
    SlowQuery.hasMany(models.Optimization, { foreignKey: 'slowQueryId', as: 'optimizations' });
  };

  return SlowQuery;
};
```