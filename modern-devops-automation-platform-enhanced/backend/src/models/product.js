```javascript
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0
      }
    },
    userId: { // Foreign key for the User who owns/created the product
      type: DataTypes.UUID,
      references: {
        model: 'users', // table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // If user is deleted, product might become unassigned, or CASCADE if preferred.
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  return Product;
};
```