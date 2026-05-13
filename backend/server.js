require('rootpath')();
const fs = require('fs');
const path = require('path');
const initializeCronJobs = require('./config/cron');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./app/Middleware/ErrorHandler');
const { ready: dbReady } = require('./app/Models');

app.set('trust proxy', 1);

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(path.join(publicDir, 'uploads'), { recursive: true });
} else if (!fs.existsSync(path.join(publicDir, 'uploads'))) {
  fs.mkdirSync(path.join(publicDir, 'uploads'), { recursive: true });
}

app.get('/health', (req, res) => {
  res.status(200).type('text/plain').send('ok');
});

app.use('/', express.static(publicDir));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// api routes
app.use('/api', require('./routes'));

const spaIndexPath = path.join(publicDir, 'index.html');
if (process.env.NODE_ENV === 'production' && fs.existsSync(spaIndexPath)) {
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/uploads')) return next();
    res.sendFile(spaIndexPath);
  });
}

// global error handler
app.use(errorHandler);

initializeCronJobs();

const port = Number(process.env.PORT || process.env.APP_PORT) || (process.env.NODE_ENV === 'production' ? 8080 : 3000);
dbReady
  .then(() => {
    app.listen(port, () => console.log('Server listening on port ' + port));
  })
  .catch(error => {
    console.error('Database initialization failed:', error?.message || error);
    process.exit(1);
  });
