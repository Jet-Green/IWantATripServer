// here all imports ${process.env.NODE_ENV}
require('dotenv').config({ path: `${process.argv[process.argv.length - 1]}.env` })
const express = require('express');
const cors = require('cors')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');

// here all routes
const tripRouter = require('./routers/trip-router')
const guideRouter = require('./routers/guide-router')
const authRouter = require('./routers/auth-router')
const appStateRouter = require('./routers/app-state-router')
const companionRouter = require('./routers/companion-router')
const errorMiddleware = require('./middleware/error-middleware')
const history = require('connect-history-api-fallback');
const bookingRouter = require('./routers/booking-router');
const locationRouter = require('./routers/location-router');
const adminRouter = require('./routers/admin-funcs-router')


app.use(history())


// here all .use
app.use(cors({
    origin: [process.env.CLIENT_URL, "http://localhost:5174"],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('dist'))


// serve images
app.use('/images', express.static('uploads'))
app.use('/guide-elements', express.static('uploads/guide-elements/'))
app.get('/', (req, res) => {
    res.send('hello world')
})


// routes
app.use('/auth', authRouter)
app.use('/trips', tripRouter);
app.use('/guide', guideRouter);
app.use('/app-state', appStateRouter)
app.use('/companion', companionRouter)
app.use('/booking', bookingRouter)
app.use('/location', locationRouter)

app.use('/admin', adminRouter)

// use error middleware last
app.use(errorMiddleware)


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

    db.collections.trips.createIndex({ 'startLocation': '2dsphere' })
    db.collections.users.createIndex({ 'userLocation': '2dsphere' })
    db.collections.companions.createIndex({ 'startLocation': '2dsphere' })

    db.once('open', function () {
        console.log('connection')
    });
}

startServer()
mongoConnect()