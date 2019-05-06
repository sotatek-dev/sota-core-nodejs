/**
 * Setup logger
 */
const log4js = require('./bootstrap/Logger')();
const logger = log4js.getLogger('SotaCore');
const util = require('util');

/**
 * Expose logger getter
 */
module.exports.getLogger = function(loggerName) {
  return {
    trace: function() {
      return log4js.getLogger(loggerName).trace(...arguments);
    },
    debug: function() {
      return log4js.getLogger(loggerName).debug(...arguments);
    },
    info: function() {
      return log4js.getLogger(loggerName).info(...arguments);
    },
    warn: function() {
      return log4js.getLogger(loggerName).warn(...arguments);
    },
    error: function() {
      const errMsg = arguments[0];
      notifyError('ERROR', errMsg);
      return log4js.getLogger(loggerName).error(...arguments);
    },
    fatal: function() {
      const errMsg = arguments[0];
      notifyError('FATAL', errMsg);
      return log4js.getLogger(loggerName).fatal(...arguments);
    }
  };
};

module.exports.configureLogger = function(config) {
  log4js.configure(config);
};

/**
 * Setup modules loader
 */
const modulesMap = require('./bootstrap/ModuleLoader')(__dirname);

module.exports.load = function(moduleName) {
  if (!modulesMap[moduleName] && !modulesMap[moduleName + '.js']) {
    throw new Error(`Cannot get module: ${moduleName}`);
  }

  return modulesMap[moduleName] || modulesMap[moduleName + '.js'];
};

let instance = null;

module.exports.createApp = function(options) {
  if (instance !== null) {
    throw new Error(`Only support 1 app instance at the same time for now.`);
  }

  const SotaApp = require('./SotaApp');
  instance = new SotaApp(options);
  return instance;
};

module.exports.createServer = function(options) {
  if (instance !== null) {
    throw new Error(`Only support 1 server instance at the same time for now.`);
  }

  const SotaServer = require('./SotaServer');
  instance = new SotaServer(options);
  return instance;
};

module.exports.getInstance = function() {
  return instance;
};

// Expose some core's dependencies to application layer
module.exports.redis = require('redis');
module.exports.Class = require('sota-class').Class;
module.exports.Inteface = require('sota-class').Inteface;

let ERRORS_STASH = [];

function notifyError(level, message) {
  ERRORS_STASH.push({ level, message });
}

setInterval(() => {
  if (!ERRORS_STASH.length) {
    return;
  }

  if (
    !process.env.GOOGLE_MAILER_ACCOUNT ||
    !process.env.GOOGLE_MAILER_PASSWORD ||
    !process.env.OPERATOR_MAIL_RECIPIENT
  ) {
    return;
  }

  const config = util.format(
    'smtps://%s%40gmail.com:%s@smtp.gmail.com',
    process.env.GOOGLE_MAILER_ACCOUNT,
    process.env.GOOGLE_MAILER_PASSWORD
  );

  const transporter = nodemailer.createTransport(config);
  const appName = process.env.APP_NAME || 'SotaTek WebApp';
  const text = ERRORS_STASH.reduce((memo, currenValue) => {
    return memo + '<br />\n' + `[${currenValue.level}] ${currenValue.message}`;
  });

  // TODO: make these fields configurable
  const mailOptions = {
    from: '"SotaTek Error Notifier" <sotatek.test@gmail.com>',
    to: process.env.OPERATOR_MAIL_RECIPIENT,
    subject: `${appName}: Error Notifier`,
    text
  };

  transporter.sendMail(mailOptions, () => {
    ERRORS_STASH = [];
  });
}, 60000);
