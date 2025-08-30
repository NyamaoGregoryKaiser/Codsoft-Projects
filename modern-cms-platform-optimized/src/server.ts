```typescript
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { postsRouter } from './routes/posts';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use('/api/posts', postsRouter);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

```