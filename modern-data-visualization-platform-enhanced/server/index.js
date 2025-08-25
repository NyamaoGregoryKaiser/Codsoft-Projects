```javascript
const express = require('express');
const db = require('./db'); // Database connection
const authRouter = require('./routes/auth'); //Authentication routes
const dataRouter = require('./routes/data'); //Data routes

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors()); // enable CORS
app.use(helmet()); // security middleware

// Authentication middleware (example)
const authenticateToken = (req, res, next) => {
  // ... (Implementation for JWT authentication) ...
};


app.use('/auth', authRouter);
app.use('/api/data', authenticateToken, dataRouter); // Protected routes

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```