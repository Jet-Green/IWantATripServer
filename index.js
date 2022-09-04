require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
const express = require('express');
const cors = require('cors')

// for jwt auth
// const cookieParser = require('cookie-parser')

const app = express();

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))
app.use(express.json())



async function startServer() {
    try {
        // connect mongo here
        app.listen(process.env.PORT, () => { console.log(`Server is running on http://localhost:${process.env.PORT}`); })
    } catch (err) {
        console.error(err);
    }
}

startServer()