'use strict';

const router = require('./router');
const logger = require('./logger');

module.exports = config => router({
  fsRoot: config.fsRoot,
  rootName: config.rootName,
  users: config.users,
  readOnly: config.readOnly,
  logger: config.logger || logger,
  loginLockoutStateFile: config.loginLockoutStateFile || process.env.FM_LOCK_FILE
});
