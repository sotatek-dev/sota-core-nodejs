const _                   = require('lodash');
const util                = require('util');
const passport            = require('passport');
const Checkit             = require('cc-checkit');
const Utils               = require('../util/Utils');
const ExSession           = require('../common/ExSession');
const BaseError           = require('../error/BaseError');
const InternalError       = require('../error/InternalError');
const ErrorFactory        = require('../error/ErrorFactory');
const BaseEntity          = require('../entity/BaseEntity');
const LocalCache          = require('../cache/foundation/LocalCache');
const Const               = require('../common/Const');
const logger              = require('../index').getLogger('Core.sotaDefault');

/**
 * HERE COMES VERY UGLY CODE...
 * TODO: FIX ME PLEASE!!!!!!!
 */

function _purifyEntity(data) {
  if (data === undefined || data === null) {
    return data;
  }

  if (typeof data === 'boolean' ||
      typeof data === 'number' ||
      typeof data === 'string' ||
      typeof data === 'undefined') {
    return data;
  }

  if (typeof data === 'function') {
    return 'function';
  }

  if (data instanceof BaseEntity) {
    return data.toJSON();
  }

  if (_.isArray(data)) {
    return _.map(data, function (e) {
      return _purifyEntity(e);
    });
  }

  const ret = {};
  for (let p in data) {
    if (data.hasOwnProperty(p)) {
      ret[p] = _purifyEntity(data[p]);
    }
  }

  return ret;
}

function _sendResponse(req, res, data) {
  if (res._isSending) {
    return res._originalSend(data);
  }

  res._isSending = true;

  if (!(data instanceof BaseError)) {
    data = _purifyEntity(data);
  }

  const userId = req.user ? req.user.id : 0;
  logger.info(`${req.method} ${req.url} | Params: ${JSON.stringify(req.allParams)} | User: ${userId} | Response: ${JSON.stringify(data)}`);

  // Prevent original send method recognizes data as http status
  // In the case data is a number
  if (typeof data === 'number') {
    data = data.toString();
  }

  res._originalSend(data);
}

function _sendError(req, res, error, httpStatus) {
  if (!error) {
    error = new InternalError();
  } else if (typeof error === 'string') {
    error = new InternalError(error);
  } else if (error instanceof Checkit.Error) {
    res.badRequest(error.toString());
  } else if (error instanceof BaseError) {
    // Don't need to do any extra thing...
    logger.trace('_sendError error: ' + util.inspect(error));
  } else if (error instanceof Error) {
    logger.error('_sendError error: ' + util.inspect(error));
    error = new InternalError(error.toString());
  } else {
    logger.error('_sendError smt went wrong unkown error type: ' + util.inspect(error));
    error = new InternalError();
  }

  let accept = req.headers.accept;
  if (accept &&
    accept.indexOf('json') === -1 && (
      accept.indexOf('text') > -1 ||
      accept.indexOf('html') > -1 ||
      accept.indexOf('xml') > -1)) {
    return res.render(error.getHttpStatus().toString(), error.toJSON());
  }

  res.status(httpStatus || error.getHttpStatus())
      .send(error);
}

function extendRequest(req, res) {
  res._originalSend = res.send;
  res.send = _sendResponse.bind(null, req, res);
  res.sendError = _sendError.bind(null, req, res);

  req.exSession = new ExSession({
    user: req.user,
    useLocalCache: true
  });

  req.getService = function (name) {
    return req.exSession.getService(name);
  };

  req.getModel = function (name) {
    return req.exSession.getModel(name);
  };

  req.isAuthenticated = function () {
    return !!(req.user && req.user.id);
  };

  req.commit = function (callback) {
    return req.exSession.commit(callback);
  };

  req.rollback = function (err, callback) {
    if (typeof err === 'function') {
      callback = err;
      err = ErrorFactory.internal();
    }

    if (!callback) {
      callback = function () {
        res.sendError(err);
      };
    }

    /**
     * In case ending function is come first by timeout
     * req.exSession is deleted and cannot be invoked anymore
     */
    if (req.exSession) {
      return req.exSession.rollback(callback);
    }
  };

  req.__endTimeout = setTimeout(() => {
    req.rollback(() => {
      res.sendError('Request timeout.');
    });
  }, Const.DEFAULT_REQUEST_TIMEOUT);
}

function extendResponse(req, res) {
  // OK response
  res.ok = function (body) {
    res.status(200).send(body);
  };

  res.created = function (body) {
    res.status(201).send(body);
  };

  res.accepted = function (body) {
    res.status(202).send(body);
  };

  res.noContent = function (body) {
    res.sendStatus(204);
  };

  res.deleted = function () {
    res.noContent()
  };

  // Error response
  res.badRequest = function (body) {
    res.sendError(body, 400);
  };

  res.unauthorized = function (body) {
    res.sendError(body, 401);
  };

  res.forbidden = function (body) {
    res.sendError(body, 403);
  };

  res.notFound = function (body) {
    if (req.headers.accept && req.headers.accept.match(/application\/json/)) {
      res.sendError(body, 404);
    } else {
      res.status(404).render('404');
    }
  };

  const originalEnd = res.end;
  res.end = (data, encoding) => {
    clearTimeout(req.__endTimeout);
    res.end = originalEnd;

    // let finishMethod = 'rollback'
    // if (req._needCommit) {
    //   finishMethod = 'commit'
    // }

    /**
     * We just try to commit in all requests
     */
    let finishMethod = 'commit';

    req.exSession[finishMethod](function () {
      req.exSession.destroy();
      delete req.exSession;
      delete req.allParams;
      delete req.pagination;

      res.end(data, encoding);
    });
  };
}

function tryAuthenticate(config, req, res, next) {
  if (config.usePassport === false) {
    return next(null, null);
  }

  passport.authenticate('jwt', {
    session: false
  }, function (err, user, info) {
    if (err) {
      return next(err);
    }

    if (user && typeof user === 'object') {
      req.user = user;
    }

    next();
  })(req, res, next);
}

module.exports = function (app, config) {
  return function (req, res, next) {
    tryAuthenticate(config, req, res, function (err) {
      if (err) {
        if (err instanceof BaseError) {
          res.status(err.getHttpStatus())
              .send(err);
          return;
        }

        return next(err);
      }

      extendRequest(req, res);
      extendResponse(req, res);
      next(null, null);
    });
  };
};
