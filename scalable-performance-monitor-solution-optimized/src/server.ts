```typescript
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bodyParser from 'body-parser';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/metrics', async (req: Request, res: Response) => {
  const metrics = await prisma.metric.findMany();
  res.json(metrics);
});

app.post('/metrics', async (req: Request, res: Response) => {
  const { endpoint, value } = req.body;
  const metric = await prisma.metric.create({ data: { endpoint, value } });
  res.json(metric);
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```