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

  const logConfig = {
    replaceConsole: true,
    appenders: [
      {
        type: 'logLevelFilter',
        level: process.env.LOG_LEVEL || 'WARN',
        appender: {
          type: 'console'
        }
      },
      {
        type: 'logLevelFilter',
        level: 'ERROR',
        appender: {
          type: 'dateFile',
          filename: logDir + '/error.log',
          pattern: '.yyyyMMdd',
          alwaysIncludePattern: false
        }
      }
    ]
  };
  log4js.configure(logConfig);

  return log4js;
}