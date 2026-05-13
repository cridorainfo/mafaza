/**
 * Fail fast on missing required secrets so deploy logs are obvious (e.g. Railway Variables).
 */
function assertRequiredEnv() {
  const jwtSecret = process.env.JWT_SECRET_KEY;
  if (jwtSecret === undefined || jwtSecret === null || String(jwtSecret).trim() === '') {
    console.error(
      '[mafaza-api] FATAL: JWT_SECRET_KEY is not set.\n' +
        '  Railway: Service → Variables → add JWT_SECRET_KEY (use a long random value, e.g. run: openssl rand -hex 32)\n' +
        '  Then redeploy.'
    );
    process.exit(1);
  }
}

module.exports = { assertRequiredEnv };
