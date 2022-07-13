const express = require('express');
const app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
    res.send('hello world');
});

const PORT = 3003;

app.listen(PORT, () => { console.log(`App is running on port ${PORT}\nCTRL + Click to open:  http://localhost:${PORT}`); })