// here all imports
require('dotenv').config({ path: `${process.env.NODE_ENV}.env` })
const express = require('express');
const cors = require('cors')

// here all routes
const tripRouter = require('./routers/trip-router')


// for jwt auth
// const cookieParser = require('cookie-parser')

const app = express();
// here all .use
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))

app.use(express.json())

app.use('/trip', tripRouter)

// use error middleware last

async function startServer() {
    try {
        // connect mongo here
        app.listen(process.env.PORT, () => { console.log(`Server is running on http://localhost:${process.env.PORT}`); })
    } catch (err) {
        console.error('Error while starting server: ', err);
    }
}

startServer()