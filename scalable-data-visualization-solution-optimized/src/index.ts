```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/data', async (req, res) => {
  try {
    const data = await prisma.dataPoint.findMany();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```