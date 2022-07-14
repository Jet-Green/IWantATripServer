const express = require('express');
const app = express();

const tripsFunctions = require('./functions/trip')

app.get('/trip/get-all', tripsFunctions.getAllTrips);

const PORT = 3003;

app.listen(PORT, () => { console.log(`App is running on  http://localhost:${PORT}`); })