```typescript
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3000;
const prisma = new PrismaClient();

app.use(bodyParser.json());
app.use(cors());


app.get('/products', async (req: Request, res: Response) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

// ... other API endpoints (CRUD for Products, Users, Orders etc.) ...

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
```