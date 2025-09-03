```typescript
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // Assuming you use Prisma
import cors from 'cors';
import { scrapeWebsite } from './scraper'; //Example Scraper function
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient(); // Replace with your ORM

app.use(cors());
app.use(bodyParser.json())


app.get('/scrape/:url', async (req: Request, res: Response) => {
  try {
    const url = req.params.url;
    const data = await scrapeWebsite(url); 
    res.json(data);
  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: 'Failed to scrape website' });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```