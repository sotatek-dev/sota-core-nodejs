var _               = require('lodash');
var ExSession       = require('../common/ExSession');
var BaseError       = require('../error/BaseError');

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
  if (!data.code) { // No error
    return {
      meta        : {
        code: 0,
        serverTime : Utils.now(),
        masterdataVersion: LocalCache.get('dataVersion') || 1,
      },
      data        : data.data || null,
      pagination  : data.pagination,
      global      : data.global,
    };
  } else { // Send error
    return {
      meta : {
        code        : data.code,
        msg         : data.msg,
        serverTime  : Utils.now(),
      }
    };
  }
}

function _sendResponse(req, data) {
  if (this._isSending) {
    return this._originSend.apply(this, [data]);
  }

  this._isSending = true;

  data = _purifyEntity(data);
  data = _envelopData(data);

  var response = (typeof data === 'object') ? _envelopResponse(data) : data;
  logger.trace(req.method + ' ' + req.url + ' Response:\n' + JSON.stringify(response));
  this._originSend.apply(this, [response]);
}

function _sendError(req, error, httpStatus) {
  if (!error) {
    error = new BaseError();
  } else if (typeof error === 'string') {
    error = new BaseError(error);
  } else if (error instanceof Error) {
    logger.error('_sendError error: ' + util.inspect(error));
    error = new BaseError(error.toString());
  } else if (!(error instanceof BaseError)) {
    logger.error('_sendError smt went wrong unkown error type: ' + util.inspect(error));
    error = new BaseError();
  }

  this.status(httpStatus ? httpStatus : error.getHttpStatus())
      .send({
        code : error.getCode(),
        msg  : error.getMsg(),
      });
}

function extendParams(req) {
  if (!req.params) {
    req.params = {};
  }

  // Retreive auth token from header if cannot find that parameter anywhere else
  if (req.headers['x-auth-token'] && !req.body.auth_token && !req.query.auth_token) {
    req.params.auth_token = req.headers['x-auth-token'];
  }

  if (!_.isEmpty(req.query)) {
    for (let k in req.query) {
      // req.params[Utils.convertToCamelCase(k)] = req.query[k];
      req.params[k] = req.query[k];
    }
  }

  if (!_.isEmpty(req.body)) {
    for (let k in req.body) {
      // req.params[Utils.convertToCamelCase(k)] = req.body[k];
      req.params[k] = req.body[k];
    }
  }
}

function extendRequest(req, res) {
  res._originSend = res.send;
  res.send        = _sendResponse.bind(res, req);
  res.sendError   = _sendError.bind(res, req);

  req.exSession   = new ExSession({user: req.user});
  req.getService  = function(name) {
    return req.exSession.getService(name);
  };

  req.getModel    = function(name) {
    return req.exSession.getModel(name);
  };

  req.commit      = function(callback) {
    return req.exSession.commit(callback);
  };

  req.rollback    = function(err, callback) {
    if (typeof err === 'function') {
      callback = err;
    }

    if (!callback) {
      callback = function() {
        res.sendError(err);
      }
    }

    return req.exSession.rollback(callback);
  };
}

function extendResponse(req, res) {

  // OK response
  res.ok = function(body) {
    res.status(200).send(body || {});
  };
  res.created = function(body) {
    res.status(201).send(body || {});
  };
  res.noContent = function(body) {
    res.status(204).send(body || {});
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
    res.end = end;

    req.exSession.destroy();
    delete req.exSession;

    res.end(data, encoding);
  };
}

module.exports = function(req, res, next) {
  extendParams(req, res);
  extendRequest(req, res);
  extendResponse(req, res);

  next();
};
