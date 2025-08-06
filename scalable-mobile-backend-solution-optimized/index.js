```javascript
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes'); //Import your API routes
const db = require('./db'); //Database connection


const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use('/api', routes);


//Error Handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const port = process.env.PORT || 3000;
db.sync().then(() => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}).catch(error => {
    console.error("Error syncing database:", error);
});


```