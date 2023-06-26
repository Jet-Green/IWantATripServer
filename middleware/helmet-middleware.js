const helmet = require('helmet'),
    express = require('express'),
    app = express();

app.use(helmet());