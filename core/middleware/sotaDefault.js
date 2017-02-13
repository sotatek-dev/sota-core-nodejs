var passport        = require('passport');
var ExSession       = require('../common/ExSession');
var BaseError       = require('../error/BaseError');
var InternalError   = require('../error/InternalError');

function _purifyEntity(data) {

  if (data === undefined || data === null) {
    return data;
  }

  if (typeof data === 'boolean'  ||
      typeof data === 'number'   ||
      typeof data === 'string'   ||
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
    return _.map(data, function(e) {
      return _purifyEntity(e);
    });
  }

  var ret = {};
  for (p in data) {
    if (data.hasOwnProperty(p)) {
      ret[p] = _purifyEntity(data[p]);
    }
  }

  return ret;
}

function _envelopData(data) {
  data = data || {};

  if (data.hasOwnProperty('data')) {
    return data;
  }

  // Wrap data to envelop if it wasn't done yet
  if (data instanceof BaseEntity) {
    data = {
      data: data.getData()
    };
  } else if (typeof data === 'object') {
    data = {
      data: data
    };
  }

  return data;
}

function _envelopResponse(data) {
  var now = Utils.now();
  if (data instanceof BaseError) {
    return {
      meta: {
        code: -1,
        msg: data.getMsg(),
        extraInfo: data.getExtraInfo(),
        serverTime: now,
      }
    };
  }

  return {
    meta        : {
      code: 0,
      serverTime: now,
      masterdataVersion: LocalCache.getSync('dataVersion') || 1,
    },
    data        : data.data || null,
    pagination  : data.pagination,
    global      : data.global,
  };
}

function _sendResponse(req, data) {
  if (this._isSending) {
    return this._originSend.apply(this, [data]);
  }

  this._isSending = true;

  if (!(data instanceof BaseError)) {
    data = _purifyEntity(data);
    data = _envelopData(data);
  }

  var response = (typeof data === 'object') ? _envelopResponse(data) : data;
  logger.info(req.method + ' ' + req.url + ' Response:\n' + JSON.stringify(response));
  this._originSend.apply(this, [response]);
}

function _sendError(req, error, httpStatus) {
  if (!error) {
    error = new InternalError();
  } else if (typeof error === 'string') {
    error = new InternalError(error);
  } else if (error instanceof Checkit.Error) {
    this.badRequest(error.toString());
  } else if (error instanceof BaseError) {
    // Don't need to do any extra thing...
  } else if (error instanceof Error) {
    logger.error('_sendError error: ' + util.inspect(error));
    error = new InternalError(error.toString());
  } else {
    logger.error('_sendError smt went wrong unkown error type: ' + util.inspect(error));
    error = new InternalError();
  }

  this.status(httpStatus ? httpStatus : error.getHttpStatus())
      .send(error);
}

function extendRequest(req, res) {
  res._originSend = res.send;
  res.send        = _sendResponse.bind(res, req);
  res.sendError   = _sendError.bind(res, req);

  req.exSession   = new ExSession({
    user: req.user,
    useLocalCache: true,
  });
  req.getService  = function(name) {
    return req.exSession.getService(name);
  };

  req.getModel    = function(name) {
    return req.exSession.getModel(name);
  };

  req.isAuthenticated = function() {
    return !!(req.user && req.user.id);
  };

  req.commit      = function(callback) {
    return req.exSession.commit(callback);
  };

  req.commit_promisified = bb.promisify(req.commit);

  req.rollback    = function(err, callback) {
    var error = err;
    if (typeof err === 'function') {
      callback = err;
      error = ErrorFactory.internal();
    }

    if (!callback) {
      callback = function() {
        res.sendError(error);
      };
    }

    return req.exSession.rollback(callback);
  };

  req.__endTimeout = setTimeout(function() {
    res.sendError('Request timeout.');
  }, Const.DEFAULT_REQUEST_TIMEOUT);
}

function extendResponse(req, res) {

  // OK response
  res.ok = function(body) {
    res.status(200).send(body || {});
  };
  res.created = function(body) {
    res.status(201).send(body || {});
  };
  res.accepted = function(body) {
    res.status(202).send(body);
  };
  res.noContent = function(body) {
    res.status(204).send(body || {});
  };
  res.deleted = function() {
    // TODO: 200 or 204 status?
    res.ok({deleted: true});
    // res.noContent();
  };

  // Error response
  res.badRequest = function(body) {
    res.sendError(body, 400);
  };
  res.unauthorized = function(body) {
    res.sendError(body, 401);
  };
  res.forbidden = function(body) {
    res.sendError(body, 403);
  };
  res.notFound = function(body) {
    if (req.headers.accept && req.headers.accept.match(/application\/json/)) {
      res.sendError(body, 404);
    } else {
      res.status(404).render('404');
    }
  };

  var end = res.end;
  res.end = function(data, encoding) {
    clearTimeout(req.__endTimeout);
    res.end = end;

    // var finishMethod = 'rollback';
    // if (req._needCommit) {
    //   finishMethod = 'commit';
    // }

    /**
     * We just try to commit in all requests
     */
     var finishMethod = 'commit';

    req.exSession[finishMethod](function() {
      req.exSession.destroy();
      delete req.exSession;
      delete req.allParams;
      delete req.pagination;

      res.end(data, encoding);
    });
  };
}

function tryAuthenticate(req, res, next) {
  passport.authenticate('jwt', {
    session: false
  }, function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (user && typeof user === 'object') {
      req.user = user;
    }

    next();

  })(req, res, next);
};

module.exports = function() {

  return function(req, res, next) {
    tryAuthenticate(req, res, function(err) {
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
      next();
    });
  };

};
