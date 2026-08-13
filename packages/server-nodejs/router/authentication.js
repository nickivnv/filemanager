'use strict';

const path = require('path');
const fs = require('fs-extra');
const getClientIp = require('../utils/get-client-ip');

module.exports = ({
  config,
  req,
  res,
  handleError
}) => {
  let subreq = req.path.replace('/authentication/', '');
  subreq = subreq.replace('/', '');

  config.logger.info(`Authentication request "${subreq}" requested by ${getClientIp(req)}`);

  switch(subreq) {
    case 'signin': {
      let { username, password } = req.body;
      username = Buffer.from(username, 'base64').toString();
      password = Buffer.from(password, 'base64').toString();

      const throttle = config.loginThrottle;
      const clientIp = getClientIp(req);

      // nur real existierende Konten werden gezählt
      const known = config.users ?
        config.users.some(u => u.username === username) :
        false;

      // 1) Ist das Konto aktuell gesperrt?
      const remainingMs = (throttle && known) ? throttle.remainingMs(username) : 0;
      if (remainingMs > 0) {
        const retryAfter = Math.ceil(remainingMs / 1000);
        config.logger.warn(
          `Sign-in rejected for locked user "${username}" from ${clientIp}, ${retryAfter}s remaining`
        );
        res.set('Retry-After', String(retryAfter));
        res.status(429).json({ retryAfter: retryAfter });
        return;
      }

      // 2) Normale Prüfung
      const user = config.users ?
        config.users.find(user => (user.username === username) && (user.password === password)) :
        false;

      if (user) {
        if (throttle) throttle.reset(username);          // Zähler bei Erfolg löschen
        req.session.user = { username: username, readOnly: user.readOnly };
        res.status(200).json({ username: user.username });
      } else if (config.users) {
        if (throttle && known) {
          const justLockedMs = throttle.registerFailure(username);
          if (justLockedMs > 0) {
            const retryAfter = Math.ceil(justLockedMs / 1000);
            config.logger.warn(
              `User "${username}" locked for ${retryAfter}s after ${throttle.maxFailures} ` +
              `failed sign-in attempts (last from ${clientIp})`
            );
            res.set('Retry-After', String(retryAfter));
            res.status(429).json({ retryAfter: retryAfter });
            return;
          }
        }
        config.logger.warn(`Failed sign-in for user "${username}" from ${clientIp}`);
        res.status(419).end();
      } else {
        res.status(200).json({ username: '' });
      }
      break;
    }

    case 'signout':
      req.session.destroy();
      res.status(200).end();
      break;

    case 'hassignedin':
      if (config.users) {
        if ( req.session.user ) {
          res.json({username: req.session.user.username});
          res.status(200).end();
        } else {
          res.status(419).end();        
        }       
      } else {
        res.json({username: ''});
        res.status(200).end();        
      }
      break;

    default:
      return handleError(Object.assign(
        new Error(`Resource not found`),
        { httpCode: 404 }
      ));
  }
};
