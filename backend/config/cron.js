// cronJobs.js
const cron = require('node-cron');
const userLedgerService = require("../app/Services/user-ledger.service")
const CRON_OPTIONS = { timezone: 'Asia/Dubai' };

function initializeCronJobs() {
  // Quarterly: Mar 31, Jun 30, Sep 30, Dec 31 at 00:00.
  // Note: Sep 31 is invalid, so Sep 30 is used.
  ['0 0 31 3 *', '0 0 30 6 *', '0 0 30 9 *', '0 0 31 12 *'].forEach((expression) => {
    cron.schedule(expression, () => {
      console.log(`Running quarterly return task (${expression})`);
      userLedgerService.calculateReturns("quarterly")
    }, CRON_OPTIONS);
  });

  // Semi-annual: Jun 30 and Dec 31 at 00:00
  ['0 0 30 6 *', '0 0 31 12 *'].forEach((expression) => {
    cron.schedule(expression, () => {
      console.log(`Running semi-annual return task (${expression})`);
      userLedgerService.calculateReturns("semi-annual")
    }, CRON_OPTIONS);
  });

  // Annual: Dec 31 at 00:00
  cron.schedule('0 0 31 12 *', () => {
    console.log('Running annual return task');
    userLedgerService.calculateReturns("annual")
  }, CRON_OPTIONS);

  // Testing heartbeat: every 3 hours
  cron.schedule('0 */3 * * *', () => {
    console.log('Running testing return task (every 3 hours)');
    userLedgerService.calculateReturns("testing")
  }, CRON_OPTIONS);
}

module.exports = initializeCronJobs;
