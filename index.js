// here all imports ${process.env.NODE_ENV}

require('dotenv').config({ path: `${process.argv[process.argv.length - 1]}.env` })
const express = require('express');
const cors = require('cors')
const app = express()
const mongoose = require('mongoose')
// here all routes
const tripRouter = require('./routers/trip-router')
const guideRouter = require('./routers/guide-router')

const history = require('connect-history-api-fallback');

app.use(history())
app.use(express.static('dist'))

app.get('/', (req, res) => {
    res.send('hello world')
})
// for jwt auth
// const cookieParser = require('cookie-parser')


// here all .use
app.use(cors({
    // credentials: true,
    origin: '*'
    // process.env.CLIENT_URL
}))

app.use(express.json())

app.use('/trips', tripRouter);

app.use('/guide', guideRouter);

// use error middleware last

function startServer() {
    try {
        app.listen(process.env.PORT, () => { console.log(`Server is running on http://localhost:${process.env.PORT}`); })
    } catch (err) {
        console.error('Error while starting server: ', err);
    }
}
function mongoConnect() {
    mongoose.connect(process.env.MONGO_URL,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    )
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log('connection')
    });
}

startServer()
mongoConnect()