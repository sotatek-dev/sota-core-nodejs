const fs      = require('fs');
const log4js  = require('log4js');

// TODO: remove global scope of log4js
global.log4js = log4js;

module.exports = function () {
  const logDir = '.logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const tmpDir = '.tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  log4js.configure({
    appenders: {
      out: {
        type: 'console',
        level: process.env.LOG_LEVEL || 'WARN'
      },
      err: {
        type: 'dateFile',
        filename: logDir + '/error.log',
        pattern: '.yyyyMMdd',
        alwaysIncludePattern: false,
      }
    },
    categories: {
      default: {
        appenders: ['out'],
        level: process.env.LOG_LEVEL || 'WARN'
      },
      err: {
        appenders: ['err'],
        level: 'ERROR'
      }
    }
  });

  return log4js;
}