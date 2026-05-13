require('dotenv/config');

function isDatabaseSslEnabledForUrl() {
  if (process.env.DATABASE_SSL === 'false') return false;
  const mode = String(process.env.PGSSLMODE || '').toLowerCase();
  if (mode === 'disable') return false;
  return true;
}

function buildDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();
  if (databaseUrl) {
    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: {
        ssl: isDatabaseSslEnabledForUrl() ? { require: true, rejectUnauthorized: false } : false,
      },
      logging: false,
    };
  }

  const dialect = process.env.DB_CONNECTION || 'postgres';
  const out = {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect,
    logging: false,
  };

  if (process.env.DB_SSL === 'true') {
    out.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: false },
    };
  }

  return out;
}

const db = buildDatabaseConfig();

module.exports = {
  development: {
    ...db,
    appUrl: process.env.APP_URL,

    smtpOptions: {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      emailfrom: process.env.MAIL_FROM_ADDRESS,
      auth: {
        pass: process.env.MAIL_PASSWORD,
        user: process.env.MAIL_USERNAME,
      },
    },
  },
  test: {
    ...db,

    appUrl: process.env.APP_URL,

    smtpOptions: {
      mailhost: process.env.MAIL_HOST,
      mailport: process.env.MAIL_PORT,
      password: process.env.MAIL_PASSWORD,
      username: process.env.MAIL_USERNAME,
      emailfrom: process.env.MAIL_FROM_ADDRESS,
      mailfname: process.env.MAIL_FROM_NAME,
    },
  },
  production: {
    ...db,

    appUrl: process.env.APP_URL,

    smtpOptions: {
      mailhost: process.env.MAIL_HOST,
      mailport: process.env.MAIL_PORT,
      password: process.env.MAIL_PASSWORD,
      username: process.env.MAIL_USERNAME,
      emailfrom: process.env.MAIL_FROM_ADDRESS,
      mailfname: process.env.MAIL_FROM_NAME,
    },
  },

  jwtSecret: process.env.JWT_SECRET_KEY,
};
