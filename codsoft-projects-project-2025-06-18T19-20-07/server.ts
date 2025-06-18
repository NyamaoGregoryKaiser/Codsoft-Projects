```typescript
import express from 'express';
import { Sequelize } from 'sequelize';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Sales } from './models/Sales'; //Import your model

const app = express();
const port = 3001;

// Database connection (replace with your credentials)
const sequelize = new Sequelize('database', 'user', 'password', {
  dialect: 'postgres',
  logging: false
});

app.use(bodyParser.json());
app.use(cors());


//Sync Models
sequelize.sync().then(() => {
    console.log('Database synced');
}).catch(err => {
    console.error('Error syncing database:', err);
})

app.get('/api/sales', async (req, res) => {
    try {
        const sales = await Sales.findAll();
        res.json(sales);
    } catch (error) {
        console.error("Error fetching sales data:", error)
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```