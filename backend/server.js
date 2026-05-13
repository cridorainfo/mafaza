require('rootpath')();
require('dotenv/config');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const initializeCronJobs = require('./config/cron');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./app/Middleware/ErrorHandler');
const { ready: dbReady } = require('./app/Models');
const { corsOptions, helmetOptions, apiLimiter, authLimiter, postOnly } = require('./config/http-security');

app.set('trust proxy', 1);
app.disable('x-powered-by');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(path.join(publicDir, 'uploads'), { recursive: true });
} else if (!fs.existsSync(path.join(publicDir, 'uploads'))) {
  fs.mkdirSync(path.join(publicDir, 'uploads'), { recursive: true });
}

app.use(helmet(helmetOptions()));

app.get('/health', (req, res) => {
  res.status(200).type('text/plain').send('ok');
});

app.use('/', express.static(publicDir));

app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cookieParser());

app.use(cors(corsOptions()));

app.use('/api/v1.0/auth', postOnly(authLimiter()));
app.use('/api', apiLimiter());
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
