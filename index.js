/**
 * Setup logger
 */
const log4js = require('./bootstrap/Logger')();
const logger = log4js.getLogger('SotaCore');
const util = require('util');
const nodemailer = require('nodemailer');
const moment = require('moment');

/**
 * Expose logger getter
 */
module.exports.getLogger = function(loggerName) {
  const logger = log4js.getLogger(loggerName);
  return {
    trace: function() {
      return logger.trace(...arguments);
    },
    debug: function() {
      return logger.debug(...arguments);
    },
    info: function() {
      return logger.info(...arguments);
    },
    warn: function() {
      return logger.warn(...arguments);
    },
    error: function(errMsg, ...params) {
      if (errMsg instanceof Error) {
        errMsg = util.inspect(errMsg);
      }

      logError('ERROR', errMsg);
      return logger.error(errMsg, params);
    },
    fatal: function(errMsg, ...params) {
      if (errMsg instanceof Error) {
        errMsg = util.inspect(errMsg);
      }

      logError('FATAL', errMsg);
      return logger.fatal(errMsg, params);
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

function logError(level, message) {
  const timestamp = Date.now();
  ERRORS_STASH.push({ timestamp, level, message });
}

function sendErrorToOperator(callback) {
  if (!ERRORS_STASH.length) {
    if (typeof callback === 'function') {
      callback();
    }
    return;
  }

  const account = process.env.GOOGLE_MAILER_ACCOUNT;
  const password = process.env.GOOGLE_MAILER_PASSWORD;
  const recipient = process.env.OPERATOR_MAIL_RECIPIENT;

  if (!account || !password || !recipient) {
    if (typeof callback === 'function') {
      callback();
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: account,
      pass: password
    }
  });

  const appName = process.env.APP_NAME || 'SotaTek WebApp';
  const content = ERRORS_STASH.reduce((memo, val) => {
    return memo + '<br />\n' + `${moment(val.timestamp).format()} <b>[${val.level}]</b> ${val.message}`;
  }, '');

  // TODO: make these fields configurable
  const mailOptions = {
    from: `"SotaTek Error Notifier" <${account}>`,
    to: recipient,
    subject: `${appName}: Error Notifier`,
    html: content
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(`SEND EMAIL ERROR:`);
      console.error(err);
    } else {
      console.log(`SEND EMAIL FINISH: ${JSON.stringify(info)}`);
    }

    ERRORS_STASH = [];

    if (typeof callback === 'function') {
      callback();
    }
  });
}

setInterval(sendErrorToOperator, 60000);

module.exports.exitGracefullyDueToError = function() {
  sendErrorToOperator(() => {
    process.exit(1);
  });
};
