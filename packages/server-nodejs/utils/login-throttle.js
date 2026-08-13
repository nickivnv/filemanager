'use strict';

const fs = require('fs-extra');
const path = require('path');

const DEFAULTS = {
  maxFailures: 3,
  lockoutMs: 15 * 60 * 1000,
  stateFile: null,   // null = keine Persistenz (nur RAM)
  logger: null
};

module.exports = function createLoginThrottle(options) {
  const cfg = Object.assign({}, DEFAULTS, options || {});
  const log = cfg.logger;

  // key: Benutzername in Kleinschreibung -> { failures, lockedUntil }
  const state = new Map();

  const key = u => String(u || '').toLowerCase();

  function save() {
    if (!cfg.stateFile) return;
    const obj = {};
    state.forEach((v, k) => { obj[k] = v; });
    const tmp = cfg.stateFile + '.tmp';
    try {
      fs.ensureDirSync(path.dirname(cfg.stateFile));
      fs.writeJsonSync(tmp, obj);
      fs.moveSync(tmp, cfg.stateFile, { overwrite: true });   // atomar ersetzen
    } catch (err) {
      if (log) log.error('Login throttle: state file not writable: ' + err.message);
    }
  }

  function load() {
    if (!cfg.stateFile) return;
    try {
      const raw = fs.readJsonSync(cfg.stateFile);
      const now = Date.now();
      Object.keys(raw || {}).forEach(k => {
        const e = raw[k] || {};
        // Schutz gegen Uhrsprünge: nie länger sperren als eine volle Sperrperiode ab jetzt
        const lockedUntil = Math.min(Number(e.lockedUntil) || 0, now + cfg.lockoutMs);
        const failures = Number(e.failures) || 0;
        if (lockedUntil > now || failures > 0) {
          state.set(k, { failures: failures, lockedUntil: lockedUntil });
        }
      });
    } catch (err) {
      if (err.code !== 'ENOENT' && log) {
        log.warn('Login throttle: state file not readable: ' + err.message);
      }
    }
  }

  load();

  return {
    maxFailures: cfg.maxFailures,
    lockoutMs: cfg.lockoutMs,

    // 0 = nicht gesperrt, sonst Restzeit in Millisekunden
    remainingMs: function(username) {
      const k = key(username);
      const e = state.get(k);
      if (!e || !e.lockedUntil) return 0;
      const left = e.lockedUntil - Date.now();
      if (left <= 0) {
        state.delete(k);   // Sperre abgelaufen -> Zähler weg -> wieder 3 freie Versuche
        save();
        return 0;
      }
      return left;
    },

    // liefert die Restzeit in ms, falls dieser Fehlversuch die Sperre ausgelöst hat
    registerFailure: function(username) {
      const k = key(username);
      const e = state.get(k) || { failures: 0, lockedUntil: 0 };
      e.failures += 1;
      let justLocked = 0;
      if (e.failures >= cfg.maxFailures) {
        e.lockedUntil = Date.now() + cfg.lockoutMs;
        e.failures = 0;              // nach Ablauf wieder 3 freie Versuche
        justLocked = cfg.lockoutMs;
      }
      state.set(k, e);
      save();
      return justLocked;
    },

    reset: function(username) {
      if (state.delete(key(username))) save();
    }
  };
};