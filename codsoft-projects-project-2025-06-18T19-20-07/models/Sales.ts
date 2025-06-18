```typescript
import { DataTypes, Model, Sequelize } from 'sequelize';

interface SalesAttributes {
    id?: number;
    date: Date;
    amount: number;
    region: string;
}

export class Sales extends Model<SalesAttributes> implements SalesAttributes {
    public id!: number;
    public date!: Date;
    public amount!: number;
    public region!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initSales(sequelize: Sequelize) {
    Sales.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        region: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Sales',
        timestamps: true,
    });
}

```