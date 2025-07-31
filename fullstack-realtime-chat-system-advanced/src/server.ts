```typescript
import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { createConnection, Connection } from "typeorm";
import { User } from './entity/User'; //Example Entity
import * as dotenv from 'dotenv'
dotenv.config()


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", //Change to your frontend origin in production
    methods: ["GET", "POST"]
  }
});

//Database connection (replace with your actual connection string)
let connection: Connection;

createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [User],
    synchronize: true, //Careful with this in production
  }).then(conn => {
    connection = conn;
    console.log("Database connected")
  }).catch(err => {
    console.error("Database connection error:", err);
  })


app.use(express.json());

//Example API Endpoint
app.get('/api/users', async (req: Request, res: Response) => {
    try{
        const users = await connection.getRepository(User).find()
        res.json(users);
    } catch(err){
        res.status(500).json({error: 'Failed to fetch users'})
    }
});



io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg); //Broadcast message to all
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

```