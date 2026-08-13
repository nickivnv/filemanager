'use strict';

const router = require('./router');
const logger = require('./logger');
const createLoginThrottle = require('./utils/login-throttle');

module.exports = config => {
  const log = config.logger || logger;

  return router({
    fsRoot: config.fsRoot,
    rootName: config.rootName,
    users: config.users,
    readOnly: config.readOnly,
    logger: log,
    loginThrottle: createLoginThrottle({
      maxFailures: config.loginMaxFailures || 3,
      lockoutMs: (config.loginLockoutMinutes || 15) * 60 * 1000,
      stateFile: config.loginLockoutStateFile || null,
      logger: log
    })
  });
};